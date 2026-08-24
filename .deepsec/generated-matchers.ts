import { compileDeclarativeMatchers, type DeepsecPlugin } from "deepsec/config";

const specs = [
  {
    "version": 1,
    "slug": "better-auth-tanstack-catchall",
    "description": "TanStack Start file route catch-all that forwards Better Auth GET/POST requests to auth.handler.",
    "noiseTier": "precise",
    "filePatterns": [
      "apps/dashboard/src/routes/api/auth/$.ts"
    ],
    "requires": {
      "tech": [
        "TanStack Start",
        "Better Auth"
      ],
      "sentinelFiles": [
        "packages/auth/src/index.ts"
      ]
    },
    "patterns": [
      {
        "source": "createFileRoute\\([\"']/api/auth/\\$[\"']\\)\\(\\{[\\s\\S]*?server:\\s*\\{[\\s\\S]*?handlers:\\s*\\{[\\s\\S]*?\\b(?:GET|POST)\\s*:\\s*\\([^)]*\\)\\s*=>\\s*\\{?\\s*return\\s+auth\\.handler\\(request\\)",
        "label": "tanstack-start-better-auth-handler-route"
      },
      {
        "source": "\\b(?:GET|POST)\\s*:\\s*\\(\\{\\s*request\\s*\\}\\)\\s*=>\\s*\\{\\s*return\\s+auth\\.handler\\(request\\);?\\s*\\}",
        "label": "better-auth-request-forwarder"
      }
    ],
    "examples": [
      "export const Route = createFileRoute('/api/auth/$')({ server: { handlers: { GET: ({ request }) => { return auth.handler(request); } } } });",
      "POST: ({ request }) => { return auth.handler(request); }"
    ],
    "closesSurfaceIds": [
      "better-auth-http"
    ]
  },
  {
    "version": 1,
    "slug": "better-auth-drizzle-server",
    "description": "Better Auth server factory backed by the Drizzle adapter and the Better Auth auth schema tables.",
    "noiseTier": "precise",
    "filePatterns": [
      "packages/auth/src/**/*.ts",
      "packages/db/src/schema/auth.ts"
    ],
    "requires": {
      "tech": [
        "Better Auth",
        "Drizzle"
      ],
      "sentinelFiles": [
        "apps/dashboard/src/routes/api/auth/$.ts"
      ]
    },
    "patterns": [
      {
        "source": "return\\s+betterAuth\\(\\{[\\s\\S]*?database:\\s*drizzleAdapter\\(",
        "label": "better-auth-drizzle-adapter"
      },
      {
        "source": "plugins:\\s*\\[[\\s\\S]*?tanstackStartCookies\\(\\)",
        "label": "better-auth-tanstack-start-cookies"
      },
      {
        "source": "trustedOrigins:\\s*\\[\\s*env\\.BETTER_AUTH_URL\\s*\\]|secret:\\s*env\\.BETTER_AUTH_SECRET",
        "label": "better-auth-origin-and-secret"
      },
      {
        "source": "export\\s+const\\s+(?:user|session|account|verification)\\s*=\\s*pgTable\\([\"'](?:user|session|account|verification)[\"']",
        "label": "better-auth-drizzle-schema-table"
      }
    ],
    "examples": [
      "return betterAuth({ database: drizzleAdapter(db, { provider: 'pg' }) });",
      "plugins: [tanstackStartCookies()]",
      "export const session = pgTable('session', { id: text('id').primaryKey() });"
    ],
    "closesSurfaceIds": [
      "better-auth-http"
    ]
  },
  {
    "version": 1,
    "slug": "tanstack-start-trpc-fetch-adapter",
    "description": "TanStack Start tRPC catch-all route using the fetch adapter, app router, and request context.",
    "noiseTier": "precise",
    "filePatterns": [
      "apps/dashboard/src/routes/api/trpc/$.ts",
      "packages/api/src/**/*.ts"
    ],
    "requires": {
      "tech": [
        "TanStack Start",
        "tRPC"
      ],
      "sentinelFiles": [
        "packages/api/src/routers/index.ts"
      ]
    },
    "patterns": [
      {
        "source": "fetchRequestHandler\\(\\{[\\s\\S]*?router:\\s*appRouter[\\s\\S]*?createContext[\\s\\S]*?endpoint:\\s*[\"']/api/trpc[\"']",
        "label": "trpc-fetch-request-handler"
      },
      {
        "source": "createFileRoute\\([\"']/api/trpc/\\$[\"']\\)\\(\\{[\\s\\S]*?server:\\s*\\{[\\s\\S]*?handlers:",
        "label": "tanstack-start-trpc-route-handlers"
      },
      {
        "source": "export\\s+async\\s+function\\s+createContext\\(\\{\\s*req\\s*\\}",
        "label": "trpc-request-context-factory"
      },
      {
        "source": "auth\\.api\\.getSession\\(\\{\\s*headers:\\s*req\\.headers",
        "label": "trpc-context-better-auth-session"
      }
    ],
    "examples": [
      "return fetchRequestHandler({ req: request, router: appRouter, createContext, endpoint: '/api/trpc' });",
      "export const Route = createFileRoute('/api/trpc/$')({ server: { handlers: {} } });",
      "auth.api.getSession({ headers: req.headers })"
    ],
    "closesSurfaceIds": [
      "trpc-rpc"
    ]
  },
  {
    "version": 1,
    "slug": "trpc-procedure-factory",
    "description": "Repository tRPC context, router, public procedure, and protected procedure registration primitives.",
    "noiseTier": "precise",
    "filePatterns": [
      "packages/api/src/**/*.ts"
    ],
    "requires": {
      "tech": [
        "tRPC"
      ],
      "sentinelFiles": [
        "packages/api/src/t.ts"
      ]
    },
    "patterns": [
      {
        "source": "initTRPC\\.context<Context>\\(\\)\\.create\\(\\)",
        "label": "typed-trpc-root"
      },
      {
        "source": "export\\s+const\\s+publicProcedure\\s*=\\s*baseProcedure",
        "label": "trpc-public-procedure-factory"
      },
      {
        "source": "export\\s+const\\s+protectedProcedure\\s*=\\s*baseProcedure\\.use\\(",
        "label": "trpc-protected-procedure-factory"
      },
      {
        "source": "throw\\s+new\\s+TRPCError\\(\\{[\\s\\S]*?code:\\s*[\"']UNAUTHORIZED[\"']",
        "label": "trpc-protected-procedure-unauthorized"
      },
      {
        "source": "router\\(\\{[\\s\\S]*?\\b(?:publicProcedure|protectedProcedure)\\.(?:query|mutation|subscription)\\(",
        "label": "trpc-router-procedure-registration"
      }
    ],
    "examples": [
      "export const t = initTRPC.context<Context>().create();",
      "export const protectedProcedure = baseProcedure.use(({ ctx, next }) => { throw new TRPCError({ code: 'UNAUTHORIZED' }); });",
      "export const appRouter = router({ healthCheck: publicProcedure.query(() => 'OK') });"
    ],
    "closesSurfaceIds": [
      "trpc-rpc"
    ]
  },
  {
    "version": 1,
    "slug": "tanstack-start-session-serverfn",
    "description": "TanStack Start server function, middleware, and session query cache primitives for Better Auth session reads.",
    "noiseTier": "precise",
    "filePatterns": [
      "apps/dashboard/src/functions/**/*.ts",
      "apps/dashboard/src/middleware/**/*.ts",
      "apps/dashboard/src/lib/auth/*.ts",
      "apps/dashboard/src/hooks/*.ts"
    ],
    "requires": {
      "tech": [
        "TanStack Start",
        "TanStack Query",
        "Better Auth"
      ],
      "sentinelFiles": [
        "apps/dashboard/src/routes/dashboard/route.tsx"
      ]
    },
    "patterns": [
      {
        "source": "createServerFn\\(\\{\\s*method:\\s*[\"']GET[\"']\\s*\\}\\)[\\s\\S]*?\\.middleware\\(\\[sessionMiddleware\\]\\)[\\s\\S]*?\\.handler\\(",
        "label": "start-session-server-function"
      },
      {
        "source": "createMiddleware\\(\\)\\.server\\(async\\s*\\(\\{\\s*next,\\s*request\\s*\\}\\)\\s*=>[\\s\\S]*?auth\\.api\\.getSession\\(\\{[\\s\\S]*?headers:\\s*request\\.headers",
        "label": "start-session-middleware"
      },
      {
        "source": "createMiddleware\\(\\{\\s*type:\\s*[\"'](?:request|function)[\"']\\s*\\}\\)\\.server",
        "label": "start-request-or-function-middleware"
      },
      {
        "source": "export\\s+const\\s+SESSION_QUERY_KEY\\s*=\\s*\\[[\"']session[\"']\\]\\s+as\\s+const",
        "label": "session-query-key"
      },
      {
        "source": "queryOptions\\(\\{[\\s\\S]*?queryKey:\\s*SESSION_QUERY_KEY[\\s\\S]*?queryFn:\\s*\\(\\)\\s*=>\\s*getSession\\(\\)",
        "label": "session-query-options"
      },
      {
        "source": "createAuthClient\\(\\{\\}\\)",
        "label": "better-auth-client"
      },
      {
        "source": "export\\s+function\\s+(?:safeRedirectPath|resolvePostAuthRedirect)\\(",
        "label": "auth-redirect-helper"
      },
      {
        "source": "useSuspenseQuery\\(sessionQueryOptions\\(\\)\\)",
        "label": "authenticated-session-hook"
      }
    ],
    "examples": [
      "export const getSession = createServerFn({ method: 'GET' }).middleware([sessionMiddleware]).handler(() => null);",
      "export const SESSION_QUERY_KEY = ['session'] as const",
      "const { data } = useSuspenseQuery(sessionQueryOptions())"
    ],
    "closesSurfaceIds": [
      "start-session-functions"
    ]
  },
  {
    "version": 1,
    "slug": "tiptap-editor-media-registration",
    "description": "TipTap editor, extension, node view, toolbar command, file picker, upload, and signed media URL primitives.",
    "noiseTier": "normal",
    "filePatterns": [
      "packages/ui/src/components/tiptap/**/*.ts",
      "packages/ui/src/components/tiptap/**/*.tsx",
      "packages/ui/src/components/file-uploader.tsx",
      "packages/ui/src/hooks/use-file-upload.ts",
      "packages/ui/src/lib/lesson-media.ts",
      "packages/ui/src/lib/tiptap-upload.ts",
      "packages/ui/src/lib/tiptap-utils.ts",
      "packages/ui/src/image/**/*.ts"
    ],
    "requires": {
      "tech": [
        "TipTap",
        "React"
      ],
      "sentinelFiles": [
        "packages/ui/src/components/tiptap/rich-text-editor.tsx"
      ]
    },
    "patterns": [
      {
        "source": "import\\s+[^;]*from\\s+[\"']@tiptap/(?:core|react|pm|extension-[^\"']+|starter-kit|markdown)[\"']",
        "label": "tiptap-package-import"
      },
      {
        "source": "\\b(?:Node|Extension)\\.create(?:<[^>]+>)?\\(\\{[\\s\\S]*?name:\\s*[\"'][^\"']+[\"']",
        "label": "tiptap-extension-registration"
      },
      {
        "source": "ReactNodeViewRenderer\\(",
        "label": "tiptap-react-node-view"
      },
      {
        "source": "\\b(?:EditorContent|useEditor|BubbleMenu|FloatingMenu)\\b",
        "label": "tiptap-editor-react-surface"
      },
      {
        "source": "editor\\??\\.chain\\(\\)\\.focus\\(\\)\\.(?:insertImagePlaceholder|insertVideoPlaceholder|insertAudioPlaceholder|insertFilePlaceholder|insertLessonQuestion|setContent|setLink|toggleBold|toggleHeading|insertTable)\\(",
        "label": "tiptap-editor-command"
      },
      {
        "source": "FileUploader[\\s\\S]*?onFilesChange|useFileUpload\\(|URL\\.createObjectURL\\(|new\\s+FileReader\\(",
        "label": "client-file-selection-or-preview"
      },
      {
        "source": "SignedMediaUrlContext|useMediaDeliveryUrl\\(|collectLessonMediaRefs\\(",
        "label": "signed-editor-media-delivery"
      }
    ],
    "excludeFilePatterns": [
      "**/*.test.*",
      "**/*.spec.*",
      "**/*.d.ts",
      "**/node_modules/**",
      "**/dist/**"
    ],
    "examples": [
      "export const ImagePlaceholder = Node.create<ImagePlaceholderOptions>({ name: 'image-placeholder' });",
      "return ReactNodeViewRenderer(TiptapImage);",
      "const editor = useEditor({ extensions });",
      "editor?.chain().focus().insertImagePlaceholder().run();",
      "const url = URL.createObjectURL(file);",
      "const reader = new FileReader();"
    ],
    "closesSurfaceIds": [
      "editor-media-client-inputs"
    ]
  },
  {
    "version": 1,
    "slug": "azure-container-apps-bicep-ingress",
    "description": "Azure Container Apps public ingress and supporting Bicep resource declarations for runtime, VNet, private Postgres, Key Vault, and Docker runtime.",
    "noiseTier": "precise",
    "filePatterns": [
      "infra/**/*.bicep",
      "apps/dashboard/Dockerfile",
      "docker-compose.yml",
      "azure.yaml"
    ],
    "requires": {
      "tech": [
        "Azure Container Apps",
        "Bicep",
        "Docker"
      ],
      "sentinelFiles": [
        "infra/main.bicep",
        "azure.yaml"
      ]
    },
    "patterns": [
      {
        "source": "resource\\s+\\w+\\s+'Microsoft\\.App/containerApps@[^']+'\\s*=\\s*\\{[\\s\\S]*?ingress:\\s*\\{[\\s\\S]*?external:\\s*true[\\s\\S]*?allowInsecure:\\s*false",
        "label": "azure-container-app-public-https-ingress"
      },
      {
        "source": "resource\\s+\\w+\\s+'Microsoft\\.App/managedEnvironments@[^']+'\\s*=\\s*\\{[\\s\\S]*?vnetConfiguration:",
        "label": "azure-container-apps-managed-environment"
      },
      {
        "source": "resource\\s+\\w+\\s+'Microsoft\\.DBforPostgreSQL/flexibleServers@[^']+'\\s*=\\s*\\{[\\s\\S]*?publicNetworkAccess:\\s*'Disabled'",
        "label": "azure-private-postgres-flexible-server"
      },
      {
        "source": "resource\\s+\\w+\\s+'Microsoft\\.Network/privateEndpoints@[^']+'\\s*=",
        "label": "azure-private-endpoint"
      },
      {
        "source": "resource\\s+\\w+\\s+'Microsoft\\.KeyVault/vaults@[^']+'\\s*=\\s*\\{[\\s\\S]*?enableRbacAuthorization:\\s*true",
        "label": "azure-key-vault-rbac"
      },
      {
        "source": "secretRef:\\s*'[\\w-]+'",
        "label": "container-app-secret-reference"
      },
      {
        "source": "^FROM\\s+(?:oven/bun|node):[\\w.-]+",
        "flags": "m",
        "label": "dashboard-runtime-dockerfile"
      },
      {
        "source": "host:\\s*containerapp|docker:\\s*\\n[\\s\\S]*?path:\\s*apps/dashboard/Dockerfile",
        "label": "azd-containerapp-service"
      }
    ],
    "examples": [
      "resource containerApp 'Microsoft.App/containerApps@2024-03-01' = { properties: { configuration: { ingress: { external: true allowInsecure: false } } } }",
      "resource server 'Microsoft.DBforPostgreSQL/flexibleServers@2024-08-01' = { properties: { network: { publicNetworkAccess: 'Disabled' } } }",
      "secretRef: 'database-url'",
      "FROM node:24-slim AS runner",
      "host: containerapp"
    ],
    "closesSurfaceIds": [
      "azure-container-app-ingress"
    ]
  },
  {
    "version": 1,
    "slug": "azure-container-apps-migration-job",
    "description": "Manual Azure Container Apps migration job plus Drizzle migrator entrypoint and postdeploy job orchestration.",
    "noiseTier": "precise",
    "filePatterns": [
      "infra/modules/migration-job.bicep",
      "packages/db/migrate.mjs",
      "scripts/postdeploy.sh"
    ],
    "requires": {
      "tech": [
        "Azure Container Apps Jobs",
        "Drizzle"
      ],
      "sentinelFiles": [
        "infra/modules/migration-job.bicep",
        "packages/db/migrate.mjs"
      ]
    },
    "patterns": [
      {
        "source": "resource\\s+\\w+\\s+'Microsoft\\.App/jobs@[^']+'\\s*=\\s*\\{[\\s\\S]*?triggerType:\\s*'Manual'[\\s\\S]*?args:\\s*\\[[\\s\\S]*?node /app/packages/db/migrate\\.mjs",
        "label": "manual-container-apps-migration-job"
      },
      {
        "source": "DATABASE_URL[\\s\\S]{0,120}secretRef:\\s*'database-url'",
        "label": "migration-job-database-url-secret"
      },
      {
        "source": "await\\s+migrate\\(db,\\s*\\{\\s*migrationsFolder\\s*\\}\\)",
        "label": "drizzle-runtime-migrator"
      },
      {
        "source": "az\\s+containerapp\\s+job\\s+(?:registry\\s+set|update|start|execution\\s+show|logs\\s+show)\\b",
        "label": "azure-cli-containerapp-job-operation"
      }
    ],
    "examples": [
      "resource job 'Microsoft.App/jobs@2024-03-01' = { properties: { configuration: { triggerType: 'Manual' }, template: { containers: [{ args: ['node /app/packages/db/migrate.mjs'] }] } } }",
      "DATABASE_URL secretRef: 'database-url'",
      "await migrate(db, { migrationsFolder });",
      "az containerapp job start --resource-group \"$AZURE_RESOURCE_GROUP\" --name \"$MIGRATION_JOB_NAME\""
    ],
    "closesSurfaceIds": [
      "migration-job"
    ]
  },
  {
    "version": 1,
    "slug": "azd-containerapp-ops-hooks",
    "description": "azd hooks, Azure CLI operational scripts, Drizzle config, database access helpers, and lefthook commands.",
    "noiseTier": "normal",
    "filePatterns": [
      "azure.yaml",
      "scripts/*.sh",
      "packages/db/drizzle.config.ts",
      "lefthook.yml"
    ],
    "requires": {
      "tech": [
        "Azure Developer CLI",
        "Azure CLI",
        "Drizzle"
      ],
      "sentinelFiles": [
        "azure.yaml"
      ]
    },
    "patterns": [
      {
        "source": "^\\s*(?:predeploy|postdeploy):\\s*$",
        "flags": "m",
        "label": "azd-deploy-hook"
      },
      {
        "source": "run:\\s*\\.\\/scripts\\/(?:predeploy|postdeploy)\\.sh",
        "label": "azd-hook-script"
      },
      {
        "source": "az\\s+containerapp\\s+(?:registry\\s+set|job\\s+(?:registry\\s+set|update|start|execution\\s+show|logs\\s+show))\\b",
        "label": "azure-cli-containerapp-ops"
      },
      {
        "source": "az\\s+vm\\s+(?:start|deallocate|get-instance-view)\\b",
        "label": "azure-cli-access-vm-ops"
      },
      {
        "source": "az\\s+account\\s+get-access-token\\s+--resource-type\\s+oss-rdbms",
        "label": "azure-postgres-entra-token-helper"
      },
      {
        "source": "az\\s+keyvault\\s+secret\\s+show[\\s\\S]*?--name\\s+postgres-admin-password",
        "label": "azure-keyvault-db-password-helper"
      },
      {
        "source": "defineConfig\\(\\{[\\s\\S]*?dialect:\\s*[\"']postgresql[\"'][\\s\\S]*?DATABASE_URL",
        "label": "drizzle-postgres-cli-config"
      },
      {
        "source": "run:\\s*bun\\s+ox(?:lint|fmt)\\s+",
        "label": "lefthook-bun-quality-command"
      }
    ],
    "examples": [
      "postdeploy:",
      "run: ./scripts/postdeploy.sh",
      "az containerapp registry set --resource-group \"$AZURE_RESOURCE_GROUP\" --name \"$SERVICE_DASHBOARD_NAME\"",
      "az account get-access-token --resource-type oss-rdbms --query accessToken -o tsv",
      "export default defineConfig({ dialect: 'postgresql', dbCredentials: { url: process.env.DATABASE_URL || '' } });"
    ],
    "closesSurfaceIds": [
      "ops-cli-and-ci"
    ]
  },
  {
    "version": 1,
    "slug": "github-azure-containerapp-workflow",
    "description": "GitHub Actions deployment workflow that authenticates to Azure with OIDC, builds the dashboard Docker image, updates Container Apps, and runs migrations.",
    "noiseTier": "precise",
    "filePatterns": [
      ".github/workflows/*.yml",
      ".github/workflows/*.yaml"
    ],
    "requires": {
      "tech": [
        "GitHub Actions",
        "Azure Container Apps",
        "Docker"
      ],
      "sentinelFiles": [
        ".github/workflows/deploy.yml"
      ]
    },
    "patterns": [
      {
        "source": "permissions:\\s*[\\s\\S]*?id-token:\\s*write[\\s\\S]*?uses:\\s*azure/login@v\\d+",
        "label": "github-actions-azure-oidc-login"
      },
      {
        "source": "uses:\\s*docker/build-push-action@v\\d+[\\s\\S]*?file:\\s*apps/dashboard/Dockerfile",
        "label": "github-actions-dashboard-docker-build"
      },
      {
        "source": "az\\s+containerapp\\s+update\\b[\\s\\S]*?--image\\s+",
        "label": "github-actions-containerapp-rollout"
      },
      {
        "source": "run:\\s*\\.\\/scripts/postdeploy\\.sh",
        "label": "github-actions-run-migrations-script"
      }
    ],
    "examples": [
      "permissions:\n  id-token: write\nsteps:\n  - uses: azure/login@v2",
      "uses: docker/build-push-action@v6\nwith:\n  file: apps/dashboard/Dockerfile",
      "az containerapp update --resource-group \"$AZURE_RESOURCE_GROUP\" --name \"$SERVICE_DASHBOARD_NAME\" --image \"$IMAGE\"",
      "run: ./scripts/postdeploy.sh"
    ],
    "closesSurfaceIds": [
      "ops-cli-and-ci"
    ]
  },
  {
    "version": 1,
    "slug": "impeccable-agent-hook-registration",
    "description": "Checked-in Codex, Cursor, and GitHub hook JSON registrations that invoke Impeccable Node hook entrypoints after agent edits.",
    "noiseTier": "precise",
    "filePatterns": [
      ".codex/hooks.json",
      ".cursor/hooks.json",
      ".github/hooks/*.json"
    ],
    "requires": {
      "tech": [
        "Codex hooks",
        "Cursor hooks",
        "GitHub Copilot hooks"
      ],
      "sentinelFiles": [
        ".github/skills/impeccable/scripts/hook.mjs"
      ]
    },
    "patterns": [
      {
        "source": "\"hooks\"\\s*:\\s*\\{[\\s\\S]*?\"(?:PostToolUse|Stop|preToolUse|postToolUse)\"\\s*:\\s*\\[",
        "label": "agent-hook-event-registration"
      },
      {
        "source": "\"matcher\"\\s*:\\s*\"(?:Edit\\|Write\\|apply_patch|edit\\|create\\|apply_patch)\"",
        "label": "agent-hook-edit-tool-matcher"
      },
      {
        "source": "impeccable/scripts/(?:hook|hook-before-edit)\\.mjs",
        "label": "impeccable-hook-command-target"
      }
    ],
    "examples": [
      "\"PostToolUse\": [{ \"matcher\": \"Edit|Write|apply_patch\" }]",
      "\"matcher\": \"edit|create|apply_patch\"",
      "node \".github/skills/impeccable/scripts/hook.mjs\""
    ],
    "closesSurfaceIds": [
      "agent-design-hooks"
    ]
  },
  {
    "version": 1,
    "slug": "impeccable-agent-node-entrypoints",
    "description": "Impeccable Node hook and live-operation scripts that read agent hook input, emit additional context, and run local detector tooling.",
    "noiseTier": "normal",
    "filePatterns": [
      ".github/skills/impeccable/scripts/*.mjs"
    ],
    "requires": {
      "tech": [
        "Node.js",
        "Impeccable"
      ],
      "sentinelFiles": [
        ".github/hooks/impeccable.json",
        ".github/skills/impeccable/scripts/hook.mjs"
      ]
    },
    "patterns": [
      {
        "source": "^#!/usr/bin/env node",
        "flags": "m",
        "label": "node-cli-entrypoint"
      },
      {
        "source": "from\\s+['\"]\\./hook-lib\\.mjs['\"]",
        "label": "impeccable-hook-library-import"
      },
      {
        "source": "export\\s+async\\s+function\\s+\\w+Cli\\(",
        "label": "impeccable-script-cli-export"
      },
      {
        "source": "from\\s+['\"]\\./live/[^'\"]+\\.mjs['\"]",
        "label": "impeccable-live-operation-import"
      },
      {
        "source": "export\\s+async\\s+function\\s+(?:runHook|runStopHook)\\(",
        "label": "impeccable-hook-runner"
      },
      {
        "source": "hookSpecificOutput:\\s*\\{\\s*hookEventName:\\s*eventName,\\s*additionalContext:\\s*text\\s*\\}",
        "label": "agent-additional-context-output"
      },
      {
        "source": "permission:\\s*['\"](?:allow|deny)['\"]",
        "label": "pretooluse-permission-decision"
      }
    ],
    "excludeFilePatterns": [
      ".github/skills/impeccable/scripts/lib/**",
      ".github/skills/impeccable/scripts/live/**",
      ".github/skills/impeccable/scripts/detector/**"
    ],
    "examples": [
      "#!/usr/bin/env node",
      "import { runHook, runStopHook, writeAuditLog } from './hook-lib.mjs';",
      "export async function acceptCli() { }",
      "import { enterLiveRoot } from './live/roots.mjs';",
      "export async function runStopHook({ stdinJson }) { }",
      "hookSpecificOutput: { hookEventName: eventName, additionalContext: text }",
      "permission: 'deny'"
    ],
    "closesSurfaceIds": [
      "agent-design-hooks"
    ]
  },
  {
    "version": 1,
    "slug": "tanstack-start-better-auth-route-handler",
    "description": "TanStack Start file route that exposes Better Auth's catch-all GET/POST handler, plus its Better Auth Drizzle server registration.",
    "noiseTier": "precise",
    "filePatterns": [
      "apps/dashboard/src/routes/api/auth/*.ts",
      "packages/auth/src/**/*.ts",
      "packages/db/src/schema/auth.ts"
    ],
    "requires": {
      "tech": [
        "tanstack-start",
        "tanstack-router",
        "better-auth",
        "drizzle"
      ],
      "sentinelFiles": [
        "apps/dashboard/src/routes/api/auth/$.ts",
        "packages/auth/src/index.ts",
        "packages/db/src/schema/auth.ts"
      ]
    },
    "patterns": [
      {
        "source": "^\\s*export\\s+const\\s+Route\\s*=\\s*createFileRoute\\([\"']/api/auth/\\$[\"']\\)\\(\\{",
        "flags": "m",
        "label": "TanStack Start Better Auth catch-all route"
      },
      {
        "source": "^\\s*return\\s+auth\\.handler\\(request\\);?\\s*$",
        "flags": "m",
        "label": "Better Auth request handler forwarding"
      },
      {
        "source": "^\\s*return\\s+betterAuth\\(\\{",
        "flags": "m",
        "label": "Better Auth server registration"
      },
      {
        "source": "^\\s*database:\\s*drizzleAdapter\\(db,\\s*\\{",
        "flags": "m",
        "label": "Better Auth Drizzle adapter"
      },
      {
        "source": "^\\s*plugins:\\s*\\[tanstackStartCookies\\(\\)\\],?\\s*$",
        "flags": "m",
        "label": "Better Auth TanStack Start cookie plugin"
      },
      {
        "source": "^\\s*export\\s+const\\s+(?:user|session|account|verification)\\s*=\\s*pgTable\\([\"'](?:user|session|account|verification)[\"']",
        "flags": "m",
        "label": "Better Auth Drizzle table schema"
      }
    ],
    "examples": [
      "export const Route = createFileRoute(\"/api/auth/$\")({",
      "        return auth.handler(request);",
      "  return betterAuth({",
      "    database: drizzleAdapter(db, {",
      "    plugins: [tanstackStartCookies()],",
      "export const session = pgTable(\"session\", {"
    ],
    "closesSurfaceIds": [
      "better-auth-http"
    ]
  },
  {
    "version": 1,
    "slug": "tanstack-start-trpc-route-and-router",
    "description": "TanStack Start tRPC fetch route, app router map, procedure registrations, and tRPC middleware registration.",
    "noiseTier": "precise",
    "filePatterns": [
      "apps/dashboard/src/routes/api/trpc/*.ts",
      "packages/api/src/**/*.ts"
    ],
    "requires": {
      "tech": [
        "tanstack-start",
        "tanstack-router",
        "trpc"
      ],
      "sentinelFiles": [
        "apps/dashboard/src/routes/api/trpc/$.ts",
        "packages/api/src/t.ts",
        "packages/api/src/routers/index.ts"
      ]
    },
    "patterns": [
      {
        "source": "^\\s*export\\s+const\\s+Route\\s*=\\s*createFileRoute\\([\"']/api/trpc/\\$[\"']\\)\\(\\{",
        "flags": "m",
        "label": "TanStack Start tRPC catch-all route"
      },
      {
        "source": "^\\s*return\\s+fetchRequestHandler\\(\\{",
        "flags": "m",
        "label": "tRPC fetch adapter handler"
      },
      {
        "source": "^\\s*router:\\s*appRouter,\\s*$",
        "flags": "m",
        "label": "tRPC app router adapter binding"
      },
      {
        "source": "^\\s*createContext,\\s*$",
        "flags": "m",
        "label": "tRPC request context binding"
      },
      {
        "source": "^\\s*export\\s+const\\s+appRouter\\s*=\\s*router\\(\\{",
        "flags": "m",
        "label": "tRPC app router declaration"
      },
      {
        "source": "^\\s*\\w+:\\s*(?:publicProcedure|protectedProcedure)\\.(?:query|mutation|subscription)\\(",
        "flags": "m",
        "label": "tRPC procedure endpoint registration"
      },
      {
        "source": "^\\s*export\\s+const\\s+\\w+Middleware\\s*=\\s*t\\.middleware\\(",
        "flags": "m",
        "label": "tRPC middleware registration"
      },
      {
        "source": "^\\s*export\\s+const\\s+protectedProcedure\\s*=\\s*baseProcedure\\.use\\(",
        "flags": "m",
        "label": "tRPC protected procedure factory"
      }
    ],
    "examples": [
      "export const Route = createFileRoute(\"/api/trpc/$\")({",
      "  return fetchRequestHandler({",
      "    router: appRouter,",
      "    createContext,",
      "export const appRouter = router({",
      "  healthCheck: publicProcedure.query(() => {",
      "export const loggingMiddleware = t.middleware(async ({ next, path, type, ctx }) => {",
      "export const protectedProcedure = baseProcedure.use(({ ctx, next }) => {"
    ],
    "closesSurfaceIds": [
      "trpc-rpc"
    ]
  },
  {
    "version": 1,
    "slug": "azd-containerapp-dashboard-service",
    "description": "azd Container Apps service binding and dashboard container runtime wiring for the public TanStack Start app.",
    "noiseTier": "precise",
    "filePatterns": [
      "azure.yaml",
      "apps/dashboard/Dockerfile",
      "docker-compose.yml"
    ],
    "requires": {
      "tech": [
        "azd",
        "azure-container-apps",
        "docker"
      ],
      "sentinelFiles": [
        "azure.yaml",
        "apps/dashboard/Dockerfile",
        "infra/main.bicep"
      ]
    },
    "patterns": [
      {
        "source": "^\\s*host:\\s*containerapp\\s*$",
        "flags": "m",
        "label": "azd Container Apps host binding"
      },
      {
        "source": "^\\s*path:\\s*apps/dashboard/Dockerfile\\s*$",
        "flags": "m",
        "label": "azd dashboard Dockerfile binding"
      },
      {
        "source": "^EXPOSE\\s+3001\\s*$",
        "flags": "m",
        "label": "dashboard container exposed port"
      },
      {
        "source": "^CMD\\s+\\[\"node\",\\s*\"\\.output/server/index\\.mjs\"\\]\\s*$",
        "flags": "m",
        "label": "TanStack Start server runtime entrypoint"
      },
      {
        "source": "^\\s*dockerfile:\\s*apps/dashboard/Dockerfile\\s*$",
        "flags": "m",
        "label": "compose dashboard Dockerfile binding"
      },
      {
        "source": "^\\s*-\\s*[\"']3001:3001[\"']\\s*$",
        "flags": "m",
        "label": "compose dashboard port publishing"
      },
      {
        "source": "^\\s*BETTER_AUTH_URL:\\s*http://localhost:3001\\s*$",
        "flags": "m",
        "label": "local Better Auth public origin"
      }
    ],
    "examples": [
      "    host: containerapp",
      "      path: apps/dashboard/Dockerfile",
      "EXPOSE 3001",
      "CMD [\"node\", \".output/server/index.mjs\"]",
      "      dockerfile: apps/dashboard/Dockerfile",
      "      - \"3001:3001\"",
      "      BETTER_AUTH_URL: http://localhost:3001"
    ],
    "closesSurfaceIds": [
      "azure-container-app-ingress"
    ]
  },
  {
    "version": 1,
    "slug": "azure-containerapps-vnet-ingress-bicep-surface",
    "description": "Azure Container Apps Bicep resources for public HTTPS ingress, managed environment VNet wiring, and the exported Better Auth origin.",
    "noiseTier": "precise",
    "filePatterns": [
      "infra/main.bicep",
      "infra/modules/container-app.bicep",
      "infra/modules/container-apps-env.bicep",
      "infra/modules/network.bicep"
    ],
    "requires": {
      "tech": [
        "azure-bicep",
        "azure-container-apps"
      ],
      "sentinelFiles": [
        "infra/main.bicep",
        "infra/modules/container-app.bicep",
        "infra/modules/container-apps-env.bicep"
      ]
    },
    "patterns": [
      {
        "source": "^\\s*module\\s+dashboard\\s+'\\./modules/container-app\\.bicep'\\s*=\\s*\\{",
        "flags": "m",
        "label": "dashboard container app module registration"
      },
      {
        "source": "^\\s*resource\\s+containerApp\\s+'Microsoft\\.App/containerApps@2024-03-01'\\s*=\\s*\\{",
        "flags": "m",
        "label": "Azure Container Apps resource"
      },
      {
        "source": "^\\s*ingress:\\s*\\{\\s*$",
        "flags": "m",
        "label": "Container Apps ingress block"
      },
      {
        "source": "^\\s*external:\\s*true\\s*$",
        "flags": "m",
        "label": "public Container Apps ingress"
      },
      {
        "source": "^\\s*allowInsecure:\\s*false\\s*$",
        "flags": "m",
        "label": "HTTPS-only Container Apps ingress"
      },
      {
        "source": "^\\s*resource\\s+containerAppsEnvironment\\s+'Microsoft\\.App/managedEnvironments@2024-03-01'\\s*=\\s*\\{",
        "flags": "m",
        "label": "Container Apps managed environment"
      },
      {
        "source": "^\\s*vnetConfiguration:\\s*\\{\\s*$",
        "flags": "m",
        "label": "Container Apps environment VNet configuration"
      },
      {
        "source": "^\\s*internal:\\s*false\\s*$",
        "flags": "m",
        "label": "public managed environment ingress mode"
      },
      {
        "source": "^\\s*output\\s+BETTER_AUTH_URL\\s+string\\s*=\\s*dashboard\\.outputs\\.uri\\s*$",
        "flags": "m",
        "label": "Better Auth public origin output"
      },
      {
        "source": "^\\s*resource\\s+vnet\\s+'Microsoft\\.Network/virtualNetworks@2024-05-01'\\s*=\\s*\\{",
        "flags": "m",
        "label": "deployment virtual network"
      },
      {
        "source": "^\\s*serviceName:\\s*'Microsoft\\.App/environments'\\s*$",
        "flags": "m",
        "label": "Container Apps delegated subnet"
      }
    ],
    "examples": [
      "module dashboard './modules/container-app.bicep' = {",
      "resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {",
      "      ingress: {",
      "        external: true",
      "        allowInsecure: false",
      "resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2024-03-01' = {",
      "    vnetConfiguration: {",
      "      internal: false",
      "output BETTER_AUTH_URL string = dashboard.outputs.uri",
      "resource vnet 'Microsoft.Network/virtualNetworks@2024-05-01' = {",
      "                serviceName: 'Microsoft.App/environments'"
    ],
    "closesSurfaceIds": [
      "azure-container-app-ingress"
    ]
  },
  {
    "version": 1,
    "slug": "azure-containerapp-private-postgres-secrets",
    "description": "Bicep resources linking Container Apps to private Postgres through Key Vault and secret-backed runtime environment variables.",
    "noiseTier": "precise",
    "filePatterns": [
      "infra/main.bicep",
      "infra/modules/container-app.bicep",
      "infra/modules/key-vault.bicep",
      "infra/modules/migration-job.bicep",
      "infra/modules/postgres-private-endpoint.bicep",
      "infra/modules/postgres.bicep"
    ],
    "requires": {
      "tech": [
        "azure-bicep",
        "azure-container-apps",
        "azure-postgresql-flexible-server",
        "azure-key-vault"
      ],
      "sentinelFiles": [
        "infra/modules/container-app.bicep",
        "infra/modules/postgres.bicep",
        "infra/modules/postgres-private-endpoint.bicep",
        "infra/modules/key-vault.bicep"
      ]
    },
    "patterns": [
      {
        "source": "^\\s*var\\s+databaseUrl\\s*=\\s*'postgresql://\\$\\{postgresAdminLogin\\}:\\$\\{postgresAdminPassword\\}@\\$\\{postgres\\.outputs\\.fullyQualifiedDomainName\\}:5432/\\$\\{databaseName\\}\\?sslmode=require'\\s*$",
        "flags": "m",
        "label": "private Postgres connection string composition"
      },
      {
        "source": "^\\s*resource\\s+server\\s+'Microsoft\\.DBforPostgreSQL/flexibleServers@2024-08-01'\\s*=\\s*\\{",
        "flags": "m",
        "label": "Postgres Flexible Server resource"
      },
      {
        "source": "^\\s*publicNetworkAccess:\\s*'Disabled'\\s*$",
        "flags": "m",
        "label": "Postgres public access disabled"
      },
      {
        "source": "^\\s*resource\\s+privateEndpoint\\s+'Microsoft\\.Network/privateEndpoints@2024-05-01'\\s*=\\s*\\{",
        "flags": "m",
        "label": "Postgres private endpoint resource"
      },
      {
        "source": "^\\s*'postgresqlServer'\\s*$",
        "flags": "m",
        "label": "Postgres private link group"
      },
      {
        "source": "^\\s*resource\\s+databaseUrlSecret\\s+'Microsoft\\.KeyVault/vaults/secrets@2023-07-01'\\s*=\\s*\\{",
        "flags": "m",
        "label": "Key Vault database URL secret"
      },
      {
        "source": "^\\s*resource\\s+betterAuthSecretEntry\\s+'Microsoft\\.KeyVault/vaults/secrets@2023-07-01'\\s*=\\s*\\{",
        "flags": "m",
        "label": "Key Vault Better Auth secret"
      },
      {
        "source": "^\\s*secretRef:\\s*'(?:database-url|better-auth-secret)'\\s*$",
        "flags": "m",
        "label": "Container Apps secret-backed env var"
      },
      {
        "source": "^\\s*resource\\s+job\\s+'Microsoft\\.App/jobs@2024-03-01'\\s*=\\s*\\{",
        "flags": "m",
        "label": "Container Apps migration job resource"
      },
      {
        "source": "^\\s*'node /app/packages/db/migrate\\.mjs'\\s*$",
        "flags": "m",
        "label": "Container Apps migration command"
      }
    ],
    "examples": [
      "var databaseUrl = 'postgresql://${postgresAdminLogin}:${postgresAdminPassword}@${postgres.outputs.fullyQualifiedDomainName}:5432/${databaseName}?sslmode=require'",
      "resource server 'Microsoft.DBforPostgreSQL/flexibleServers@2024-08-01' = {",
      "      publicNetworkAccess: 'Disabled'",
      "resource privateEndpoint 'Microsoft.Network/privateEndpoints@2024-05-01' = {",
      "            'postgresqlServer'",
      "resource databaseUrlSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {",
      "resource betterAuthSecretEntry 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {",
      "              secretRef: 'database-url'",
      "              secretRef: 'better-auth-secret'",
      "resource job 'Microsoft.App/jobs@2024-03-01' = {",
      "            'node /app/packages/db/migrate.mjs'"
    ],
    "closesSurfaceIds": [
      "azure-container-app-ingress"
    ]
  },
  {
    "version": 1,
    "slug": "azure-containerapp-supporting-identities-bicep",
    "description": "Supporting Bicep registrations for Container Apps managed identity pulls, GitHub OIDC deployment identity, Key Vault secret roles, and private access VM routing.",
    "noiseTier": "precise",
    "filePatterns": [
      "infra/modules/access-vm.bicep",
      "infra/modules/acr-pull-role.bicep",
      "infra/modules/container-registry.bicep",
      "infra/modules/github-identity.bicep",
      "infra/modules/github-roles.bicep",
      "infra/modules/key-vault-role.bicep",
      "infra/modules/monitoring.bicep"
    ],
    "requires": {
      "tech": [
        "azure-bicep",
        "azure-container-apps",
        "azure-managed-identity"
      ],
      "sentinelFiles": [
        "infra/modules/acr-pull-role.bicep",
        "infra/modules/github-identity.bicep",
        "infra/modules/access-vm.bicep"
      ]
    },
    "patterns": [
      {
        "source": "^\\s*var\\s+acrPullRoleDefinitionId\\s*=\\s*'7f951dda-4ed3-4680-a7ca-43fe172d538d'\\s*$",
        "flags": "m",
        "label": "AcrPull role definition binding"
      },
      {
        "source": "^\\s*resource\\s+acrPull\\s+'Microsoft\\.Authorization/roleAssignments@2022-04-01'\\s*=\\s*\\{",
        "flags": "m",
        "label": "ACR pull role assignment"
      },
      {
        "source": "^\\s*resource\\s+registry\\s+'Microsoft\\.ContainerRegistry/registries@2023-11-01-preview'\\s*=\\s*\\{",
        "flags": "m",
        "label": "Azure Container Registry resource"
      },
      {
        "source": "^\\s*adminUserEnabled:\\s*false\\s*$",
        "flags": "m",
        "label": "ACR admin user disabled"
      },
      {
        "source": "^\\s*anonymousPullEnabled:\\s*false\\s*$",
        "flags": "m",
        "label": "ACR anonymous pulls disabled"
      },
      {
        "source": "^\\s*resource\\s+identity\\s+'Microsoft\\.ManagedIdentity/userAssignedIdentities@2023-01-31'\\s*=\\s*\\{",
        "flags": "m",
        "label": "GitHub deployment managed identity"
      },
      {
        "source": "^\\s*resource\\s+federatedCredentials\\s+'Microsoft\\.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials@2023-01-31'\\s*=\\s*\\[",
        "flags": "m",
        "label": "GitHub OIDC federated credential"
      },
      {
        "source": "^\\s*issuer:\\s*'https://token\\.actions\\.githubusercontent\\.com'\\s*$",
        "flags": "m",
        "label": "GitHub Actions OIDC issuer"
      },
      {
        "source": "^\\s*resource\\s+containerApp\\s+'Microsoft\\.App/containerApps@2024-03-01'\\s+existing\\s*=\\s*\\{",
        "flags": "m",
        "label": "existing Container App role scope"
      },
      {
        "source": "^\\s*resource\\s+appSecretsUser\\s+'Microsoft\\.Authorization/roleAssignments@2022-04-01'\\s*=\\s*\\{",
        "flags": "m",
        "label": "Container App Key Vault secrets user role"
      },
      {
        "source": "^\\s*var\\s+secretsUserRoleDefinitionId\\s*=\\s*'4633458b-17de-408a-b874-0445c86b69e6'\\s*$",
        "flags": "m",
        "label": "Key Vault Secrets User role definition"
      },
      {
        "source": "^\\s*resource\\s+nsg\\s+'Microsoft\\.Network/networkSecurityGroups@2024-05-01'\\s*=\\s*\\{",
        "flags": "m",
        "label": "access VM network security group"
      },
      {
        "source": "^\\s*name:\\s*'deny-all-inbound'\\s*$",
        "flags": "m",
        "label": "access VM deny-all inbound rule"
      },
      {
        "source": "^\\s*enableIPForwarding:\\s*true\\s*$",
        "flags": "m",
        "label": "access VM subnet routing"
      },
      {
        "source": "^\\s*-\\s*tailscale\\s+up\\s+--authkey=TAILSCALE_AUTH_KEY\\s+--advertise-routes=ADVERTISED_ROUTES,168\\.63\\.129\\.16/32\\s+--accept-dns=false\\s+--ssh\\s+--hostname=TAILSCALE_HOSTNAME\\s*$",
        "flags": "m",
        "label": "Tailscale private database route advertisement"
      },
      {
        "source": "^\\s*resource\\s+applicationInsights\\s+'Microsoft\\.Insights/components@2020-02-02'\\s*=\\s*\\{",
        "flags": "m",
        "label": "Application Insights web component"
      }
    ],
    "examples": [
      "var acrPullRoleDefinitionId = '7f951dda-4ed3-4680-a7ca-43fe172d538d'",
      "resource acrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {",
      "resource registry 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {",
      "    adminUserEnabled: false",
      "    anonymousPullEnabled: false",
      "resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {",
      "resource federatedCredentials 'Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials@2023-01-31' = [",
      "        issuer: 'https://token.actions.githubusercontent.com'",
      "resource containerApp 'Microsoft.App/containerApps@2024-03-01' existing = {",
      "resource appSecretsUser 'Microsoft.Authorization/roleAssignments@2022-04-01' = {",
      "var secretsUserRoleDefinitionId = '4633458b-17de-408a-b874-0445c86b69e6'",
      "resource nsg 'Microsoft.Network/networkSecurityGroups@2024-05-01' = {",
      "          name: 'deny-all-inbound'",
      "      enableIPForwarding: true",
      "  - tailscale up --authkey=TAILSCALE_AUTH_KEY --advertise-routes=ADVERTISED_ROUTES,168.63.129.16/32 --accept-dns=false --ssh --hostname=TAILSCALE_HOSTNAME",
      "resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {"
    ],
    "closesSurfaceIds": [
      "azure-container-app-ingress"
    ]
  }
];

export const generatedMatchersPlugin: DeepsecPlugin = {
  name: "deepsec-generated-matchers",
  matchers: compileDeclarativeMatchers(specs),
};
