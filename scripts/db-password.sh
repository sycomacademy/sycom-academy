#!/bin/sh
# Copy the sycomadmin database password for DataGrip.
#
# Do not use `az ... -o tsv | pbcopy`: tsv adds a newline, Postgres then fails
# with 28P01. This prints with no trailing newline.
set -eu

fail() {
  echo "db-password: $1" >&2
  exit 1
}

PW=$(az keyvault secret show \
  --vault-name "${AZURE_KEY_VAULT_NAME:-sycomacademykv01}" \
  --name postgres-admin-password \
  --query value -o tsv) || fail "could not read postgres-admin-password (az login / Key Vault read)"

# az tsv always appends a newline
PW=$(printf '%s' "$PW" | tr -d '\n')

if command -v pbcopy >/dev/null 2>&1; then
  printf '%s' "$PW" | pbcopy
  echo "db-password: copied ${#PW} chars, no trailing newline"
  echo "db-password: DataGrip user sycomadmin, host 10.20.2.4, SSL require"
else
  printf '%s' "$PW"
  echo
fi
