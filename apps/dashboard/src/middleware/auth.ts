import { auth } from "@sycom-learn/auth";
import { createMiddleware } from "@tanstack/react-start";

export const sessionMiddleware = createMiddleware().server(async ({ next, request }) => {
  const result = await auth.api.getSession({
    headers: request.headers,
  });

  return next({
    context: {
      session: result?.session ?? null,
      user: result?.user ?? null,
    },
  });
});
