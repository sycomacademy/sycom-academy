import type { Database } from "@sycom-learn/db";
import type { ActivityEvent, NewActivity } from "@sycom-learn/db/schema/activity";
import type { BetterAuthPlugin } from "better-auth";
import { createAuthMiddleware, getSessionFromCtx } from "better-auth/api";

import {
  didFail,
  failureReason,
  isSignInPath,
  resolveIp,
  resolveProvider,
  resolveUserAgent,
  sessionDeletionEvent,
  type EventContext,
} from "./events";
import {
  activityLogger as log,
  createDatabaseSink,
  createRecorder,
  type ActivitySink,
} from "./sink";

export type ActivityLogOptions = {
  /** The same handle `createAuth()` already builds. */
  db: Database;
  /** Defaults to true. Set false to disable capture without unregistering the plugin. */
  enabled?: boolean;
  /** Override the destination. Useful for tests. */
  sink?: ActivitySink;
};

type Row = Record<string, unknown>;

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** Endpoints whose actor comes from the caller's own session. */
const SESSION_SCOPED_EVENTS: Record<string, ActivityEvent> = {
  "/change-password": "user.password_changed",
  "/change-email": "user.email_change_requested",
  "/unlink-account": "account.unlinked",
};

/**
 * Which event, if any, a write to the user row deserves.
 *
 * `/verify-email` is captured here rather than in an after-hook because that
 * endpoint answers a link click: with a `callbackURL` it ends in
 * `throw ctx.redirect(...)`, so the response carries no body to read the user
 * out of. The update hook sees the row itself either way. Better Auth's
 * change-email flow reaches the same endpoint and sets `emailVerified: false`
 * on its legacy branch, hence the explicit true check.
 */
function userUpdateEvent(path: string | undefined, user: Row): ActivityEvent | null {
  if (path === "/update-user") return "user.updated";
  if (path === "/verify-email" && user.emailVerified === true) return "user.email_verified";
  return null;
}

/**
 * Records auth activity to our own `activity` table.
 *
 * Two capture mechanisms, deliberately split:
 *   - `init()`-contributed database hooks for anything that writes a row
 *     (session created/deleted, user created/updated/deleted, account linked).
 *     These fire post-commit and carry the record itself.
 *   - `hooks.after` path matchers for request-level events with no database
 *     write of their own (sign-in success and failure, password change,
 *     email verification).
 *
 * Every handler is wrapped in try/catch and returns undefined. Better Auth's
 * `runAfterHooks` has no try/catch of its own: a thrown `APIError` would replace
 * the endpoint's response and any other throw escapes dispatch entirely, so an
 * audit write must never be allowed to surface. Matchers are kept total for the
 * same reason — after-hook matchers are not guarded either.
 */
