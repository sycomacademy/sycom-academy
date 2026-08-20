import { queryOptions } from "@tanstack/react-query";

import { getSession } from "@/functions/get-session";

export const SESSION_QUERY_KEY = ["session"] as const;

export const sessionQueryOptions = () =>
  queryOptions({
    queryKey: SESSION_QUERY_KEY,
    queryFn: () => getSession(),
  });
