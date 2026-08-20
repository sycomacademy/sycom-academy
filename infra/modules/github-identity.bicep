// Identity GitHub Actions authenticates as, via OIDC.
//
// A user-assigned managed identity rather than an Entra app registration: managed
// identities accept federated credentials directly, and creating one needs only
// Contributor on this resource group. An app registration would need directory
// permissions the deploying identity does not have. See infra/README.md.
@description('Name of the managed identity CI authenticates as.')
param name string

@description('GitHub repository in owner/repo form. Determines which repo can assume this identity.')
param repository string

@description('Branch permitted to deploy. Only this ref can exchange a token.')
param branch string = 'main'

param location string
param tags object

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: name
  location: location
  tags: tags
}

// Scoped to one repo and one branch: a workflow on any other ref, and any pull
// request from a fork, gets no token at all.
resource federatedCredential 'Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials@2023-01-31' = {
  parent: identity
  name: 'github-${branch}'
  properties: {
    issuer: 'https://token.actions.githubusercontent.com'
    subject: 'repo:${repository}:ref:refs/heads/${branch}'
    audiences: [
      'api://AzureADTokenExchange'
    ]
  }
}

output name string = identity.name
output id string = identity.id
output clientId string = identity.properties.clientId
output principalId string = identity.properties.principalId