export function activityLog(options: ActivityLogOptions) {
  const enabled = options.enabled ?? true;
  const record = createRecorder(options.sink ?? createDatabaseSink(options.db));

  /** Never throws. Wraps every hook body. */
  function safely(event: string, fn: () => void | Promise<void>): Promise<void> {
    return Promise.resolve()
      .then(fn)
      .catch((error: unknown) => {
        log.error("Activity hook failed", { event, error });
      });
  }

  function baseRow(ctx: EventContext | null): Partial<NewActivity> {
    if (!ctx) return {};
    return {
      ipAddress: resolveIp(ctx),
      userAgent: resolveUserAgent(ctx),
    };
  }

  return {
    id: "activity-log",

    init() {
      if (!enabled) return;
      return {
        options: {
          databaseHooks: {
            user: {
              create: {
                after: async (user: Row, context) => {
                  await safely("user.signed_up", () => {
                    record(context, {
                      ...baseRow(context as EventContext | null),
                      event: "user.signed_up",
                      actorId: str(user.id),
                      actorName: str(user.name),
                      actorEmail: str(user.email),
                      metadata: {
                        provider: resolveProvider(context as EventContext) ?? undefined,
                      },
                    });
                  });
                },
              },
              update: {
                after: async (user: Row, context) => {
                  // Fires for every internal write to the user row, other
                  // plugins included, so it is narrowed to the paths worth a row.
                  const event = userUpdateEvent(context?.path, user);
                  if (!event) return;
                  await safely(event, () => {
                    record(context, {
                      ...baseRow(context as EventContext | null),
                      event,
                      actorId: str(user.id),
                      actorName: str(user.name),
                      actorEmail: str(user.email),
                    });
                  });
                },
              },
              delete: {
                after: async (user: Row, context) => {
                  // The FK nulls `actorId` on delete, so the snapshot here is
                  // the only thing keeping this row readable.
                  await safely("user.deleted", () => {
                    record(context, {
                      ...baseRow(context as EventContext | null),
                      event: "user.deleted",
                      actorId: null,
                      actorName: str(user.name),
                      actorEmail: str(user.email),
                      metadata: { userId: str(user.id) ?? undefined },
                    });
                  });
                },
              },
            },
            session: {
              create: {
                after: async (session: Row, context) => {
                  await safely("session.created", () => {
                    record(context, {
                      event: "session.created",
                      actorId: str(session.userId),
                      sessionId: str(session.id),
                      // Better Auth already resolved these onto the row.
                      ipAddress: str(session.ipAddress) ?? resolveIp(context as EventContext),
                      userAgent:
                        str(session.userAgent) ?? resolveUserAgent(context as EventContext),
                      metadata: {
                        provider: resolveProvider(context as EventContext) ?? undefined,
                      },
                    });
                  });
                },
              },
              delete: {
                after: async (session: Row, context) => {
                  // Also fires for expiry cleanup, where there is no request
                  // context and no event worth recording.
                  const event = sessionDeletionEvent(context?.path);
                  if (!event) return;
                  await safely(event, () => {
                    record(context, {
                      ...baseRow(context as EventContext | null),
                      event,
                      actorId: str(session.userId),
                      sessionId: str(session.id),
                      metadata: { path: context?.path ?? undefined },
                    });
                  });
                },
              },
            },
            account: {
              create: {
                after: async (account: Row, context) => {
                  // A credential account is created as part of email sign-up
                  // and is not a "link" worth its own row.
                  if (str(account.providerId) === "credential") return;
                  await safely("account.linked", () => {
                    record(context, {
                      ...baseRow(context as EventContext | null),
                      event: "account.linked",
                      actorId: str(account.userId),
                      metadata: {
                        provider: str(account.providerId) ?? undefined,
                      },
                    });
                  });
                },
              },
            },
          },
        },
      };
    },

    hooks: {
      after: enabled
        ? [
            {
              // Sign-in outcomes. `/sign-in/social` normally only returns a
              // redirect URL, so a row is written only when a session actually
              // came out the other side.
              matcher: (context) => isSignInPath(context.path),
              handler: createAuthMiddleware(async (raw) => {
                const ctx = raw as unknown as EventContext;
                await safely("user.signed_in", () => {
                  const provider = resolveProvider(ctx) ?? undefined;

                  if (didFail(ctx)) {
                    const email = (ctx.body as { email?: unknown } | undefined)?.email;
                    record(raw, {
                      ...baseRow(ctx),
                      event: "user.sign_in_failed",
                      actorEmail: str(email),
                      metadata: { provider, reason: failureReason(ctx) ?? undefined },
                    });
                    return;
                  }

                  const session = ctx.context.newSession;
                  if (!session) return;
                  record(raw, {
                    ...baseRow(ctx),
                    event: "user.signed_in",
                    actorId: str(session.user.id),
                    actorName: str(session.user.name),
                    actorEmail: str(session.user.email),
                    sessionId: str(session.session.id),
                    metadata: { provider },
                  });
                });
              }),
            },
            {
              // Endpoints whose actor is the caller.
              matcher: (context) =>
                typeof context.path === "string" && context.path in SESSION_SCOPED_EVENTS,
              handler: createAuthMiddleware(async (raw) => {
                const ctx = raw as unknown as EventContext;
                const event = SESSION_SCOPED_EVENTS[ctx.path as string];
                if (!event) return;
                await safely(event, async () => {
                  if (didFail(ctx)) return;
                  const session = await getSessionFromCtx(raw).catch(() => null);
                  record(raw, {
                    ...baseRow(ctx),
                    event,
                    actorId: str(session?.user?.id),
                    actorName: str(session?.user?.name),
                    actorEmail: str(session?.user?.email),
                    sessionId: str(session?.session?.id),
                  });
                });
              }),
            },
            {
              matcher: (context) => context.path === "/request-password-reset",
              handler: createAuthMiddleware(async (raw) => {
                const ctx = raw as unknown as EventContext;
                await safely("user.password_reset_requested", () => {
                  // Always recorded, including for an unknown address: a burst
                  // of these is the signal worth keeping.
                  const email = (ctx.body as { email?: unknown } | undefined)?.email;
                  record(raw, {
                    ...baseRow(ctx),
                    event: "user.password_reset_requested",
                    actorEmail: str(email),
                  });
                });
              }),
            },
            {
              // Exactly the POST that sets the new password. `/reset-password/:token`
              // is the GET a link click lands on: it only checks the token and
              // redirects to the form, so it is not a password reset.
              matcher: (context) => context.path === "/reset-password",
              handler: createAuthMiddleware(async (raw) => {
                const ctx = raw as unknown as EventContext;
                await safely("user.password_reset", () => {
                  if (didFail(ctx)) return;
                  // The endpoint returns `{ status: true }` and resolves the
                  // user from a verification value it does not expose, so the
                  // actor is not recoverable here in better-auth 1.6.27.
                  record(raw, {
                    ...baseRow(ctx),
                    event: "user.password_reset",
                  });
                });
              }),
            },
          ]
        : [],
    },
  } satisfies BetterAuthPlugin;
}
