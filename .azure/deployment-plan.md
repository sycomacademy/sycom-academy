# Azure Deployment Plan

> **Status:** Ready for Validation — artifacts generated and previewed. Deployment is blocked on the §6b role grant.

Generated: 2026-08-19

---

## 1. Project Overview

**Goal:** Host the rebuilt `sycom-learn` app (TanStack Start SSR + tRPC + Better Auth + Drizzle/Postgres) on Azure as an alpha deployment that runs alongside the existing live `learn.sycom.academy` stack, on an Azure-generated URL, until it is ready to take over.

**Path:** Add Components (new `sycomacademy-*` resources inside the existing `sycomlearn-prod-rg`)

**Cutover intent:** when the rebuild is complete, the `sycomlearn-*` resources are deleted and the custom domain moves onto the `sycomacademy-*` stack. Postgres data is migrated from `sycomlearn-prod-postgres` to `sycomacademy-postgres` at that point.

> ⚠️ Azure resources cannot be renamed in place. The `sycomacademy-*` names are permanent; "renaming to learn" is achieved by moving the custom domain (`learn.sycom.academy`) onto `sycomacademy-app` and deleting the old resources.

---

## 2. Requirements

| Attribute | Value |
|-----------|-------|
| Classification | Production (alpha / pre-cutover) |
| Scale | Small |
| Budget | Cost-Optimized |
| **Subscription** | Microsoft Partner Network - Sycom (`de0b9977-4b54-468c-8346-c27f06a416ed`) — confirmed |
| **Location** | UK South (`uksouth`) — confirmed |
| Resource group | `sycomlearn-prod-rg` (existing, reused) — confirmed |
| Resource prefix | `sycomacademy` — confirmed |
| Test resource group | `sycomlearn-test-rg` — **not used**, slated for deletion |

### Region rationale

Users are primarily in Lagos, Nigeria; the origin stays in UK South. UK South is the nearest Azure region with the full PaaS catalogue (South Africa North is geographically closer to Lagos but routing from Lagos to Johannesburg is frequently worse than Lagos to London because subsea capacity on the west-Africa cables lands in Europe). Keeping the origin in UK South also keeps the rebuild colocated with the existing production stack, which matters for the eventual data migration.

---

## 3. Components Detected

| Component | Type | Technology | Path |
|-----------|------|------------|------|
| dashboard | Full-stack SSR (frontend + API + tRPC + auth) | TanStack Start (Vite + Nitro node-server), React 19, Bun build / Node 24 runtime | `apps/dashboard` |
| db | Schema + migrations | Drizzle ORM, PostgreSQL | `packages/db` |
| auth | Auth server | Better Auth (email + password), Drizzle adapter | `packages/auth` |
| env | Runtime config contract | `@t3-oss/env-core` + zod | `packages/env` |

**Single deployable unit.** The Nitro server serves SSR, the tRPC API and the Better Auth handler (`/api/auth/$`) from one process on port 3001, so this is one container — not a split frontend/API deployment.

### Runtime environment contract

Required by `packages/env/src/server.ts` (validated at boot unless `SKIP_ENV_VALIDATION` is set):

| Variable | Source | Notes |
|----------|--------|-------|
| `DATABASE_URL` | secret | Postgres connection string, `sslmode=require` |
| `BETTER_AUTH_SECRET` | secret | ≥32 chars |
| `BETTER_AUTH_URL` | config | Must equal the app's public origin; also used as Better Auth `trustedOrigins` |
| `NODE_ENV` | config | `production` |
| `DEBUG_PERFORMANCE` | config | `false` |
| `PORT` / `HOST` | Dockerfile | already `3001` / `0.0.0.0` |

---

## 4. Recipe Selection

**Selected:** AZD (Azure Developer CLI + Bicep)

**Rationale:** `azd` gives one command (`azd up`) for build → push → provision → deploy, handles the ACR image push and container app revision update, and supports pre/post-provision hooks needed for the Postgres firewall and Drizzle migrations. Bicep (not Terraform) because there is no existing Terraform state and Bicep needs no state backend. `azd` version 1.31.1 is installed.

