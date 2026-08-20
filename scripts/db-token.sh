#!/bin/sh
# Copy an Entra access token for DataGrip's Postgres password field.
#
# This is not the database password. It expires in about an hour (often less if
# az already had a cached token). Generate it immediately before Connect, every
# session. There is no setting on Postgres or this repo that lengthens it.
set -eu

fail() {
  echo "db-token: $1" >&2
  exit 1
}

TOKEN=$(az account get-access-token --resource-type oss-rdbms --query accessToken -o tsv) \
  || fail "could not get an Entra token (az login first)"
EXPIRES=$(az account get-access-token --resource-type oss-rdbms --query expiresOn -o tsv)

if command -v pbcopy >/dev/null 2>&1; then
  printf '%s' "$TOKEN" | pbcopy
  echo "db-token: copied. expires $EXPIRES"
  echo "db-token: paste into DataGrip password, Save: Never, host 10.20.2.4, then Connect"
else
  echo "db-token: expires $EXPIRES"
  echo "$TOKEN"
fi
