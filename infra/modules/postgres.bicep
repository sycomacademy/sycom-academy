@description('Flexible Server name. Must be globally unique.')
param serverName string

@description('Application database created on the server.')
param databaseName string

param administratorLogin string

@secure()
param administratorPassword string

@description('Object id of the Entra principal that administers the database. Empty to skip.')
param entraAdminObjectId string = ''

@description('Display name or UPN of the Entra administrator. Must match exactly; it is the username you connect with.')
param entraAdminPrincipalName string = ''

@description('Kind of Entra principal: User, Group or ServicePrincipal.')
@allowed([
  'User'
  'Group'
  'ServicePrincipal'
])
param entraAdminPrincipalType string = 'User'

param location string
param tags object

resource server 'Microsoft.DBforPostgreSQL/flexibleServers@2024-08-01' = {
  name: serverName
  location: location
  tags: tags
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '18'
    createMode: 'Default'
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorPassword
    storage: {
      storageSizeGB: 32
      autoGrow: 'Enabled'
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
    network: {
      // Reachable only through the private endpoint in
      // modules/postgres-private-endpoint.bicep. No firewall allowlist exists,
      // and no address on the internet can open a connection.
      publicNetworkAccess: 'Disabled'
    }
    authConfig: {
      // Password auth is required because Drizzle connects over node-postgres
      // with a connection string. Entra auth stays on so operators can connect
      // without the shared password.
      passwordAuth: 'Enabled'
      activeDirectoryAuth: 'Enabled'
      tenantId: subscription().tenantId
    }
  }
}

resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2024-08-01' = {
  parent: server
  name: databaseName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// Declared here rather than created with `az postgres flexible-server ad-admin`,
// so it is idempotent and cannot drift. This is the human path into the database:
// connect with this principal's UPN as the username and an Entra access token as
// the password. The local admin account stays for break-glass only.
resource entraAdmin 'Microsoft.DBforPostgreSQL/flexibleServers/administrators@2024-08-01' = if (!empty(entraAdminObjectId)) {
  parent: server
  name: entraAdminObjectId
  properties: {
    principalName: entraAdminPrincipalName
    principalType: entraAdminPrincipalType
    tenantId: subscription().tenantId
  }
  dependsOn: [
    database
  ]
}

// No firewall rules by design: public access is disabled entirely, so there is
// no allowlist to maintain and no drift when Azure changes the Container Apps
// egress pool. Migrations run from inside the VNet via the Container Apps job in
// modules/migration-job.bicep.

output name string = server.name
output id string = server.id
output fullyQualifiedDomainName string = server.properties.fullyQualifiedDomainName
output databaseName string = database.name
