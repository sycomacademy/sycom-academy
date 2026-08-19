// Gives the Postgres server a private IP inside the VNet and registers it in the
// privatelink zone, so the public hostname resolves privately from inside the
// VNet and nowhere else. This is what lets publicNetworkAccess stay Disabled
// without changing the connection string.
@description('Private endpoint name.')
param name string

@description('Resource id of the Flexible Server.')
param postgresServerId string

@description('Subnet that hosts the private endpoint. Must have private endpoint network policies disabled.')
param subnetId string

@description('Resource id of the privatelink.postgres.database.azure.com zone.')
param privateDnsZoneId string

param location string
param tags object

resource privateEndpoint 'Microsoft.Network/privateEndpoints@2024-05-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    subnet: {
      id: subnetId
    }
    privateLinkServiceConnections: [
      {
        name: '${name}-connection'
        properties: {
          privateLinkServiceId: postgresServerId
          groupIds: [
            'postgresqlServer'
          ]
        }
      }
    ]
  }
}

resource dnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2024-05-01' = {
  parent: privateEndpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'postgres'
        properties: {
          privateDnsZoneId: privateDnsZoneId
        }
      }
    ]
  }
}

output id string = privateEndpoint.id
output name string = privateEndpoint.name
