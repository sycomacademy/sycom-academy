// Private networking for the stack. Exists because a Consumption Container Apps
// environment egresses from a shared pool of ~161 addresses, which cannot be
// expressed as a Postgres firewall allowlist. VNet integration replaces the
// allowlist with private connectivity.
@description('Virtual network name.')
param vnetName string

@description('Address space. 10.20.0.0/16 is unused in this subscription.')
param addressPrefix string = '10.20.0.0/16'

@description('Subnet that hosts the Container Apps environment infrastructure.')
param containerAppsSubnetPrefix string = '10.20.0.0/23'

@description('Subnet that hosts private endpoints.')
param privateEndpointSubnetPrefix string = '10.20.2.0/28'

@description('Subnet for the Tailscale subnet router that gives developer tooling access to the private database.')
param managementSubnetPrefix string = '10.20.2.16/28'

param location string
param tags object

var postgresPrivateDnsZoneName = 'privatelink.postgres.database.azure.com'

resource vnet 'Microsoft.Network/virtualNetworks@2024-05-01' = {
  name: vnetName
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        addressPrefix
      ]
    }
    subnets: [
      {
        name: 'snet-container-apps'
        properties: {
          addressPrefix: containerAppsSubnetPrefix
          // Required for a workload-profiles environment. /23 leaves room to
          // move off Consumption later without re-addressing.
          delegations: [
            {
              name: 'container-apps-delegation'
              properties: {
                serviceName: 'Microsoft.App/environments'
              }
            }
          ]
        }
      }
      {
        name: 'snet-private-endpoints'
        properties: {
          addressPrefix: privateEndpointSubnetPrefix
          privateEndpointNetworkPolicies: 'Disabled'
        }
      }
      {
        name: 'snet-management'
        properties: {
          addressPrefix: managementSubnetPrefix
          // Tailscale is outbound-only and has to reach its coordination servers,
          // so the subnet needs egress. Set explicitly rather than inherited:
          // subnets in virtual networks created with newer API versions default to
          // private, and silently losing egress here would strand the router.
          defaultOutboundAccess: true
        }
      }
    ]
  }
}

resource postgresPrivateDnsZone 'Microsoft.Network/privateDnsZones@2024-06-01' = {
  name: postgresPrivateDnsZoneName
  location: 'global'
  tags: tags
}

// Without this link the app resolves the public name and gets no answer.
resource postgresDnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2024-06-01' = {
  parent: postgresPrivateDnsZone
  name: '${vnetName}-link'
  location: 'global'
  tags: tags
  properties: {
    virtualNetwork: {
      id: vnet.id
    }
    registrationEnabled: false
  }
}

output vnetId string = vnet.id
output addressPrefix string = addressPrefix
output vnetName string = vnet.name
output containerAppsSubnetId string = vnet.properties.subnets[0].id
output privateEndpointSubnetId string = vnet.properties.subnets[1].id
output managementSubnetId string = vnet.properties.subnets[2].id
output postgresPrivateDnsZoneId string = postgresPrivateDnsZone.id
