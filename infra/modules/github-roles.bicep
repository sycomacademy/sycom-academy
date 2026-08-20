// What CI is allowed to do: push images, and replace the image on exactly two
// resources. Deliberately not Contributor on the resource group — a leaked
// workflow cannot touch the database, the vault or the network.
@description('Existing registry CI pushes images to.')
param registryName string

@description('Existing container app CI updates.')
param containerAppName string

@description('Existing migration job CI updates and starts.')
param migrationJobName string

@description('Principal id of the CI managed identity.')
param principalId string

var acrPushRoleDefinitionId = '8311e382-0749-4cb8-b61a-304f252e45ec'
var contributorRoleDefinitionId = 'b24988ac-6180-42a0-ab88-20f7382dd24c'

resource registry 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' existing = {
  name: registryName
}

resource containerApp 'Microsoft.App/containerApps@2024-03-01' existing = {
  name: containerAppName
}

resource migrationJob 'Microsoft.App/jobs@2024-03-01' existing = {
  name: migrationJobName
}

resource acrPush 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(registry.id, principalId, acrPushRoleDefinitionId)
  scope: registry
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPushRoleDefinitionId)
    principalId: principalId
    principalType: 'ServicePrincipal'
  }
}

// Contributor rather than a narrower built-in: replacing a revision's image needs
// containerApps/write, and no built-in role grants that alone. The scope is the
// single app, so the blast radius is that app.
resource appContributor 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(containerApp.id, principalId, contributorRoleDefinitionId)
  scope: containerApp
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', contributorRoleDefinitionId)
    principalId: principalId
    principalType: 'ServicePrincipal'
  }
}

resource jobContributor 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(migrationJob.id, principalId, contributorRoleDefinitionId)
  scope: migrationJob
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', contributorRoleDefinitionId)
    principalId: principalId
    principalType: 'ServicePrincipal'
  }
}
