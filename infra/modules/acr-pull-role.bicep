// Separate module so neither the registry nor the container app depends on this
// assignment, which is what breaks the circular dependency.
@description('Existing registry to grant pull access on.')
param registryName string

@description('Principal id of the container app managed identity.')
param principalId string

var acrPullRoleDefinitionId = '7f951dda-4ed3-4680-a7ca-43fe172d538d'

resource registry 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' existing = {
  name: registryName
}

resource acrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(registry.id, principalId, acrPullRoleDefinitionId)
  scope: registry
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleDefinitionId)
    principalId: principalId
    // Declared explicitly to skip the Graph lookup and speed up propagation.
    principalType: 'ServicePrincipal'
  }
}
