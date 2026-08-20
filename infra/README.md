# Sycom infrastructure

Everything under `infra/` is Bicep, deployed with `azd`. Nothing is configured by
hand in the portal. `az` commands in this document are for verification, one-off
bootstrap, and incident response — they are not the source of truth.

- **Subscription:** `de0b9977-4b54-468c-8346-c27f06a416ed` (Microsoft Partner Network - Sycom)
- **Tenant:** `f1f481c9-3958-4fcd-a611-189d6d325c24`
- **Resource group:** `sycomlearn-prod-rg`
- **Region:** `uksouth`

The background — why this shape, what was rejected, and the cutover plan away from
the older `sycomlearn-*` resources — is in [`.azure/deployment-plan.md`](../.azure/deployment-plan.md).

---

## What is provisioned

| Resource | Name | Notes |
|---|---|---|
| Virtual network | `sycomacademy-vnet` | `10.20.0.0/16` |
| ↳ Container Apps subnet | `snet-container-apps` | `10.20.0.0/23`, delegated to `Microsoft.App/environments` |
| ↳ Private endpoint subnet | `snet-private-endpoints` | `10.20.2.0/28`, endpoint network policies disabled |
| ↳ Management subnet | `snet-management` | `10.20.2.16/28`, explicit outbound access for the Tailscale router |
| Container Apps environment | `sycomacademy-cae` | Workload profiles, VNet-integrated, external ingress |
| Container app | `sycomacademy-app` | System-assigned identity, `AcrPull` on the registry |
| Migration job | `sycomacademy-migrate` | Manual-trigger job; the only thing that talks to the database during a deploy |
| Container registry | `sycomacademyacr01` | Basic, admin user **disabled** |
| PostgreSQL Flexible Server | `sycomacademy-postgres` | PG 18, `Standard_B1ms`, **no public endpoint** |
| Private endpoint | `sycomacademy-postgres-pe` | `10.20.2.4`, registered in `privatelink.postgres.database.azure.com` |
| Key Vault | `sycomacademykv01` | RBAC, soft-delete 90 days, purge protection |
| CI identity | `sycomacademy-github-mi` | User-assigned, federated to GitHub Actions |
| Access VM | `sycomacademy-access` | Tailscale subnet router, no public IP, auto-shutdown |
| Log Analytics / App Insights | `sycomacademy-logs` / `sycomacademy-appi` | |

### Why the database has no public endpoint

The first design allowlisted the container app's outbound IPs on the Postgres
firewall. Reading `outboundIpAddresses` on the deployed app returned **161
addresses** from a pool shared across Consumption tenancy in the region. That is
more rules than the firewall accepts, it drifts without warning, and allowlisting
it would have granted reachability to other tenants' container apps. The design
moved to private connectivity instead, which is both stricter and cheaper than the
NAT Gateway an allowlist would have required.

The consequence is the thing to remember: **`bun run db:migrate` from a laptop does
not work.** The `sycomacademy-migrate` job replaces it and runs on every deploy.

### Why the registry is Basic, not Premium

Private endpoints on a container registry require the Premium tier — roughly
$50/month against about $5 for Basic. The registry holds no secrets, admin auth is
disabled, and pulls are authenticated by managed identity. Not worth the tier jump
for one developer. Recorded here so it does not get re-litigated.

### Why ingress is public

Front Door is not deployed yet (see the deployment plan for the reasoning). When it
is, the app should validate the `X-Azure-FDID` header rather than making the
environment internal — switching an environment to internal is not reversible in
place. The alternative, Front Door Premium with Private Link origins, is about
$330/month against roughly $35 for Standard.

---

## Decisions that are hard or impossible to reverse

