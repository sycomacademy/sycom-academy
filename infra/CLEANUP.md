# Cleanup

Two lists. The first is leftover from the rebuild and is safe to delete now.
The second is the old production stack: it still serves `learn.sycom.academy`,
so it stays until the rewrite is finished and cut over.

Nothing here is configured by hand in the portal. Delete with `az` (or the
GitHub / Neon consoles where noted). Re-check the live URL before touching
anything in the sunset list.

- **Subscription:** `de0b9977-4b54-468c-8346-c27f06a416ed`
- **Resource group:** `sycomlearn-prod-rg`
- **GitHub:** `sycomacademy/sycom-academy`

---

## Quick wins — delete now

These are not in the Bicep template, not on the CI path, and not serving
users. They were created while choosing a host and then abandoned.

### 1. Azure Static Web Apps

A GitHub Action (`azure-static-web-apps-victorious-coast-0f0901a03.yml`) was
added by the Azure SWA flow and deleted in the same session. The site and
its deploy token were left behind.

| What | Name |
|---|---|
| Static Web App | `sycom-academy` |
| Hostname | `https://victorious-coast-0f0901a03.7.azurestaticapps.net/` (still 200) |
| GitHub secret | `AZURE_STATIC_WEB_APPS_API_TOKEN_VICTORIOUS_COAST_0F0901A03` |

```bash
az staticwebapp delete -g sycomlearn-prod-rg -n sycom-academy --yes
```

```bash
gh secret delete AZURE_STATIC_WEB_APPS_API_TOKEN_VICTORIOUS_COAST_0F0901A03 --repo sycomacademy/sycom-academy
```

### 2. Leftover ACR repository from early `azd up`

CI publishes `sycom-learn/dashboard`, tagged with the commit SHA. The
`-sycomacademy-alpha` repository is from the first laptop builds and is
unused.

| Registry | Repository | Tags |
|---|---|---|
| `sycomacademyacr01` | `sycom-learn/dashboard-sycomacademy-alpha` | `azd-deploy-*` |

```bash
az acr repository delete -n sycomacademyacr01 --repository sycom-learn/dashboard-sycomacademy-alpha --yes
```

Do **not** delete `sycom-learn/dashboard`. That is the running app.

### 3. Neon project created during the rebuild

Production Postgres is `sycomacademy-postgres`. This Neon project was
created the day of the rebuild, last compute the same evening, and is not
referenced by the repo.

| What | Value |
|---|---|
| Name | `Sycom academy` |
| Id | `square-glitter-89843133` |
| Region | `aws-eu-west-2` |
| Created | 2026-08-19 |

Delete it in the Neon console, or:

```bash
neonctl projects delete square-glitter-89843133
```

---

## Sunset after development is complete

The rewrite is live at the Container Apps default hostname. The custom
domain still points at the **old** app. Delete this group only after:

1. Data has been migrated from `sycomlearn-prod-postgres` to `sycomacademy-postgres`.
2. `learn.sycom.academy` has been moved onto `sycomacademy-app` (Front Door / cert).
3. A smoke check of `https://learn.sycom.academy` hits the new stack.

Until then this is production, not leftover.

### Still serving users

| Resource | Type | Why it stays |
|---|---|---|
| `sycomlearn-prod-app` | Container app | Bound to `learn.sycom.academy` |
| `sycomlearn-prod-cae` | Container Apps environment | Hosts the old app and the managed cert |
| `learn.sycom.academy-sycomlea-260519133833` | Managed certificate | TLS for the custom domain |
| `sycomlearn-prod-postgres` | PostgreSQL Flexible Server | Live data |

Confirm before cutting over:

```bash
az containerapp show -g sycomlearn-prod-rg -n sycomlearn-prod-app \
  --query "{fqdn:properties.configuration.ingress.fqdn,customDomains:properties.configuration.ingress.customDomains}" -o json
```

```bash
curl -sI https://learn.sycom.academy
```

Today that returns 307 to `/sign-in` from the old app. The new app is at
`https://sycomacademy-app.icysmoke-8008f162.uksouth.azurecontainerapps.io/`
and has no custom domain.

### Supporting the old app — delete with it

| Resource | Type |
|---|---|
| `sycomlearnprodacr01` | Container registry |
| `sycomlearnprodkv01` | Key Vault |
| `sycomlearn-prod-logs` | Log Analytics |
| `sycomlearn-prod-caesycomlearnprodacr01sycomlearn-prod-rgOidc` | User-assigned identity (ACR pull) |
| `sycomlearn-prod-email` + `AzureManagedDomain` | Communication email |
| `SycomLearn` | Application Gateway WAF policy |

After the domain has moved, delete the old app first, then the environment,
then the rest. Azure will refuse to delete the environment while the app
and certificate still exist.

There is no Bicep for this stack. A resource-group delete is **not** an
option — the new `sycomacademy-*` resources live in the same group.

### Probably not this repo — confirm before deleting

| What | Notes |
|---|---|
| Neon project `Sycom` (`bold-truth-25407487`) | Older, still computing today. Likely the previous LMS, not this rebuild. |
| Trigger.dev `sycom-lms` | Not referenced in this repository. |

---

## What is not cleanup

These are unfinished on the new stack, not orphans. Tracked in
[`README.md`](./README.md#known-follow-ups).

- Tailscale access VM (`sycomacademy-access`) — deployed. Remaining work is in
  the Tailscale admin console (approve routes, split DNS, disable key expiry).
  Overnight auto-shutdown is off until `Microsoft.DevTestLab` is registered on
  the subscription.
- Front Door, WAF, custom domain on `sycomacademy-app` — needed at cutover.
- Staging environment.
- Slimmer runner image and cheaper migration-job CLI calls.
