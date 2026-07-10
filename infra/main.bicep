targetScope = 'subscription'

@description('Azure region for all resources.')
param location string = 'westeurope'

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: 'poqr-rg'
  location: location
}

module webapp 'modules/webapp.bicep' = {
  name: 'webapp'
  scope: rg
  params: {
    location: location
  }
}