| Decision | What reversing costs |
|---|---|
| Container Apps environment VNet integration | Cannot be added or removed in place. Delete and recreate the environment and every app in it. |
| Postgres networking mode (public-access vs VNet injection) | Fixed at server creation. This server is in public-access mode with public access disabled, which is what allows a private endpoint. Switching to VNet injection means rebuilding the server and migrating the data. |
| Container Apps environment internal vs external | Fixed at creation. |
| Every resource name | Azure resources cannot be renamed. The custom domain moves; the names do not. |

Public access and private endpoints **can** coexist on this server — you can flip
`publicNetworkAccess` and add firewall rules later without rebuilding. That is the
emergency fallback if Tailscale is unavailable, but it is not the normal path.

---

## Deploying

### Before you run anything

`Contributor` on `sycomlearn-prod-rg` is a **PIM-eligible, time-boxed** assignment,
not a permanent one. When it lapses, `azd provision`, `az deployment group
what-if`, and `az containerapp logs show` all fail with `AuthorizationFailed`, and
the error does not mention PIM. Activate the role first:

```bash
az role assignment list --assignee edee4978-903c-44c1-8ff4-590a926e1d82 --scope /subscriptions/de0b9977-4b54-468c-8346-c27f06a416ed/resourceGroups/sycomlearn-prod-rg -o table
```

If only `User Access Administrator` comes back, activate `Contributor` in Entra
Privileged Identity Management and wait a minute or two for propagation.

CI is unaffected: `sycomacademy-github-mi` holds permanent assignments.

### Infrastructure

Bicep changes go out from a laptop, not from CI:

```bash
azd provision --preview   # ARM what-if; read it before applying
```

```bash
azd provision
```

Read the what-if output before applying. Expect `Skip` or `NoChange` for every
existing resource, and for everything named `sycomlearn-*`. Anything reporting
`Delete` or `Modify` on a resource you did not intend to change is a stop sign.

Everything is idempotent — re-running a partially failed deployment completes it.

**Provisioning does not touch the running image.** The container app and migration
job take the live image as a parameter (`SERVICE_DASHBOARD_IMAGE_NAME`, which azd
sets) and declare the registry link, so an infrastructure-only deploy leaves the
current revision alone. Earlier versions of this template reset the app to the
`containerapps-helloworld` placeholder and unlinked the registry on every
`azd provision`; a what-if showing `image: <your image> => mcr.microsoft.com/...`
means that parameter is not being passed.

### Application

Pushing to `main` runs [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml),
which builds the image, pushes it to ACR, rolls the container app onto the new
revision, runs migrations through the Container Apps job, and smoke-checks the
public URL.

`azd up` still works from a laptop and does the same thing through
`scripts/predeploy.sh` and `scripts/postdeploy.sh`.

> **Migration ordering.** Migrations run *after* the new revision is live, matching
> what `azd` does. That is correct for additive migrations. For a destructive one —
> dropping or renaming a column the running code still reads — deploy the migration
> on its own commit first, then the code that depends on it.

### Rolling back

Images are tagged with the commit SHA, which cannot move:

```bash
az containerapp update -g sycomlearn-prod-rg -n sycomacademy-app --image sycomacademyacr01.azurecr.io/sycom-learn/dashboard:<previous-sha>
```

---

## What CI needs

Three GitHub repository **variables** (not secrets — none of these are sensitive,
and there is no client secret anywhere in this setup):

| Variable | Value |
|---|---|
| `AZURE_CLIENT_ID` | `GITHUB_IDENTITY_CLIENT_ID` from the deployment outputs |
| `AZURE_TENANT_ID` | `f1f481c9-3958-4fcd-a611-189d6d325c24` |
| `AZURE_SUBSCRIPTION_ID` | `de0b9977-4b54-468c-8346-c27f06a416ed` |

Read the client id after provisioning:

```bash
az identity show -g sycomlearn-prod-rg -n sycomacademy-github-mi --query clientId -o tsv
```

The federated credential is scoped to exactly one subject:

```
repo:sycomacademy/sycom-academy:ref:refs/heads/main
```

