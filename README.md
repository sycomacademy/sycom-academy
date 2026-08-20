# sycom-learn

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Start, Self, TRPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Start** - SSR framework with TanStack Router
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/ui`
- **tRPC** - End-to-end type-safe APIs
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Oxlint** - Oxlint + Oxfmt (linting & formatting)
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/dashboard/.env` file with your PostgreSQL connection details.

3. Apply the schema to your database:

```bash
bun run db:push
```

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the fullstack application.

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/ui`.

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/dashboard/components.json`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@sycom-learn/ui/components/button";
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/dashboard`.

## Deployment

Production runs on Azure Container Apps in `sycomlearn-prod-rg` (UK South), against
a private PostgreSQL Flexible Server. How to reach it from DataGrip (access VM,
host `10.20.2.4`, `bun run db:password` / `db:token`) is in
[`infra/README.md`](infra/README.md#developer-database-access-with-datagrip).

**Pushing to `main` deploys.** `.github/workflows/deploy.yml` builds the image,
pushes it to Azure Container Registry, rolls the container app onto the new
revision, applies Drizzle migrations from inside the VNet, and fails the run if the
app does not come back healthy. Roughly four minutes end to end. No secrets are
involved — CI authenticates to Azure with OIDC.

Infrastructure is separate. Changes under `infra/` are Bicep and go out manually
with `azd provision`, never from CI. See the two-paths table in
[`infra/README.md`](infra/README.md#two-deployment-paths) for which to use when.

### Local Docker

- Config: `docker-compose.yml`; the app Dockerfile is `apps/dashboard/Dockerfile`
- Build images: `bun run docker:build`
- Start: `bun run docker:up`
- Logs: `bun run docker:logs`
- Stop: `bun run docker:down`

Runtime environment variables come from `apps/dashboard/.env`, with container
networking values overridden in `docker-compose.yml`.

## Git Hooks and Formatting

- Run checks: `bun run check`

## Project Structure

```
sycom-learn/
├── apps/
│   └── dashboard/   # Fullstack application (React + TanStack Start)
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles
│   ├── api/         # API layer / business logic
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:dashboard`: Start only the dashboard application
- `bun run check-types`: Check TypeScript types across all apps
- `bun run db:push`: Push schema changes to database
- `bun run db:generate`: Generate database client/types
- `bun run db:migrate`: Run database migrations
- `bun run db:studio`: Open database studio UI
- `bun run check`: Run Oxlint and Oxfmt
- `bun run docker:build`: Build the Docker Compose images
- `bun run docker:up`: Build and start the Docker Compose stack
- `bun run docker:logs`: Tail logs from the Docker Compose stack
- `bun run docker:down`: Stop the Docker Compose stack
- `bun run vm:up`: Start the Tailscale access VM (prod DataGrip path)
- `bun run vm:down`: Deallocate the access VM (stops compute billing)
- `bun run vm:status`: Access VM power state
- `bun run db:password`: Copy `sycomadmin` password for DataGrip (no trailing newline)
- `bun run db:token`: Copy a fresh Entra token for DataGrip (expires ~1 hour)
