// Alpha stack for the sycom-learn rebuild.
//
// Scoped to a resource group rather than the subscription because the deploying
// identity holds Contributor on sycomlearn-prod-rg only, and that assignment is
// PIM-eligible rather than permanent. azd must therefore have AZURE_RESOURCE_GROUP
// set. See infra/README.md.
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

@description('UPN of the developer who administers the database through Entra ID. Must match exactly; it is the username you connect with.')
param developerPrincipalName string = ''

@description('GitHub repository allowed to deploy, in owner/repo form.')
param githubRepository string = 'sycomacademy/sycom-academy'

@description('Branch allowed to deploy. Only workflows on this ref can obtain a token.')
param githubBranch string = 'main'

@description('GitHub owner and repository qualified with their numeric ids, as owner@ownerId/repo@repoId. GitHub qualifies the OIDC subject with these, so the federated credential must match. Read with: gh api repos/<owner>/<repo> --jq .')
param githubRepositoryWithIds string = 'sycomacademy@259377858/sycom-academy@1339824334'

@description('Image the container app and migration job run. Empty on a first provision; otherwise the image currently deployed, so provisioning never rolls the app back to the placeholder. CI and azd both supply this.')
param containerImageName string = ''

@description('Deploy the Tailscale subnet router that gives developer tooling access to the private database. Off until the tailscale-authkey and access-vm-admin-password secrets exist in Key Vault, because the template reads both with getSecret() and the deployment fails if either is missing. See infra/README.md.')
param deployAccessVm bool = true

@description('Address that receives the access VM auto-shutdown warning. Empty to skip notification.')
param accessVmShutdownNotificationEmail string = ''

var serviceName = 'dashboard'
var databaseName = 'sycom'
var alphanumericPrefix = replace(resourcePrefix, '-', '')

var tags = {
  'azd-env-name': environmentName
  workload: 'sycom-academy'
  managedBy: 'azd-bicep'
}

module network './modules/network.bicep' = {
  name: 'network'
  params: {
    vnetName: '${resourcePrefix}-vnet'
    location: location
    tags: tags
  }
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
    entraAdminObjectId: principalId
    entraAdminPrincipalName: developerPrincipalName
    entraAdminPrincipalType: 'User'
    location: location
    tags: tags
  }
}

module postgresPrivateEndpoint './modules/postgres-private-endpoint.bicep' = {
  name: 'postgresPrivateEndpoint'
  params: {
    name: '${resourcePrefix}-postgres-pe'
    postgresServerId: postgres.outputs.id
    subnetId: network.outputs.privateEndpointSubnetId
    privateDnsZoneId: network.outputs.postgresPrivateDnsZoneId
    location: location
    tags: tags
  }
}

// The hostname is unchanged from the public one; inside the VNet the privatelink
// zone resolves it to the private endpoint instead.
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
    infrastructureSubnetId: network.outputs.containerAppsSubnetId
    location: location
    tags: tags
  }
}

// First provision only: the app starts on a public placeholder with no registry,
// because its identity cannot hold AcrPull until it exists. After that both the
// image and the registry link are declared here, so provisioning infrastructure
// leaves the running revision alone.
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
    containerImageName: containerImageName
    containerRegistryServer: containerRegistry.outputs.loginServer
    location: location
    tags: tags
  }
}

module migrationJob './modules/migration-job.bicep' = {
  name: 'migrationJob'
  params: {
    name: '${resourcePrefix}-migrate'
    containerAppsEnvironmentId: containerAppsEnvironment.outputs.id
    databaseUrl: databaseUrl
    containerImageName: containerImageName
    containerRegistryServer: containerRegistry.outputs.loginServer
    location: location
    tags: tags
  }
}

module githubIdentity './modules/github-identity.bicep' = {
  name: 'githubIdentity'
  params: {
    name: '${resourcePrefix}-github-mi'
    repository: githubRepository
    repositoryWithIds: githubRepositoryWithIds
    branch: githubBranch
    location: location
    tags: tags
  }
}

// Both VM secrets are seeded by hand with `az keyvault secret set` and read here,
// so neither appears in this template or in a committed parameter file. See
// infra/README.md for the two commands.
resource existingKeyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVault.outputs.name
}

module accessVm './modules/access-vm.bicep' = if (deployAccessVm) {
  name: 'accessVm'
  params: {
    name: '${resourcePrefix}-access'
    subnetId: network.outputs.managementSubnetId
    advertisedRoutes: network.outputs.addressPrefix
    tailscaleAuthKey: existingKeyVault.getSecret('tailscale-authkey')
    adminPassword: existingKeyVault.getSecret('access-vm-admin-password')
    autoShutdownNotificationEmail: accessVmShutdownNotificationEmail
    deployAutoShutdown: false
    location: location
    tags: tags
  }
}

// Phase 2: role assignments live in their own modules so nothing in phase 1
// depends on them, which is what keeps the AcrPull grant from becoming circular.
module acrPullRoleApp './modules/acr-pull-role.bicep' = {
  name: 'acrPullRoleApp'
  params: {
    registryName: containerRegistry.outputs.name
    principalId: dashboard.outputs.principalId
  }
}

module acrPullRoleJob './modules/acr-pull-role.bicep' = {
  name: 'acrPullRoleJob'
  params: {
    registryName: containerRegistry.outputs.name
    principalId: migrationJob.outputs.principalId
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

module githubRoles './modules/github-roles.bicep' = {
  name: 'githubRoles'
  params: {
    registryName: containerRegistry.outputs.name
    containerAppName: dashboard.outputs.name
    migrationJobName: migrationJob.outputs.name
    principalId: githubIdentity.outputs.principalId
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

output AZURE_VNET_NAME string = network.outputs.vnetName
output MIGRATION_JOB_NAME string = migrationJob.outputs.name

output GITHUB_IDENTITY_CLIENT_ID string = githubIdentity.outputs.clientId
output GITHUB_IDENTITY_NAME string = githubIdentity.outputs.name

output SERVICE_DASHBOARD_NAME string = dashboard.outputs.name
output SERVICE_DASHBOARD_URI string = dashboard.outputs.uri
output BETTER_AUTH_URL string = dashboard.outputs.uri