A workflow on any other branch, and any pull request including from a fork, cannot
obtain a token. To let another branch deploy, add a second
`federatedIdentityCredentials` resource in
[`modules/github-identity.bicep`](modules/github-identity.bicep) — do not widen the
existing subject.

CI's permissions are deliberately narrow: `AcrPush` on the registry, and
`Contributor` on the container app and the migration job **as individual
resources**. A compromised workflow cannot reach the database, the vault, or the
network.

---

## Developer database access with DataGrip

The database has no public endpoint. `sycomacademy-access` is a Tailscale subnet
router inside the VNet that advertises `10.20.0.0/16`, which puts the private
endpoint one hop from any machine on the tailnet.

> **The router is not deployed yet.** `deployAccessVm` in
> [`main.bicep`](main.bicep) defaults to `false`, because the template reads two
> Key Vault secrets with `getSecret()` and a deployment fails outright if either is
> missing. Seed them, flip the default to `true`, then provision.

### One-time setup

**1. Seed the two Key Vault secrets.** Bicep reads both with `getSecret()`, so they
must exist before `deployAccessVm` is turned on:

```bash
az keyvault secret set --vault-name sycomacademykv01 --name tailscale-authkey --value "tskey-auth-REPLACE-ME"
```

```bash
az keyvault secret set --vault-name sycomacademykv01 --name access-vm-admin-password --value "$(openssl rand -base64 24)"
```

Generate the Tailscale key in the admin console as **reusable**, **ephemeral off**,
**pre-authorised**, tagged. It is consumed once at first boot; after that the node
holds its own identity, so rotating the vault value only matters if the VM is ever
rebuilt. The local password exists because Azure requires a credential on a Linux
VM — sign-in is via `tailscale ssh`, so it is never typed.

**2. Turn the module on** — set `deployAccessVm` to `true` in
[`main.bicep`](main.bicep) and run `azd provision`.

**3. In the Tailscale admin console, after the VM boots:**

- Approve the advertised routes for `sycomacademy-access` (`10.20.0.0/16` and `168.63.129.16/32`). Routes do nothing until approved.
- Add a **split DNS** nameserver: `168.63.129.16`, restricted to the domain `postgres.database.azure.com`. This is Azure's platform resolver, which is what makes the private DNS zone resolve from your laptop.
- Disable key expiry for the node, or it drops off the tailnet after 180 days.

**4. Set the Entra database admin.** Provisioning does this — it is declared in
[`modules/postgres.bicep`](modules/postgres.bicep) from `AZURE_PRINCIPAL_ID` and
`AZURE_PRINCIPAL_NAME`. Set `AZURE_PRINCIPAL_NAME` in the azd environment to your
exact UPN or it is skipped:

```bash
azd env set AZURE_PRINCIPAL_NAME a.shehu@sycomsolutions.com
```

### Connecting

The VM shuts down nightly. Start it first:

```bash
az vm start -g sycomlearn-prod-rg -n sycomacademy-access
```

Confirm the tailnet is up and the routes are live:

```bash
az vm run-command invoke -g sycomlearn-prod-rg -n sycomacademy-access --command-id RunShellScript --scripts "tailscale status"
```

In DataGrip, a new PostgreSQL data source:

| Field | Value |
|---|---|
| Host | `sycomacademy-postgres.postgres.database.azure.com` |
| Port | `5432` |
| Database | `sycom` |
| SSL | on, mode `require` |

If split DNS is misbehaving, connect to `10.20.2.4` directly instead. Keep SSL mode
at `require`, not `verify-full` — the certificate is issued for
`*.postgres.database.azure.com` and will not match a bare IP.

**Authentication — Entra ID (the normal path).** The username is your UPN,
case-sensitive. The password is an access token:

```bash
az account get-access-token --resource-type oss-rdbms --query accessToken -o tsv | pbcopy
```

Paste it into the password field and set **Save: Never**.

