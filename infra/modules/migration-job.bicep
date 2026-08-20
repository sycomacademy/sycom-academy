// Drizzle migrations run here rather than from a developer machine, because with
// public access disabled the database is only reachable from inside the VNet.
// Triggered by scripts/postdeploy.sh after each successful deploy.
@description('Job name.')
param name string

param containerAppsEnvironmentId string

@secure()
param databaseUrl string

@description('Image to run. Empty on a first provision. Otherwise the image currently deployed, so provisioning does not roll the job back to the placeholder. scripts/postdeploy.sh still points it at whichever image was just deployed, so migrations always match the running code.')
param containerImageName string = ''

@description('Registry the image is pulled from. Only wired up once a real image exists.')
param containerRegistryServer string = ''

param location string
param tags object

var placeholderImage = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
var isPlaceholder = empty(containerImageName) || contains(containerImageName, 'azuredocs/containerapps-helloworld')
var image = isPlaceholder ? placeholderImage : containerImageName

resource job 'Microsoft.App/jobs@2024-03-01' = {
  name: name
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    environmentId: containerAppsEnvironmentId
    workloadProfileName: 'Consumption'
    configuration: {
      triggerType: 'Manual'
      // Generous: a cold start plus a large migration should never be cut off
      // halfway through.
      replicaTimeout: 1800
      replicaRetryLimit: 1
      manualTriggerConfig: {
        parallelism: 1
        replicaCompletionCount: 1
      }
      // Empty on the first provision, for the same reason as the container app:
      // the job's system identity cannot hold AcrPull until the job exists.
      // Declared from then on so provisioning does not unlink the registry.
      registries: isPlaceholder || empty(containerRegistryServer) ? [] : [
        {
          server: containerRegistryServer
          identity: 'system'
        }
      ]
      secrets: [
        {
          name: 'database-url'
          value: databaseUrl
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'migrate'
          image: image
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          command: [
            '/bin/sh'
            '-c'
          ]
          args: [
            'node /app/packages/db/migrate.mjs'
          ]
          env: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'DATABASE_URL'
              secretRef: 'database-url'
            }
          ]
        }
      ]
    }
  }
}

output name string = job.name
output id string = job.id
output principalId string = job.identity.principalId
