@description('Key Vault name. Globally unique, 3-24 alphanumeric characters and hyphens.')
param name string

param location string
param tags object

@secure()
param databaseUrl string

@secure()
param postgresAdminPassword string

@secure()
param betterAuthSecret string

resource vault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    // RBAC rather than access policies, so grants are auditable alongside every
    // other role assignment.
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

// Written through the ARM control plane, which is why seeding them needs no
// data-plane role on the vault.
resource databaseUrlSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: vault
  name: 'database-url'
  properties: {
    value: databaseUrl
    contentType: 'text/plain'
  }
}

resource postgresPasswordSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: vault
  name: 'postgres-admin-password'
  properties: {
    value: postgresAdminPassword
    contentType: 'text/plain'
  }
}

resource betterAuthSecretEntry 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: vault
  name: 'better-auth-secret'
  properties: {
    value: betterAuthSecret
    contentType: 'text/plain'
  }
}

output name string = vault.name
output id string = vault.id
output uri string = vault.properties.vaultUri
