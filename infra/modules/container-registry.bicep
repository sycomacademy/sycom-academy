@description('Registry name. Alphanumeric only, 5-50 characters.')
param name string

param location string
param tags object

resource registry 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: name
  location: location
  tags: tags
  sku: {
    name: 'Basic'
  }
  properties: {
    // The container app pulls with its managed identity, so there is no admin
    // credential to leak.
    adminUserEnabled: false
    anonymousPullEnabled: false
    publicNetworkAccess: 'Enabled'
  }
}

output name string = registry.name
output id string = registry.id
output loginServer string = registry.properties.loginServer
