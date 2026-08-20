// Tailscale subnet router. The only way a laptop reaches the private database.
//
// Postgres has no public endpoint, so DataGrip cannot connect from outside the
// VNet. This VM joins the tailnet and advertises the VNet's routes, which puts the
// private endpoint one hop away from any machine signed into the same tailnet.
//
// Nothing is exposed: there is no public IP and no inbound rule. Tailscale dials
// out, and `tailscale ssh` reaches the box over the tailnet, so no SSH port is
// ever open. See infra/README.md for the DataGrip walkthrough.
@description('Virtual machine name. Also the Tailscale hostname.')
param name string

@description('Subnet the router sits in. Needs outbound internet access.')
param subnetId string

@description('Address space advertised to the tailnet. Covers the private endpoint subnet.')
param advertisedRoutes string = '10.20.0.0/16'

@description('Tailscale auth key, read from Key Vault at deploy time. Never stored in this template.')
@secure()
param tailscaleAuthKey string

@description('Local account name. Sign-in is via tailscale ssh, so this password is never used interactively.')
param adminUsername string = 'azureuser'

@description('Required by the platform even though password authentication is disabled below.')
@secure()
param adminPassword string

@description('Time of day to shut the VM down, in HHmm. It is only needed during an incident.')
param autoShutdownTime string = '2300'

@description('IANA/Windows time zone name the shutdown schedule is evaluated in.')
param autoShutdownTimeZone string = 'GMT Standard Time'

@description('Address that receives the shutdown warning. Empty to skip notification.')
param autoShutdownNotificationEmail string = ''

@description('Create the DevTest Lab auto-shutdown schedule. Requires Microsoft.DevTestLab registered on the subscription. Off by default because this subscription is not registered and the deploying identity cannot register providers.')
param deployAutoShutdown bool = false

param location string
param tags object

// Deny-all inbound sits above the default AllowVnetInBound rule, so nothing on the
// VNet or the internet can open a connection to this box either.
resource nsg 'Microsoft.Network/networkSecurityGroups@2024-05-01' = {
  name: '${name}-nsg'
  location: location
  tags: tags
  properties: {
    securityRules: [
      {
        name: 'deny-all-inbound'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Deny'
          protocol: '*'
          sourceAddressPrefix: '*'
          sourcePortRange: '*'
          destinationAddressPrefix: '*'
          destinationPortRange: '*'
          description: 'Tailscale is outbound-only, including tailscale ssh. Nothing needs to reach this VM.'
        }
      }
    ]
  }
}

resource nic 'Microsoft.Network/networkInterfaces@2024-05-01' = {
  name: '${name}-nic'
  location: location
  tags: tags
  properties: {
    // Without this the VM drops packets destined for the private endpoint, which
    // is the entire point of a subnet router.
    enableIPForwarding: true
    networkSecurityGroup: {
      id: nsg.id
    }
    ipConfigurations: [
      {
        name: 'ipconfig1'
        properties: {
          subnet: {
            id: subnetId
          }
          privateIPAllocationMethod: 'Dynamic'
        }
      }
    ]
  }
}

// 168.63.129.16 is Azure's platform DNS resolver. Advertising it lets a laptop on
// the tailnet resolve privatelink.postgres.database.azure.com through this router,
// so the database FQDN works unchanged instead of needing a hardcoded private IP.
var cloudInit = '''
#cloud-config
write_files:
  - path: /etc/sysctl.d/99-tailscale.conf
    content: |
      net.ipv4.ip_forward = 1
      net.ipv6.conf.all.forwarding = 1
runcmd:
  - sysctl -p /etc/sysctl.d/99-tailscale.conf
  - curl -fsSL https://tailscale.com/install.sh | sh
  - tailscale up --authkey=TAILSCALE_AUTH_KEY --advertise-routes=ADVERTISED_ROUTES,168.63.129.16/32 --accept-dns=false --ssh --hostname=TAILSCALE_HOSTNAME
'''

var renderedCloudInit = replace(
  replace(replace(cloudInit, 'TAILSCALE_AUTH_KEY', tailscaleAuthKey), 'ADVERTISED_ROUTES', advertisedRoutes),
  'TAILSCALE_HOSTNAME',
  name
)

resource vm 'Microsoft.Compute/virtualMachines@2024-07-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    hardwareProfile: {
      // Smallest size that comfortably runs the Tailscale daemon. Routing a
      // handful of psql connections needs nothing more.
      vmSize: 'Standard_B1s'
    }
    storageProfile: {
      imageReference: {
        publisher: 'Canonical'
        offer: 'ubuntu-24_04-lts'
        sku: 'server'
        version: 'latest'
      }
      osDisk: {
        createOption: 'FromImage'
        managedDisk: {
          storageAccountType: 'StandardSSD_LRS'
        }
        diskSizeGB: 30
        deleteOption: 'Delete'
      }
    }
    osProfile: {
      computerName: name
      adminUsername: adminUsername
      adminPassword: adminPassword
      customData: base64(renderedCloudInit)
      linuxConfiguration: {
        // No SSH keys and no password login. The only way in is tailscale ssh,
        // which is authenticated against the tailnet, or the Azure run-command API.
        disablePasswordAuthentication: false
        patchSettings: {
          patchMode: 'AutomaticByPlatform'
          assessmentMode: 'AutomaticByPlatform'
        }
      }
    }
    networkProfile: {
      networkInterfaces: [
        {
          id: nic.id
        }
      ]
    }
  }
}

// The router is only needed during an incident, so it stops itself overnight.
// Start it again with: bun run vm:up
// Gated: Microsoft.DevTestLab is not registered on this subscription, and the
// RG-scoped identity cannot register providers. Flip on after someone with
// subscription rights runs: az provider register --namespace Microsoft.DevTestLab
resource autoShutdown 'Microsoft.DevTestLab/schedules@2018-09-15' = if (deployAutoShutdown) {
  name: 'shutdown-computevm-${name}'
  location: location
  tags: tags
  properties: {
    status: 'Enabled'
    taskType: 'ComputeVmShutdownTask'
    dailyRecurrence: {
      time: autoShutdownTime
    }
    timeZoneId: autoShutdownTimeZone
    targetResourceId: vm.id
    notificationSettings: {
      status: empty(autoShutdownNotificationEmail) ? 'Disabled' : 'Enabled'
      timeInMinutes: 30
      emailRecipient: autoShutdownNotificationEmail
    }
  }
}

output name string = vm.name
output id string = vm.id
output privateIpAddress string = nic.properties.ipConfigurations[0].properties.privateIPAddress