> **Deviation from the default azd layout:** `infra/main.bicep` is **resource-group scoped**, not subscription scoped, and `AZURE_RESOURCE_GROUP` is set in the azd environment. This is required because the deploying identity holds Contributor on the resource groups only, not on the subscription (see §6b), so a subscription-scoped deployment would fail.

---

## 5. Architecture

**Stack:** Containers

### Service Mapping

| Component | Azure Service | Name | SKU |
|-----------|---------------|------|-----|
| dashboard | Azure Container Apps | `sycomacademy-app` | Consumption, 0.5 vCPU / 1 GiB, min 1 / max 3 replicas |
| dashboard host | Container Apps Environment | `sycomacademy-cae` | Consumption workload profile |
| container images | Azure Container Registry | `sycomacademyacr01` | Basic |
| database | Azure Database for PostgreSQL Flexible Server | `sycomacademy-postgres` | Burstable `Standard_B1ms`, 32 GB, PG 18, 7-day backups |

### Supporting Services

| Service | Name | Purpose |
|---------|------|---------|
| Log Analytics | `sycomacademy-logs` | Container Apps console + system logs, 30-day retention |
| Application Insights | `sycomacademy-appi` | Request/dependency telemetry (workspace-based) |
| Key Vault | `sycomacademykv01` | Durable store for `database-url`, `better-auth-secret`, `postgres-admin-password` |
| Managed Identity | system-assigned on `sycomacademy-app` | Credential-free access to ACR and Key Vault |

All names verified globally available (ACR + Key Vault via `checkNameAvailability`, Postgres and the Container Apps FQDN via DNS).

### Deliberately excluded from v1

| Service | Why not yet |
|---------|-------------|
| Azure Front Door / CDN | This is SSR: HTML is per-request and uncacheable, so a CDN would add a hop to the part that actually costs time. Vite emits content-hashed immutable assets which the browser caches after first load anyway. Front Door Standard is ~$35/month plus egress and adds a second TLS/DNS surface to debug. Revisit when there is measured Lagos TTFB data, or when the custom domain and WAF are needed at cutover — Front Door's split-TCP and warm connections to the origin are worth more for long-haul clients than its caching. |
| Azure Cache for Redis | Nothing currently needs it. Better Auth sessions live in Postgres and B1ms handles this load comfortably. Adding Redis now means a second stateful dependency and ~$16/month for no measured win. Revisit on session-lookup pressure or when rate limiting needs shared state across replicas. |
| Load balancer (Azure Load Balancer / Application Gateway) | Container Apps ingress already terminates TLS, load-balances across replicas and gives a managed HTTPS endpoint. An L4 load balancer in front of it adds nothing; Application Gateway duplicates what ingress does and costs ~$180/month minimum. |
| API gateway (API Management) | There is one internal consumer (the app's own browser client calling its own tRPC endpoints) and no third-party API, no partner keys, no per-consumer quotas, no versioning story. APIM Developer tier is ~$50/month and Basic ~$150/month to solve a problem that does not exist yet. Revisit when exposing an API to consumers outside this app. |
| VNet integration + Postgres private access | Would remove the Postgres public endpoint entirely, but it also removes the ability to run Drizzle migrations from a laptop without a jumpbox or VPN. Deferred; §5a covers the interim network control. |

### 5a. Security controls actually in place for v1

| Control | Implementation |
|---------|----------------|
| Transport | Container Apps ingress is HTTPS-only (`allowInsecure: false`), TLS terminated at the edge, HTTP redirected |
| Secrets at rest | Key Vault with soft-delete (90 days) and purge protection; secrets written via ARM control plane so no data-plane grant is needed to seed them |
| Secrets in transit to the app | Container Apps secrets, referenced by env vars — never baked into the image, never in git |
| Registry auth | System-assigned managed identity with `AcrPull`; ACR admin user **disabled** |
| Key Vault auth | System-assigned managed identity with `Key Vault Secrets User` |
| Database transport | `require_secure_transport` on; connection string pins `sslmode=require` |
| Database network | Public endpoint with **no** `0.0.0.0` "allow all Azure services" rule. Firewall allows only the container app's actual outbound IPs, resolved at provision time from `properties.outboundIpAddresses` (confirmed on the existing app to be a distinct IP from the environment's static inbound IP, so it must be read at runtime rather than assumed) |
| Migration access | The deploying machine's public IP is added as a named firewall rule for the migration step and **removed immediately afterwards** |
| Image provenance | Images built and pushed by `azd` to a private Basic ACR; anonymous pull disabled |

