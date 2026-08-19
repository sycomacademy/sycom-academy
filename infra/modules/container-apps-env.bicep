@description('Container Apps environment name.')
param name string

@description('Existing Log Analytics workspace that receives console and system logs.')
param logAnalyticsName string

@description('Delegated subnet for the environment infrastructure. VNet integration cannot be added to an existing environment, so this is fixed at creation.')
param infrastructureSubnetId string

param location string
param tags object

// Referenced as existing so the shared key is read here rather than passed
// between modules as an output.
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' existing = {
  name: logAnalyticsName
}

resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
    vnetConfiguration: {
      infrastructureSubnetId: infrastructureSubnetId
      // Ingress stays public so users reach the app directly; only egress and
      // the path to Postgres move inside the VNet.
      internal: false
    }
    workloadProfiles: [
      {
        name: 'Consumption'
        workloadProfileType: 'Consumption'
      }
    ]
    zoneRedundant: false
  }
}

output name string = containerAppsEnvironment.name
output id string = containerAppsEnvironment.id
output defaultDomain string = containerAppsEnvironment.properties.defaultDomain
output staticIp string = containerAppsEnvironment.properties.staticIp
