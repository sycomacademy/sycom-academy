# Sycom infrastructure

Everything under `infra/` is Bicep, deployed with `azd`. Nothing is configured by
hand in the portal. `az` commands in this document are for verification, one-off
bootstrap, and incident response — they are not the source of truth.

- **Subscription:** `de0b9977-4b54-468c-8346-c27f06a416ed` (Microsoft Partner Network - Sycom)
- **Tenant:** `f1f481c9-3958-4fcd-a611-189d6d325c24`
- **Resource group:** `sycomlearn-prod-rg`
- **Region:** `uksouth`

This stack runs alongside the older `sycomlearn-*` resources in the same resource
group. At cutover the custom domain `learn.sycom.academy` moves onto
`sycomacademy-app`, the data is migrated, and the `sycomlearn-*` resources are
deleted. What to delete now vs after that cutover is in [`CLEANUP.md`](CLEANUP.md). Azure resources cannot be renamed, so the `sycomacademy-*` names are
permanent — "renaming to learn" means moving the domain, not the resource.

**Why UK South.** Users are mostly in Lagos. UK South is the nearest region with
the full PaaS catalogue: South Africa North is geographically closer, but routing
from Lagos to Johannesburg is frequently worse than Lagos to London, because
subsea capacity on the west-Africa cables lands in Europe. It also keeps this
stack colocated with the resources it will eventually replace, which matters for
the data migration.

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

Front Door is not deployed yet. This is server-rendered: HTML is per-request and
uncacheable, so a CDN adds a hop to the slow part, and Vite already emits
content-hashed immutable assets the browser caches after first load. Front Door
Standard is about $35/month plus egress and adds a second TLS and DNS surface to
debug. It becomes worth it at cutover, when the custom domain and WAF are needed,
and for its split-TCP and warm origin connections, which matter more to long-haul
Lagos clients than caching does.

When it does land, the app should validate the `X-Azure-FDID` header rather than
making the environment internal — switching an environment to internal is not
reversible in place. The alternative, Front Door Premium with Private Link
origins, is about $330/month against roughly $35 for Standard.

### Other things deliberately left out

| Service | Why not |
|---|---|
| Azure Cache for Redis | Nothing needs it. Better Auth sessions live in Postgres and B1ms handles this load. Revisit on session-lookup pressure, or when rate limiting needs state shared across replicas. ~$16/month. |
| Load balancer / Application Gateway | Container Apps ingress already terminates TLS and balances across replicas. Application Gateway duplicates that from ~$180/month. |
| API Management | One consumer — this app's own browser client calling its own tRPC endpoints. No third party, no partner keys, no quotas, no versioning. From ~$50/month to solve a problem that does not exist. |

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

## Two deployment paths

There are two, and they own different things. Using the wrong one is how
production gets rolled back.

| | GitHub Actions | `azd` |
|---|---|---|
| Owns | The **image** the app runs | The **resources** the app runs on |
| Runs | Automatically, on push to `main` | Manually, from your laptop |
| Does | build → push to ACR → new revision → migrations → smoke check | applies `infra/**` Bicep to Azure |
| Auth | OIDC as `sycomacademy-github-mi`, no secret | your `az login`, needs PIM activation |
| Takes | about 4 minutes | about 3 minutes |
| Touches the database | only through the migration job | no |
| Touches networking, vault, Postgres config | no | yes |

**Use GitHub Actions** — that is, just push — for anything under `apps/`,
`packages/`, or `scripts/`. Application code, schema migrations, dependency
bumps. This is the normal path and should be almost every deploy.

**Use `azd provision`** when you have changed something under `infra/`: a new
resource, an SKU, a firewall or network setting, a role assignment, a Key Vault
secret wired into the template. Preview it first, apply it, and let the next push
handle the app.

**Use `azd up`** only to deploy app *and* infrastructure together — a first
provision, or a disaster-recovery rebuild. In day-to-day work you should not need
it, and it duplicates what CI already does.

They overlap in exactly one place: both can set the container app's image. CI sets
it from the commit SHA; `azd` sets it from the `SERVICE_DASHBOARD_IMAGE_NAME` it
has stored. If that stored value is stale, provisioning rolls production back —
which is why the sync command below exists.

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

Bicep changes go out from a laptop, not from CI.

**Sync the image name first.** CI deploys images that `azd` does not know about, and
`azd` passes its stored `SERVICE_DASHBOARD_IMAGE_NAME` into the template. If it is
stale, provisioning rolls production back to an older image:

```bash
azd env set SERVICE_DASHBOARD_IMAGE_NAME "$(az containerapp show -g sycomlearn-prod-rg -n sycomacademy-app --query 'properties.template.containers[0].image' -o tsv)"
```

Then:

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

### How long a deploy takes

Measured on run 32318429891, before the layer cache was removed:

| Step | Time |
|---|---|
| Build and push | 2m13s |
| Run migrations | 1m17s |
| Roll the container app onto the new image | 19s |
| Install the containerapp extension | 11s |
| Sign in to Azure + registry | 12s |
| Everything else | ~20s |

Two things dominate, and neither is the actual build — `bun install` takes 6s and
`vite build` takes 7s. The rest is moving bytes around.

