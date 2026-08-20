import { useSuspenseQuery } from "@tanstack/react-query";

import type { SessionData } from "@/functions/get-session";
import { sessionQueryOptions } from "@/lib/auth/session";

/**
 * Session for the signed-in half of the app. The `/dashboard` route loads the
 * session in `beforeLoad` and bounces anonymous visitors, so by the time any
 * component calls this the cache is warm and non-null.
 */
export function useUser(): SessionData {
  const { data } = useSuspenseQuery(sessionQueryOptions());

  if (!data) {
    throw new Error("useUser must be used inside an authenticated route");
  }

  return data;
}
