#!/bin/sh
# Runs after `azd provision`, before `azd deploy`.
#
# Bicep leaves the Postgres server default-deny because the addresses that need
# access are not knowable at template-authoring time. This script closes that gap:
#   1. allows the container app's real outbound IPs
#   2. opens a temporary rule for this machine, applies Drizzle migrations, and
#      removes that rule again
set -eu

fail() {
  echo "postprovision: $1" >&2
  exit 1
}

: "${AZURE_RESOURCE_GROUP:?resource group missing from azd environment}"
: "${POSTGRES_SERVER_NAME:?postgres server name missing from azd outputs}"
: "${POSTGRES_DATABASE:?postgres database name missing from azd outputs}"
: "${POSTGRES_ADMIN_LOGIN:?postgres admin login missing from azd environment}"
: "${POSTGRES_ADMIN_PASSWORD:?postgres admin password missing; run: azd env set POSTGRES_ADMIN_PASSWORD <value>}"
: "${SERVICE_DASHBOARD_NAME:?container app name missing from azd outputs}"

REPO_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
MIGRATION_RULE="migrate-client"

echo "postprovision: allowing container app egress to Postgres"

# The environment's static IP is inbound only; egress leaves from a different
# address, so it has to be read off the deployed app.
OUTBOUND_IPS=$(az containerapp show \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --name "$SERVICE_DASHBOARD_NAME" \
  --query "join(' ', properties.outboundIpAddresses)" \
  --output tsv) || fail "could not read outbound IPs for $SERVICE_DASHBOARD_NAME"

[ -n "$OUTBOUND_IPS" ] || fail "container app reported no outbound IPs"

for ip in $OUTBOUND_IPS; do
  rule="containerapp-$(echo "$ip" | tr '.' '-')"
  echo "  $ip -> firewall rule $rule"
  az postgres flexible-server firewall-rule create \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --server-name "$POSTGRES_SERVER_NAME" \
    --name "$rule" \
    --start-ip-address "$ip" \
    --end-ip-address "$ip" \
    --output none || true
done

remove_migration_rule() {
  echo "postprovision: removing temporary migration firewall rule"
  az postgres flexible-server firewall-rule delete \
    --resource-group "$AZURE_RESOURCE_GROUP" \
    --server-name "$POSTGRES_SERVER_NAME" \
    --name "$MIGRATION_RULE" \
    --yes \
    --output none || true
}

CLIENT_IP=$(curl -fsS --max-time 10 https://api.ipify.org) || fail "could not determine this machine's public IP"

echo "postprovision: opening $MIGRATION_RULE for $CLIENT_IP"
trap remove_migration_rule EXIT INT TERM

az postgres flexible-server firewall-rule create \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --server-name "$POSTGRES_SERVER_NAME" \
  --name "$MIGRATION_RULE" \
  --start-ip-address "$CLIENT_IP" \
  --end-ip-address "$CLIENT_IP" \
  --output none || fail "could not open migration firewall rule"

# Firewall changes are not instantaneous on the data plane.
sleep 15

echo "postprovision: applying Drizzle migrations to $POSTGRES_DATABASE"

# Invoked directly rather than through turbo, whose strict env mode would drop
# DATABASE_URL. drizzle.config.ts loads a local .env via dotenv, which does not
# override values already present in the environment.
DATABASE_URL="postgresql://${POSTGRES_ADMIN_LOGIN}:${POSTGRES_ADMIN_PASSWORD}@${POSTGRES_SERVER_NAME}.postgres.database.azure.com:5432/${POSTGRES_DATABASE}?sslmode=require" \
  sh -c "cd '$REPO_ROOT/packages/db' && bun run db:migrate" || fail "drizzle migrations failed"

echo "postprovision: done"