- **Image export and push, ~48s.** The runner stage copies the whole monorepo
  including dev dependencies: 846 MB uncompressed, 250 MB in the registry. Worth
  slimming eventually, but note that `bun install --production` does **not** help —
  bun's isolated store keeps every package under `node_modules/.bun` regardless, and
  the image comes out byte-identical. A real fix needs a separate deps stage that
  installs from the lockfile alone.
- **The migration step, ~1m17s**, of which about 40s is Azure CLI calls
  re-applying settled configuration: `job registry set` takes 21s to report that the
  registry is already set, and `job update --image` another 19s. The migration
  itself runs in about 34s, mostly pulling that 250 MB image cold.

The GitHub Actions layer cache was removed after measuring it at 64s per run for no
benefit — see the comment in the workflow.

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

Two federated credentials are registered, and both are scoped to `main`:

```
repo:sycomacademy/sycom-academy:ref:refs/heads/main
repo:sycomacademy@259377858/sycom-academy@1339824334:ref:refs/heads/main
```

The second exists because **GitHub presents the id-qualified form**, not the plain
one. Registering only the plain subject fails at `azure/login` with
`AADSTS700213: No matching federated identity record found`, which does not hint at
what is wrong. Confirm the prefix your repo actually sends with:

```bash
gh api repos/sycomacademy/sycom-academy/actions/oidc/customization/sub
```

If `sub_claim_prefix` ever changes — it embeds the numeric owner and repo ids, so
deleting and recreating the repository would change it — update
`githubRepositoryWithIds` in [`main.bicep`](main.bicep) and re-provision.

A workflow on any other branch, and any pull request including from a fork, cannot
obtain a token. To let another branch deploy, add its subjects to the `subjects`
array in [`modules/github-identity.bicep`](modules/github-identity.bicep) — do not
widen an existing subject.

CI's permissions are deliberately narrow: `AcrPush` on the registry, and
`Contributor` on the container app and the migration job **as individual
resources**. A compromised workflow cannot reach the database, the vault, or the
network.

---

## Developer database access with DataGrip

The database has no public endpoint. `sycomacademy-access` is a Tailscale subnet
router inside the VNet that advertises `10.20.0.0/16`, which puts the private
endpoint one hop from any machine on the tailnet.

The VM is deployed (`10.20.2.20`, Tailscale `100.86.251.40`). Overnight auto-shutdown
is **off**: it uses `Microsoft.DevTestLab/schedules`, that provider is not registered
on the subscription, and a RG-scoped identity cannot register it. Until someone with
subscription rights runs `az provider register --namespace Microsoft.DevTestLab` and
`deployAutoShutdown` is flipped on in [`modules/access-vm.bicep`](modules/access-vm.bicep),
stop it yourself when you are done:

```bash
az vm deallocate -g sycomlearn-prod-rg -n sycomacademy-access
```

### One-time setup (Tailscale admin console)

Routes are advertised. They do nothing until you approve them.

1. Approve the advertised routes for `sycomacademy-access` (`10.20.0.0/16` and `168.63.129.16/32`).
2. Add a **split DNS** nameserver: `168.63.129.16`, restricted to the domain `postgres.database.azure.com`. This is Azure's platform resolver, which is what makes the private DNS zone resolve from your laptop.
3. Disable key expiry for the node, or it drops off the tailnet after 180 days.

Rebuilding the VM needs the two Key Vault secrets to still exist (`tailscale-authkey`,
`access-vm-admin-password`). The auth key is only consumed at first boot; after that
the node holds its own identity.

**Entra database admin.** Provisioning sets this from `AZURE_PRINCIPAL_ID` and
`AZURE_PRINCIPAL_NAME`. Set `AZURE_PRINCIPAL_NAME` in the azd environment to your
exact UPN or it is skipped:

```bash
azd env set AZURE_PRINCIPAL_NAME a.shehu@sycomsolutions.com
```

### Connecting

The VM is running. If you deallocated it, start it first:

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
| Access VM `Standard_B1s` + 30 GB disk (no auto-shutdown yet) | ~12 |
| Container registry, Basic | ~5 |
| Log Analytics + Application Insights, low volume | ~5 |
| Key Vault, virtual network, private DNS zone | ~1 |
| **Total** | **~78** |

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
| Access VM auto-shutdown | Needs `Microsoft.DevTestLab` registered at subscription scope. Until then deallocate the VM when idle. |
| Managed-identity database auth for the app | Entra auth is enabled on the server but the app still uses a connection-string password. Removing it means wiring `pg`'s async password callback to `DefaultAzureCredential` with token caching, and registering the app's identity with `pgaadauth_create_principal`. Application work, not infrastructure. |
| ACR retention policy | Basic has a 10 GB quota and every deploy adds a manifest. |
| Front Door, WAF, custom domain | Needed at cutover. |
| Staging environment | The template is parameterised for it; it is a params file and a non-overlapping address space away. |
| Runner image size | 846 MB, of which 758 MB is `node_modules` that only the build needs — turbo, typescript, the rolldown and oxlint native bindings, plus UI libraries that are already inlined into `.output`. Needs a separate deps stage; `bun install --production` alone changes nothing. Would speed up both the image push and the migration job's cold start. |
| Redundant CLI calls in `scripts/postdeploy.sh` | `job registry set` runs on every deploy and takes 21s to confirm what Bicep already declares. Worth making conditional. |
