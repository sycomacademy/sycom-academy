// Drizzle migrations run here rather than from a developer machine, because with
// public access disabled the database is only reachable from inside the VNet.
// Triggered by scripts/postdeploy.sh after each successful deploy.
@description('Job name.')
param name string

param containerAppsEnvironmentId string

@secure()
param databaseUrl string

@description('Image to run. Defaults to a placeholder; scripts/postdeploy.sh swaps in whichever image was just deployed so migrations always match the running code.')
param containerImageName string = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'

param location string
param tags object

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
      // No registries block, for the same reason as the container app: the job's
      // system identity cannot hold AcrPull until the job exists, so declaring
      // the registry here deadlocks resource creation. scripts/postdeploy.sh
      // wires it up once the grant is in place.
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
          image: containerImageName
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
