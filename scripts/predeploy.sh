#!/bin/sh
# Runs before `azd deploy`.
#
# Links the container app to ACR using its managed identity. This is not in the
# Bicep template because declaring a registry at creation time deadlocks: the
# app's identity cannot be granted AcrPull until the app exists. azd is
# documented as doing this itself via `az containerapp registry set --identity
# system`, but it does not, and the revision then fails to pull with UNAUTHORIZED.
#
# Idempotent, so it is safe on every deploy.
set -eu

fail() {
  echo "predeploy: $1" >&2
  exit 1
}

: "${AZURE_RESOURCE_GROUP:?resource group missing from azd environment}"
: "${SERVICE_DASHBOARD_NAME:?container app name missing from azd outputs}"
: "${AZURE_CONTAINER_REGISTRY_ENDPOINT:?registry endpoint missing from azd outputs}"

echo "predeploy: linking $SERVICE_DASHBOARD_NAME to $AZURE_CONTAINER_REGISTRY_ENDPOINT via managed identity"
az containerapp registry set \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --name "$SERVICE_DASHBOARD_NAME" \
  --server "$AZURE_CONTAINER_REGISTRY_ENDPOINT" \
  --identity system \
  --output none || fail "could not link the container app to the registry"

echo "predeploy: done"
