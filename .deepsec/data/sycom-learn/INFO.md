# sycom-learn

## What this codebase does
- Bun + Turborepo monorepo for Sycom Learn, a cybersecurity training dashboard.
- The app runtime is TanStack Start/TanStack Router in `apps/dashboard`, not Next.js.
- Current implemented product surface is mostly auth, dashboard shell, session display, and a small tRPC demo router.
- Domain data for courses, cohorts, tenancy, exams, certificates, and learner progress is not implemented in the DB/API yet.
- Production target is Azure Container Apps with PostgreSQL Flexible Server behind a private endpoint; migrations run from an Azure Container Apps job.

## Auth shape
- Better Auth is configured in `packages/auth` with Drizzle, email/password auth, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, and TanStack Start cookie integration.
- `/api/auth/$` forwards GET and POST directly to `auth.handler`; client auth mutations use `authClient` against the same-origin Better Auth API.
- Session reads use `sessionMiddleware` plus `getSession` server fn, which calls `auth.api.getSession({ headers })` and returns `{ session, user } | null`.
- Route access is enforced in TanStack Router `beforeLoad`: `/dashboard` requires a session, guest auth pages redirect signed-in users, and `/` redirects based on session.
- tRPC context also calls `auth.api.getSession`; procedures that need identity must use `protectedProcedure`, which throws `UNAUTHORIZED` when `ctx.session` is missing.

## Threat model
- Public internet reaches the Azure Container App HTTPS ingress, the auth pages, Better Auth endpoints, and the tRPC endpoint.
- Browser clients authenticate with Better Auth cookies; review CSRF/origin behavior, cookie flags, session lifetime, credential stuffing, and password reset/email flows as features expand.
- tRPC currently exposes a public health check and one protected demo query; future domain routers need explicit auth, tenant isolation, and input schemas.
- Rich editor/media code accepts imported HTML, Markdown, JSON, DOCX, URLs, YouTube embeds, and local files; persisted editor content and upload callbacks are high-value XSS/storage-abuse review points.
- Database access is intended to be private: app and migration job use secret connection strings inside the VNet, while operators use Azure auth/Key Vault/Tailscale access VM paths.

## Project-specific patterns to flag
- Do not add domain HTTP routes outside `routes/api/trpc/$`; domain reads/writes should be tRPC procedures in `packages/api`.
- Do not gate dashboard routes with `useEffect`, `authClient.useSession()`, or client-invented session objects; use `sessionQueryOptions` in `beforeLoad`.
- Redirect params must keep using `safeRedirectPath` and `resolvePostAuthRedirect`; any new post-auth redirect path is an open-redirect review target.
- Validate env through `packages/env`; app/package code should not grow direct `process.env` reads except established server/env/logger/tooling locations.
- `CORS_ORIGIN` appears in deployment env, but no app-side CORS enforcement was found; do not assume it protects tRPC or auth endpoints.

## Known false-positives
- `fetch` in `apps/dashboard/src/router.tsx` is the tRPC batch link to `/api/trpc` with credentials, not an ad hoc API client.
- `next-themes` is used as a theme provider only; no Next.js routing/image/navigation APIs were found in app source.
- `dangerouslySetInnerHTML` appears in QR SVG generation and chart CSS variable injection; review only if the QR data/chart config becomes user-controlled.
- `BETTER_AUTH_SECRET=build-time-placeholder-secret-not-used-at-runtime` in CI/Docker build context is a placeholder; runtime secrets are injected separately.
- Auth schema columns named `token`, `password`, `idToken`, and similar are Better Auth storage fields; logger redaction is configured for common token/password paths.
