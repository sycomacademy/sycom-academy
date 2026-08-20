// Identity GitHub Actions authenticates as, via OIDC.
//
// A user-assigned managed identity rather than an Entra app registration: managed
// identities accept federated credentials directly, and creating one needs only
// Contributor on this resource group. An app registration would need directory
// permissions the deploying identity does not have. See infra/README.md.
@description('Name of the managed identity CI authenticates as.')
param name string

@description('GitHub repository in owner/repo form.')
param repository string

@description('Numeric owner and repository ids, as owner@ownerId/repo@repoId. GitHub now qualifies the OIDC subject with these, so the credential has to match. Read it from the repo API, see infra/README.md. Empty to register only the unqualified subject.')
param repositoryWithIds string = ''

@description('Branch permitted to deploy. Only this ref can exchange a token.')
param branch string = 'main'

param location string
param tags object

// Both subject forms are registered. GitHub currently presents the id-qualified
// one, which is the stricter of the two — deleting and recreating the repository
// under the same name would produce new ids and stop matching. The unqualified
// form is kept so a change of subject-claim template does not break deploys.
var subjects = union(
  ['repo:${repository}:ref:refs/heads/${branch}'],
  empty(repositoryWithIds) ? [] : ['repo:${repositoryWithIds}:ref:refs/heads/${branch}']
)

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: name
  location: location
  tags: tags
}

// Scoped to one repo and one branch: a workflow on any other ref, and any pull
// request from a fork, gets no token at all.
@batchSize(1)
resource federatedCredentials 'Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials@2023-01-31' = [
  for (subject, index) in subjects: {
    parent: identity
    name: 'github-${branch}-${index}'
    properties: {
      issuer: 'https://token.actions.githubusercontent.com'
      subject: subject
      audiences: [
        'api://AzureADTokenExchange'
      ]
    }
  }
]

output name string = identity.name
output id string = identity.id
output clientId string = identity.properties.clientId
output principalId string = identity.properties.principalId
output subjects array = subjects
