#!/bin/sh
# Start, deallocate, or show power state of the Tailscale access VM.
#
# Deallocate, do not stop: `az vm stop` leaves the box allocated and still
# bills for compute. The OS disk bills either way (~$3/month).
set -eu

RG="${AZURE_RESOURCE_GROUP:-sycomlearn-prod-rg}"
NAME="${ACCESS_VM_NAME:-sycomacademy-access}"

fail() {
  echo "access-vm: $1" >&2
  exit 1
}

power_state() {
  az vm get-instance-view \
    --resource-group "$RG" \
    --name "$NAME" \
    --query "instanceView.statuses[?starts_with(code, 'PowerState/')].displayStatus" \
    --output tsv
}

case "${1:-}" in
  up)
    echo "access-vm: starting $NAME"
    az vm start --resource-group "$RG" --name "$NAME" --output none || fail "could not start"
    echo "access-vm: $(power_state)"
    echo "access-vm: wait ~20s for Tailscale, then DataGrip host 10.20.2.4 (SSL require)"
    ;;
  down)
    echo "access-vm: deallocating $NAME (compute off, disk still bills)"
    az vm deallocate --resource-group "$RG" --name "$NAME" --output none || fail "could not deallocate"
    echo "access-vm: $(power_state)"
    ;;
  status)
    echo "access-vm: $NAME $(power_state)"
    ;;
  *)
    fail "usage: access-vm.sh up|down|status"
    ;;
esac
