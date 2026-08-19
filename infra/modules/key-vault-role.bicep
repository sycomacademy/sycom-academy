@description('Existing Key Vault to grant access on.')
param keyVaultName string

@description('Principal id of the container app managed identity. Gets read-only access.')
param appPrincipalId string

@description('Object id of a human or CI principal that may manage secrets. Empty to skip.')
param developerPrincipalId string = ''

var secretsUserRoleDefinitionId = '4633458b-17de-408a-b874-0445c86b69e6'
var secretsOfficerRoleDefinitionId = 'b86a8fe4-44ce-4948-aee5-eccb2c155cd7'

resource vault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

resource appSecretsUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(vault.id, appPrincipalId, secretsUserRoleDefinitionId)
  scope: vault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', secretsUserRoleDefinitionId)
    principalId: appPrincipalId
    principalType: 'ServicePrincipal'
  }
}

resource developerSecretsOfficer 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(developerPrincipalId)) {
  name: guid(vault.id, developerPrincipalId, secretsOfficerRoleDefinitionId)
  scope: vault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', secretsOfficerRoleDefinitionId)
    principalId: developerPrincipalId
  }
}
