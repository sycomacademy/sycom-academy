@description('Container app name.')
param name string

@description('azd service name. Must match the service key in azure.yaml or azd deploy cannot find this app.')
param serviceName string

param containerAppsEnvironmentId string

@description('Default domain of the environment, used to derive the public origin before the app exists.')
param containerAppsEnvironmentDefaultDomain string

param applicationInsightsConnectionString string

@secure()
param databaseUrl string

@secure()
param betterAuthSecret string

@description('Image to run. Defaults to a public placeholder so the app can be provisioned before anything is pushed to ACR; azd deploy replaces it.')
param containerImageName string = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'

@description('Port the container listens on. Matches PORT in apps/dashboard/Dockerfile.')
param targetPort int = 3001

param location string
param tags object

// Better Auth uses this as both baseURL and its trusted origin, so it has to be
// the exact public origin. The FQDN is derivable before the app is created.
var appUri = 'https://${name}.${containerAppsEnvironmentDefaultDomain}'

resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: name
  location: location
  tags: union(tags, { 'azd-service-name': serviceName })
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    environmentId: containerAppsEnvironmentId
    workloadProfileName: 'Consumption'
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: targetPort
        transport: 'auto'
        allowInsecure: false
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
      }
      // No registries block: azd deploy runs the equivalent of
      // `az containerapp registry set --identity system` once the AcrPull grant
      // exists, which avoids a circular dependency in this template.
      secrets: [
        {
          name: 'database-url'
          value: databaseUrl
        }
        {
          name: 'better-auth-secret'
          value: betterAuthSecret
        }
      ]
    }
    template: {
      containers: [
        {
          name: serviceName
          image: containerImageName
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'PORT'
              value: string(targetPort)
            }
            {
              name: 'HOST'
              value: '0.0.0.0'
            }
            {
              name: 'DEBUG_PERFORMANCE'
              value: 'false'
            }
            {
              name: 'BETTER_AUTH_URL'
              value: appUri
            }
            {
              name: 'CORS_ORIGIN'
              value: appUri
            }
            {
              name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
              value: applicationInsightsConnectionString
            }
            {
              name: 'DATABASE_URL'
              secretRef: 'database-url'
            }
            {
              name: 'BETTER_AUTH_SECRET'
              secretRef: 'better-auth-secret'
            }
          ]
        }
      ]
      scale: {
        // Held at 1 rather than 0: this is server-rendered, and a cold start on
        // every idle period would land on Lagos users as multi-second TTFB.
        minReplicas: 1
        maxReplicas: 3
        rules: [
          {
            name: 'http-concurrency'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

output name string = containerApp.name
output id string = containerApp.id
output uri string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
output principalId string = containerApp.identity.principalId