---

## 6. Provisioning Limit Checklist

### Phase 1 + 2: Resource inventory and capacity

Current usage measured in `uksouth` via `az resource list`. The quota CLI (`az quota list`) returns `BadRequest` for `Microsoft.App` and `Microsoft.DBforPostgreSQL`, so limits come from the official service-limits documentation, as the fallback path allows.

| Resource Type | Number to Deploy | Total After Deployment | Limit/Quota | Notes |
|---------------|------------------|------------------------|-------------|-------|
| Microsoft.App/managedEnvironments | 1 | 3 | 15 per region per subscription | Fetched from: Official docs (quota CLI returned BadRequest) |
| Microsoft.App/containerApps | 1 | 3 | 500 per environment | Fetched from: Official docs (quota CLI returned BadRequest) |
| Microsoft.DBforPostgreSQL/flexibleServers (Standard_B1ms) | 1 | 2 servers / 2 Burstable vCPUs | 10 Burstable vCPUs per region (default) | Fetched from: Official docs (quota CLI returned BadRequest) |
| Microsoft.ContainerRegistry/registries (Basic) | 1 | 3 | 10,000 per subscription | Fetched from: Official docs |
| Microsoft.KeyVault/vaults | 1 | 3 | 25,000 per subscription per region | Fetched from: Official docs |
| Microsoft.OperationalInsights/workspaces | 1 | 3 | No hard per-subscription limit | Fetched from: Official docs (Azure Monitor limits) |
| Microsoft.Insights/components | 1 | 1 | No hard per-subscription limit (workspace-based) | Fetched from: Official docs |

**Status:** ✅ All resources within limits

### 6b. Permission constraint — affects the design

The deploying identity (`a.shehu@sycomsolutions.com`) holds:

| Role | Scope |
|------|-------|
| Contributor | `/subscriptions/de0b9977…/resourceGroups/sycomlearn-prod-rg` |
| Contributor | `/subscriptions/de0b9977…/resourceGroups/sycomlearn-test-rg` |

There is **no subscription-level assignment and no Owner or User Access Administrator anywhere**. Two consequences:

1. **No subscription-scoped deployments.** `infra/main.bicep` must target `resourceGroup` scope and `AZURE_RESOURCE_GROUP` must be set in the azd environment. Handled.
2. **Contributor cannot create role assignments** (`Microsoft.Authorization/roleAssignments/write`). The `AcrPull` and `Key Vault Secrets User` assignments in §5a therefore **cannot be created by this identity**. This is almost certainly why the existing `sycomlearn-prod-app` authenticates to ACR with an admin-user password and why `sycomlearnprodkv01` has RBAC disabled — not an oversight, a permission ceiling.

This is a **blocking decision for the user**, because the two ways forward differ in security posture:

- **Option A (preferred):** someone with Owner on the subscription grants this identity **User Access Administrator** (or Owner) on `sycomlearn-prod-rg`. One-time, scoped to the one resource group, and unlocks the managed-identity design in §5a exactly as written — no registry password, no Key Vault access policies.
- **Option B (works today):** stay within Contributor. Key Vault uses **access policies** instead of RBAC (Contributor can set these, since they are a control-plane property of the vault) to grant the container app `get`/`list` on secrets. For the registry, use an ACR **repository-scoped token** limited to `pull` on the `dashboard` repository, with its password held in Key Vault — least privilege within the ceiling, and materially better than the admin-user password the current production app uses. The `AcrPull` and `Key Vault Secrets User` role assignments are omitted from the Bicep.

**Recorded decision: Option A.** The infrastructure is written for managed identity throughout — ACR admin user disabled, Key Vault RBAC enabled, no registry password anywhere. It will not provision until someone with Owner on the subscription runs:

Written as one line so it runs unchanged in PowerShell, CMD and bash:

```
az role assignment create --assignee-object-id edee4978-903c-44c1-8ff4-590a926e1d82 --assignee-principal-type User --role "User Access Administrator" --scope /subscriptions/de0b9977-4b54-468c-8346-c27f06a416ed/resourceGroups/sycomlearn-prod-rg
```

Portal equivalent, if the person granting it does not have Azure CLI installed: Resource groups → `sycomlearn-prod-rg` → Access control (IAM) → Add role assignment → **User Access Administrator** → Members → `a.shehu@sycomsolutions.com` → Review + assign. On the Conditions step, the least-privilege choice is to constrain the assignable roles to **AcrPull** and **Key Vault Secrets User**, which is all this template needs.

Verify with `az role assignment list --assignee edee4978-903c-44c1-8ff4-590a926e1d82 --all -o table`. Until then `azd provision` fails at `infra/modules/acr-pull-role.bicep` and `infra/modules/key-vault-role.bicep` with `AuthorizationFailed`; everything before those two modules would succeed, so a failed run leaves a partially provisioned stack rather than a broken one, and re-running after the grant completes it.

---

## 7. Execution Checklist

### Phase 1: Planning
- [x] Analyze workspace
- [x] Gather requirements
- [x] Confirm subscription and location with user
- [x] Confirm resource group and naming convention with user
- [x] Prepare resource inventory
- [x] Fetch quotas and validate capacity
- [x] Scan codebase
- [x] Select recipe
- [x] Plan architecture
- [x] Resolve the §6b permission decision — Option A
- [x] **User approved this plan**

### Phase 2: Execution
- [x] Generate `azure.yaml`
- [x] Generate `infra/main.bicep` + modules
- [x] Generate `scripts/postprovision.sh` (Postgres firewall + Drizzle migrations)
- [x] Seed secret values into the azd environment (generated locally, never committed)
- [x] Point app config at Key Vault / Container Apps hostname
- [x] **Update plan status to "Ready for Validation"**

### Phase 3: Validation
- [x] `az bicep build` clean, no linter warnings
- [x] `azd provision --preview` (ARM what-if) succeeds and reports **Skip** for every existing `sycomlearn-*` resource
- [ ] Update plan status to "Validated"

### Phase 4: Deployment — BLOCKED
- [ ] **Prerequisite: User Access Administrator granted on `sycomlearn-prod-rg`** (see §6b)
- [ ] `azd up`
- [ ] Confirm container app URL responds and Postgres connectivity works
- [ ] Report deployed endpoint URL
- [ ] Update plan status to "Deployed"

---

## 7b. Validation Proof

| Check | Command Run | Result | Timestamp |
|-------|-------------|--------|-----------|
| Template compiles | `az bicep build --file infra/main.bicep` | ✅ Pass — exit 0, no linter warnings | 2026-08-19 |
| azd project config parses | `azd provision --preview --no-prompt` | ✅ Pass — after adding `language: docker`, which azd 1.31.1 requires (it segfaults on a service without it) | 2026-08-19 |
| Existing production untouched | `azd provision --preview` (ARM what-if) | ✅ Pass — `sycomlearn-prod-app`, `-cae`, `-postgres`, `-logs`, `sycomlearnprodacr01`, `sycomlearnprodkv01` all reported **Skip** | 2026-08-19 |
| New resources planned | `azd provision --preview` (ARM what-if) | ✅ Pass — **Create** for `sycomacademy-cae`, `sycomacademyacr01`, `sycomacademy-postgres`, `sycomacademy-appi`, `sycomacademy-logs` | 2026-08-19 |
| Resource names available | `az acr check-name`, Key Vault `checkNameAvailability`, DNS probes | ✅ Pass — all free | 2026-08-19 |
| Secrets excluded from git | `git status --porcelain --untracked-files=all .azure` | ✅ Pass — only `.gitignore` and `deployment-plan.md` trackable; `sycomacademy-alpha/.env` ignored | 2026-08-19 |

> `azd provision --preview` does not list `sycomacademy-app` or `sycomacademykv01` in its summary. Both are present in the compiled template; ARM what-if omits resources whose properties depend on values only known at deployment time — the container app derives its origin from the environment's `defaultDomain`, and the vault's `database-url` secret embeds the Postgres FQDN. This is a what-if limitation, not a gap in the template.

