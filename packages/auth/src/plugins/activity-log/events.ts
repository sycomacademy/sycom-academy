import type { ActivityEvent } from "@sycom-learn/db/schema/activity";
import { getIp, isAPIError } from "better-auth/api";
import type { BetterAuthOptions } from "better-auth";

/**
 * Anything an after-hook or a database hook can hand us. Better Auth types the
 * hook context as almost entirely `Partial`, so every field is read defensively.
 */
export type EventContext = {
  path?: string;
  params?: Record<string, string | undefined>;
  body?: unknown;
  headers?: Headers;
  request?: Request;
  context: {
    returned?: unknown;
    options: BetterAuthOptions;
    newSession?: { session: Record<string, unknown>; user: Record<string, unknown> } | null;
  };
};

/**
 * Copied from `better-auth/dist/utils/plugin-helper.mjs`. Better Auth uses this
 * internally but does not export it, so the ~10 lines live here instead.
 */
export async function getEndpointResponse<T>(ctx: EventContext): Promise<T | null> {
  const returned = ctx.context.returned;
  if (!returned) return null;
  if (returned instanceof Response) {
    if (returned.status !== 200) return null;
    return (await returned.clone().json()) as T;
  }
  if (isAPIError(returned)) return null;
  return returned as T;
}

/** Whether the endpoint this hook is observing failed. */
export function didFail(ctx: EventContext): boolean {
  const returned = ctx.context.returned;
  if (isAPIError(returned)) return true;
  if (returned instanceof Response) return returned.status !== 200;
  return false;
}

/** The failure message, for the metadata column of a failed-attempt row. */
export function failureReason(ctx: EventContext): string | null {
  const returned = ctx.context.returned;
  if (!isAPIError(returned)) return null;
  return returned.message ?? returned.status ?? null;
}

const SIGN_IN_PATHS = new Set(["/sign-in/email", "/sign-in/social", "/sign-in/passkey"]);

/**
 * Paths that can produce a session. `/sign-in/social` normally only returns a
 * redirect URL, but the id-token flow signs in directly, so it is matched here
 * and filtered on `newSession` at write time.
 */
export function isSignInPath(path: string | undefined): boolean {
  if (!path) return false;
  return (
    SIGN_IN_PATHS.has(path) || path.startsWith("/callback/") || path.startsWith("/oauth2/callback/")
  );
}

/** Adapted from better-auth's own `last-login-method` resolver. */
export function resolveProvider(ctx: EventContext | null | undefined): string | null {
  const path = ctx?.path;
  if (!path) return null;
  if (path.startsWith("/callback/") || path.startsWith("/oauth2/callback/")) {
    return ctx?.params?.id ?? ctx?.params?.providerId ?? path.split("/").pop() ?? null;
  }
  if (path === "/sign-in/email" || path === "/sign-up/email") return "email";
  if (path === "/sign-in/passkey") return "passkey";
  if (path === "/sign-in/social") {
    const provider = (ctx?.body as { provider?: unknown } | undefined)?.provider;
    return typeof provider === "string" ? provider : "social";
  }
  return null;
}

/**
 * Better Auth's own IP resolution, so the value matches what it stores on the
 * session row. Returns null behind a proxy unless `advanced.ipAddress` is
 * configured — see the `trustedProxies` note in `createAuth`.
 */
export function resolveIp(ctx: EventContext | null | undefined): string | null {
  const source = ctx?.headers ?? ctx?.request;
  if (!source || !ctx) return null;
  return getIp(source, ctx.context.options);
}

export function resolveUserAgent(ctx: EventContext | null | undefined): string | null {
  return ctx?.headers?.get("user-agent") ?? ctx?.request?.headers.get("user-agent") ?? null;
}

/** Which sign-out-ish endpoint deleted a session, if any. */
export function sessionDeletionEvent(path: string | undefined): ActivityEvent | null {
  if (!path) return null;
  if (path === "/sign-out") return "user.signed_out";
  if (
    path === "/revoke-session" ||
    path === "/revoke-sessions" ||
    path === "/revoke-other-sessions" ||
    path === "/admin/revoke-user-session" ||
    path === "/admin/revoke-user-sessions"
  ) {
    return "session.revoked";
  }
  // Deliberately a whitelist, not a fallthrough: expiry cleanup, the cascading
  // deletes during /delete-user, and revokeOtherSessions-on-sign-in all reach
  // this hook and none of them deserve a row.
  return null;
}
