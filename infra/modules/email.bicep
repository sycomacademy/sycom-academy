// Transactional email for the auth flows: verification, password reset, and
// organization invitations. The app talks to the data plane through
// packages/email, which speaks the ACS REST API directly.
@description('Email Communication Service name. This owns the sender domain.')
param name string

@description('Communication Services name. This owns the endpoint and the access keys the app sends with.')
param communicationServiceName string

@description('Where email metadata is stored at rest. Not a region id: ACS takes a coarse geography, and it cannot be changed after creation.')
@allowed([
  'Africa'
  'Asia Pacific'
  'Australia'
  'Brazil'
  'Canada'
  'Europe'
  'France'
  'Germany'
  'India'
  'Japan'
  'Korea'
  'Norway'
  'Switzerland'
  'UAE'
  'UK'
  'United States'
])
param dataLocation string = 'UK'

param tags object

// Every one of these resource types is global-only. Passing the resource group's
// region instead is a deployment error, which is why no `location` param is
// taken here.
resource emailService 'Microsoft.Communication/emailServices@2023-04-01' = {
  name: name
  location: 'global'
  tags: tags
  properties: {
    dataLocation: dataLocation
  }
}

// 'AzureManagedDomain' is a literal, not a name we chose: it is what selects the
// free Azure-managed sender domain, which needs no DNS records and is ready the
// moment the deployment finishes. It sends as DoNotReply@<guid>.azurecomm.net
// and is capped at 100 emails/minute. Moving to a branded sender means adding a
// second domains resource with domainManagement 'CustomerManaged' and verifying
// it out of band; see infra/README.md.
resource managedDomain 'Microsoft.Communication/emailServices/domains@2023-04-01' = {
  parent: emailService
  name: 'AzureManagedDomain'
  location: 'global'
  tags: tags
  properties: {
    domainManagement: 'AzureManaged'
    userEngagementTracking: 'Disabled'
  }
}

resource communicationService 'Microsoft.Communication/communicationServices@2023-04-01' = {
  name: communicationServiceName
  location: 'global'
  tags: tags
  properties: {
    dataLocation: dataLocation
    linkedDomains: [
      managedDomain.id
    ]
  }
}

// No access key is returned. Bicep has no secure outputs, so main.bicep reads the
// key off the resource itself with listKeys() and passes it on as a @secure()
// parameter, the same way the access VM's secrets are read out of Key Vault.
output name string = emailService.name
output communicationServiceName string = communicationService.name
output endpoint string = 'https://${communicationService.properties.hostName}'
output senderAddress string = 'DoNotReply@${managedDomain.properties.mailFromSenderDomain}'