**Validated by:** manual validation (azure-validate equivalent checks)
**Validation timestamp:** 2026-08-19

---

## 8. Files to Generate

| File | Purpose | Status |
|------|---------|--------|
| `.azure/deployment-plan.md` | This plan | ✅ |
| `.azure/.gitignore` | Ignores azd env state, keeps this plan tracked | ✅ |
| `azure.yaml` | azd service + hooks configuration | ✅ |
| `infra/main.bicep` | Resource-group-scoped entry point | ✅ |
| `infra/main.parameters.json` | azd → Bicep parameter mapping | ✅ |
| `infra/modules/monitoring.bicep` | Log Analytics + Application Insights | ✅ |
| `infra/modules/container-registry.bicep` | ACR | ✅ |
| `infra/modules/key-vault.bicep` | Key Vault + secrets | ✅ |
| `infra/modules/postgres.bicep` | Flexible Server + database | ✅ |
| `infra/modules/container-apps-env.bicep` | Container Apps Environment | ✅ |
| `infra/modules/container-app.bicep` | The dashboard container app | ✅ |
| `infra/modules/acr-pull-role.bicep` | AcrPull grant (phase 2, breaks the dependency cycle) | ✅ |
| `infra/modules/key-vault-role.bicep` | Key Vault Secrets User / Officer grants | ✅ |
| `scripts/postprovision.sh` | Postgres firewall rules + Drizzle migrations | ✅ |
| `apps/dashboard/Dockerfile` | Already correct (port 3001, HOST 0.0.0.0) — unchanged | ✅ |

### azd environment state (local, not committed)

`azd env` `sycomacademy-alpha` is created and seeded:

| Key | Value |
|-----|-------|
| `AZURE_SUBSCRIPTION_ID` | `de0b9977-4b54-468c-8346-c27f06a416ed` |
| `AZURE_LOCATION` | `uksouth` |
| `AZURE_RESOURCE_GROUP` | `sycomlearn-prod-rg` (required — the template is RG-scoped) |
| `AZURE_RESOURCE_PREFIX` | `sycomacademy` |
| `AZURE_PRINCIPAL_ID` | `edee4978-903c-44c1-8ff4-590a926e1d82` |
| `POSTGRES_ADMIN_LOGIN` | `sycomadmin` |
| `POSTGRES_ADMIN_PASSWORD` | generated locally, 32 alphanumeric chars (kept URL-safe because it is embedded in `DATABASE_URL`) |
| `BETTER_AUTH_SECRET` | generated locally, 64 hex chars |

`azd` is configured with `auth.useAzCliAuth true`, so it reuses the existing `az login` session.

---

## 9. Next Steps

> Current: Phase 4 — blocked on one external action

1. **Someone with Owner on the subscription grants User Access Administrator on `sycomlearn-prod-rg`** using the command in §6b. This is the only blocker.
2. Run `azd up`. It provisions the stack, runs `scripts/postprovision.sh` (Postgres firewall + Drizzle migrations), builds the image via ACR Tasks and deploys the revision.
3. Verify the container app URL from `SERVICE_DASHBOARD_URI`, sign-up/sign-in against Better Auth, and confirm Postgres connectivity.
4. Set status to `Deployed` and record the URL.

### Known follow-ups after the alpha is up

| Item | Why |
|------|-----|
| Front Door + WAF + custom domain | Needed at cutover, and worth re-evaluating once Lagos TTFB is measured against the UK South origin |
| VNet integration + Postgres private access | Removes the public database endpoint; needs a migration path that does not run from a laptop |
| Data migration `sycomlearn-prod-postgres` → `sycomacademy-postgres` | Cutover step; both servers are Burstable B1ms / PG 18 in the same region, so `pg_dump | pg_restore` is straightforward |
| Delete `sycomlearn-test-rg` | Confirmed unused |
| ACR image retention policy | Basic SKU has a 10 GB quota; untagged manifests accumulate with every `azd deploy` |
| Verify ACR Tasks handles the Dockerfile's BuildKit cache mount | `apps/dashboard/Dockerfile` uses `RUN --mount=type=cache`. If the remote build rejects it, either drop the cache mount or switch to a local `platform: linux/amd64` build |
