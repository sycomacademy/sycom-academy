# Sycom Learn — agent standards

This repo is a **Bun + Turborepo** monorepo. The product UI is a **TanStack Start** dashboard, not Next.js.

If a generic skill (shadcn, coss, Vercel) conflicts with these files, **this document and `.cursor/rules/` win**.

| Topic | Rule |
| --- | --- |
| Where code lives | `.cursor/rules/architecture.mdc` |
| Dashboard folders | `.cursor/rules/dashboard-structure.mdc` |
| Forms | `.cursor/rules/forms.mdc` |
| Queries, tRPC, Zod | `.cursor/rules/data-and-validation.mdc` |
| Auth / session / redirects | `.cursor/rules/auth-and-session.mdc` |

## Stack (do not replace)

| Concern | Use |
| --- | --- |
| App framework | TanStack Start + TanStack Router (file routes) |
| Server data (domain) | tRPC in `packages/api` + TanStack Query |
| Cookie/session reads | TanStack Start `createServerFn` + middleware |
| Auth | Better Auth (`packages/auth` + `authClient`) |
| Validation | Zod 4 classic: `import { z } from "zod"` |
| Forms | React Hook Form + `zodResolver` + `@sycom-learn/ui` Field/Form |
| UI primitives | `@sycom-learn/ui` (coss / Base UI). Do not add `components/ui` inside the app |
| DB | Drizzle in `packages/db` |
| Toasts | `toastManager` from `@sycom-learn/ui/components/toast` |
| Logging | `@sycom-learn/logger` (`createLoggerWithContext`) |
| Package manager | Bun |

**Never introduce:** Next.js APIs (`next/link`, `next/image`, `next/navigation`), axios, SWR, Zustand, Redux, TanStack Form, `fetch` to our own API, Sonner, raw `z.string().email()` schemas in a second validation library (Yup/Valibot).

## Package ownership

```
apps/dashboard          URLs, pages, composition, Start server fns, auth client
packages/api            tRPC router, procedures, input schemas shared with the client
packages/auth           Better Auth server
packages/db             Drizzle schema + migrations
packages/ui             Primitives, Field/Form, Image, toasts
packages/env            Env validation
packages/logger         Pino
```

Apps import packages by name (`@sycom-learn/ui/components/button`). They do not reach into another package with relative `../../packages/...` in source (tsconfig paths are for the compiler only).
