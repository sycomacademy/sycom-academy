@description('Flexible Server name. Must be globally unique.')
param serverName string

@description('Application database created on the server.')
param databaseName string

param administratorLogin string

@secure()
param administratorPassword string

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

// Deliberately no firewall rules here, which leaves the server default-deny.
// scripts/postprovision.sh adds a rule for the container app's real outbound IPs
// (read from the deployed app, since they differ from the environment's static
// inbound IP) and adds/removes the operator IP around the migration step.

output name string = server.name
output id string = server.id
output fullyQualifiedDomainName string = server.properties.fullyQualifiedDomainName
output databaseName string = database.name
