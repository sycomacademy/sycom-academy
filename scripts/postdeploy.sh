#!/bin/sh
# Runs after `azd deploy`.
#
# Postgres has no public endpoint, so migrations cannot run from here. Instead the
# Container Apps job is pointed at the image that was just deployed and started
# inside the VNet, where the private endpoint is reachable.
set -eu

fail() {
  echo "postdeploy: $1" >&2
  exit 1
}

: "${AZURE_RESOURCE_GROUP:?resource group missing from azd environment}"
: "${MIGRATION_JOB_NAME:?migration job name missing from azd outputs}"
: "${SERVICE_DASHBOARD_NAME:?container app name missing from azd outputs}"

# Taken from the running app rather than rebuilt from a tag, so the migration runs
# against exactly the code that was just deployed.
IMAGE=$(az containerapp show \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --name "$SERVICE_DASHBOARD_NAME" \
  --query "properties.template.containers[0].image" \
  --output tsv) || fail "could not read the deployed image"

case "$IMAGE" in
  *azuredocs/containerapps-helloworld*)
    echo "postdeploy: app still on the placeholder image, skipping migrations"
    exit 0
    ;;
esac

echo "postdeploy: pointing $MIGRATION_JOB_NAME at $IMAGE"
az containerapp job update \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --name "$MIGRATION_JOB_NAME" \
  --image "$IMAGE" \
  --output none || fail "could not update the migration job image"

echo "postdeploy: running migrations"
EXECUTION=$(az containerapp job start \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --name "$MIGRATION_JOB_NAME" \
  --query "name" \
  --output tsv) || fail "could not start the migration job"

echo "postdeploy: execution $EXECUTION"

# Poll rather than assume: a silent migration failure would leave the app serving
# against a schema that does not match the code.
ATTEMPTS=0
while [ "$ATTEMPTS" -lt 60 ]; do
  STATUS=$(az containerapp job execution show \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --name "$MIGRATION_JOB_NAME" \
    --job-execution-name "$EXECUTION" \
    --query "properties.status" \
    --output tsv 2>/dev/null) || STATUS="Unknown"

  case "$STATUS" in
    Succeeded)
      echo "postdeploy: migrations succeeded"
      exit 0
      ;;
    Failed | Degraded)
      echo "postdeploy: migration job reported $STATUS. Logs:" >&2
      az containerapp job logs show \
        --resource-group "$AZURE_RESOURCE_GROUP" \
        --name "$MIGRATION_JOB_NAME" \
        --execution "$EXECUTION" \
        --tail 100 2>&1 || true
      fail "migrations failed"
      ;;
    *)
      ATTEMPTS=$((ATTEMPTS + 1))
      sleep 10
      ;;
  esac
done

fail "migration job did not finish within 10 minutes (last status: ${STATUS:-unknown})"
