// Alpha stack for the sycom-learn rebuild.
//
// Scoped to a resource group rather than the subscription because the deploying
// identity holds Contributor on sycomlearn-prod-rg only. azd must therefore have
// AZURE_RESOURCE_GROUP set. See .azure/deployment-plan.md section 6b.
targetScope = 'resourceGroup'

@minLength(1)
@description('Name of the azd environment. Used for tagging only.')
param environmentName string

@minLength(1)
@description('Region for all resources.')
param location string = resourceGroup().location

@minLength(4)
@maxLength(16)
@description('Prefix applied to every resource name. Kept distinct from the sycomlearn-* resources already in this group.')
param resourcePrefix string = 'sycomacademy'

@description('PostgreSQL administrator login.')
param postgresAdminLogin string = 'sycomadmin'

@secure()
@minLength(16)
@description('PostgreSQL administrator password. Supplied by azd from the environment, never committed.')
param postgresAdminPassword string

@secure()
@minLength(32)
@description('Better Auth signing secret. Supplied by azd from the environment, never committed.')
param betterAuthSecret string

@description('Object id of the human or CI principal that should be able to read Key Vault secrets. Leave empty to skip.')
param principalId string = ''

var serviceName = 'dashboard'
var databaseName = 'sycom'
var alphanumericPrefix = replace(resourcePrefix, '-', '')

var tags = {
  'azd-env-name': environmentName
  workload: 'sycom-academy'
  managedBy: 'azd-bicep'
}

module monitoring './modules/monitoring.bicep' = {
  name: 'monitoring'
  params: {
    logAnalyticsName: '${resourcePrefix}-logs'
    applicationInsightsName: '${resourcePrefix}-appi'
    location: location
    tags: tags
  }
}

module containerRegistry './modules/container-registry.bicep' = {
  name: 'containerRegistry'
  params: {
    name: '${alphanumericPrefix}acr01'
    location: location
    tags: tags
  }
}

module postgres './modules/postgres.bicep' = {
  name: 'postgres'
  params: {
    serverName: '${resourcePrefix}-postgres'
    databaseName: databaseName
    administratorLogin: postgresAdminLogin
    administratorPassword: postgresAdminPassword
    location: location
    tags: tags
  }
}

// Assembled here so the password never leaves a secure parameter path.
var databaseUrl = 'postgresql://${postgresAdminLogin}:${postgresAdminPassword}@${postgres.outputs.fullyQualifiedDomainName}:5432/${databaseName}?sslmode=require'

module keyVault './modules/key-vault.bicep' = {
  name: 'keyVault'
  params: {
    name: '${alphanumericPrefix}kv01'
    location: location
    tags: tags
    databaseUrl: databaseUrl
    postgresAdminPassword: postgresAdminPassword
    betterAuthSecret: betterAuthSecret
  }
}

module containerAppsEnvironment './modules/container-apps-env.bicep' = {
  name: 'containerAppsEnvironment'
  params: {
    name: '${resourcePrefix}-cae'
    logAnalyticsName: monitoring.outputs.logAnalyticsName
    location: location
    tags: tags
  }
}

// Phase 1: the app is created with a public placeholder image and no registries
// block. azd deploy links the registry to the system-assigned identity and swaps
// in the real image once it has been pushed.
module dashboard './modules/container-app.bicep' = {
  name: 'dashboard'
  params: {
    name: '${resourcePrefix}-app'
    serviceName: serviceName
    containerAppsEnvironmentId: containerAppsEnvironment.outputs.id
    containerAppsEnvironmentDefaultDomain: containerAppsEnvironment.outputs.defaultDomain
    applicationInsightsConnectionString: monitoring.outputs.applicationInsightsConnectionString
    databaseUrl: databaseUrl
    betterAuthSecret: betterAuthSecret
    location: location
    tags: tags
  }
}

// Phase 2: role assignments live in their own modules so nothing in phase 1
// depends on them, which is what keeps the AcrPull grant from becoming circular.
module acrPullRole './modules/acr-pull-role.bicep' = {
  name: 'acrPullRole'
  params: {
    registryName: containerRegistry.outputs.name
    principalId: dashboard.outputs.principalId
  }
}

module keyVaultSecretsRole './modules/key-vault-role.bicep' = {
  name: 'keyVaultSecretsRole'
  params: {
    keyVaultName: keyVault.outputs.name
    appPrincipalId: dashboard.outputs.principalId
    developerPrincipalId: principalId
  }
}

output AZURE_LOCATION string = location
output AZURE_TENANT_ID string = subscription().tenantId
output AZURE_RESOURCE_GROUP string = resourceGroup().name

output AZURE_CONTAINER_REGISTRY_ENDPOINT string = containerRegistry.outputs.loginServer
output AZURE_CONTAINER_REGISTRY_NAME string = containerRegistry.outputs.name
output AZURE_CONTAINER_APPS_ENVIRONMENT_NAME string = containerAppsEnvironment.outputs.name

output AZURE_KEY_VAULT_NAME string = keyVault.outputs.name
output AZURE_KEY_VAULT_ENDPOINT string = keyVault.outputs.uri

output POSTGRES_HOST string = postgres.outputs.fullyQualifiedDomainName
output POSTGRES_SERVER_NAME string = postgres.outputs.name
output POSTGRES_DATABASE string = databaseName
output POSTGRES_ADMIN_LOGIN string = postgresAdminLogin

output SERVICE_DASHBOARD_NAME string = dashboard.outputs.name
output SERVICE_DASHBOARD_URI string = dashboard.outputs.uri
output BETTER_AUTH_URL string = dashboard.outputs.uri