> The token is valid for **5 to 60 minutes**. When the connection drops with an
> authentication error, that is the token expiring — not a broken setup. Run the
> command again and reconnect. No DataGrip plugin refreshes this automatically, so
> grab the token immediately before connecting rather than at the start of a
> session.

**Authentication — local admin (break-glass only).** Use this when Entra itself is
the problem:

```bash
az keyvault secret show --vault-name sycomacademykv01 --name postgres-admin-password --query value -o tsv
```

Username `sycomadmin`. This account has `CREATEDB` and full server rights. It is
not the normal path and should not be used for routine work.

### When Tailscale is unavailable

Get a shell inside the VNet through the running container:

```bash
az containerapp exec -g sycomlearn-prod-rg -n sycomacademy-app --command /bin/sh
```

`DATABASE_URL` is already in that environment. There is no `psql` in the image, but
`node` and `pg` are, which is enough to run a query.

The last resort is re-enabling public access. It is reversible and does not rebuild
the server, but it puts the database on the internet for as long as it is on — set
a reminder to turn it back off:

```bash
az postgres flexible-server update -g sycomlearn-prod-rg -n sycomacademy-postgres --public-access Enabled
```

```bash
az postgres flexible-server firewall-rule create -g sycomlearn-prod-rg -n sycomacademy-postgres --rule-name laptop-temp --start-ip-address "$(curl -s ifconfig.me)" --end-ip-address "$(curl -s ifconfig.me)"
```

Reverse it with:

```bash
az postgres flexible-server update -g sycomlearn-prod-rg -n sycomacademy-postgres --public-access Disabled
```

---

## Reading logs

`az containerapp logs show` currently fails for the developer account with
`AuthorizationFailed` on `Microsoft.App/containerApps/getAuthToken/action`, which
Contributor does not grant. Query Log Analytics instead:

```bash
az monitor log-analytics query -w "$(az monitor log-analytics workspace show -g sycomlearn-prod-rg -n sycomacademy-logs --query customerId -o tsv)" --analytics-query "ContainerAppConsoleLogs_CL | where ContainerAppName_s == 'sycomacademy-app' | order by TimeGenerated desc | take 50 | project TimeGenerated, Log_s" -o table
```

---

## Rough monthly cost

Approximate, `uksouth`, pay-as-you-go, single environment.

| Item | USD/month |
|---|---|
| Container app, 0.5 vCPU / 1 GiB, min 1 replica | ~30 |
| PostgreSQL `Standard_B1ms` + 32 GB Premium SSD | ~18 |
| Private endpoint | ~7 |
| Access VM `Standard_B1s` + 30 GB disk, auto-shutdown overnight | ~7 |
| Container registry, Basic | ~5 |
| Log Analytics + Application Insights, low volume | ~5 |
| Key Vault, virtual network, private DNS zone | ~1 |
| **Total** | **~73** |

Add about $4 if the access VM turns out to need a public IP for egress. Tailscale's
free tier covers this usage (3 users, 100 devices).

**Upgrade path for the database:** `Standard_B1ms` → `Standard_B2s` is an in-place
SKU change with a restart, roughly doubling the cost. Moving off Burstable to
`Standard_D2ds_v5` (~$140/month) is the step that buys sustained CPU, and is worth
it only once monitoring shows the burst credit balance running down.

---

## Known follow-ups

| Item | Why |
|---|---|
| Managed-identity database auth for the app | Entra auth is enabled on the server but the app still uses a connection-string password. Removing it means wiring `pg`'s async password callback to `DefaultAzureCredential` with token caching, and registering the app's identity with `pgaadauth_create_principal`. Application work, not infrastructure. |
| ACR retention policy | Basic has a 10 GB quota and every deploy adds a manifest. |
| Front Door, WAF, custom domain | Needed at cutover. |
| Staging environment | The template is parameterised for it; it is a params file and a non-overlapping address space away. |
| Runner image size | The image ships the full `node_modules` including dev dependencies, because React is resolved at runtime rather than bundled. A pruned production install would cut it substantially. |
