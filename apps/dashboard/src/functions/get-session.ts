import { createServerFn } from "@tanstack/react-start";

import { sessionMiddleware } from "@/middleware/auth";

export const getSession = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(({ context }) =>
    context.session && context.user ? { session: context.session, user: context.user } : null,
  );

export type SessionData = NonNullable<Awaited<ReturnType<typeof getSession>>>;
