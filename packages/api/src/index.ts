import { env } from "@sycom-learn/env/server";
import { TRPCError } from "@trpc/server";

import { loggingMiddleware } from "./middleware/logging";
import { t } from "./t";

export { t };
export const router = t.router;

const baseProcedure = env.DEBUG_PERFORMANCE ? t.procedure.use(loggingMiddleware) : t.procedure;

export const publicProcedure = baseProcedure;

export const protectedProcedure = baseProcedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: "No session",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});
