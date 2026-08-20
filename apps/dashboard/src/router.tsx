import type { AppRouter } from "@sycom-learn/api/routers/index";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toastManager } from "@sycom-learn/ui/components/toast";

import Loader from "./components/loader";
import { routeTree } from "./routeTree.gen";
import { TRPCProvider } from "./lib/trpc/trpc";

function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        toastManager.add({
          id: `query-error:${query.queryHash}`,
          title: error.message,
          type: "error",
          actionProps: {
            children: "Retry",
            onClick: () => {
              void query.invalidate();
            },
          },
        });
      },
    }),
    defaultOptions: { queries: { staleTime: 3 * 60 * 1000 } },
  });
}

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    }),
  ],
});

export const getRouter = () => {
  const queryClient = createQueryClient();
  const trpc = createTRPCOptionsProxy({
    client: trpcClient,
    queryClient,
  });

  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    context: { trpc, queryClient },
    defaultPendingComponent: () => <Loader />,
    defaultNotFoundComponent: () => <div>Not Found</div>,
    Wrap: ({ children }) => (
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    ),
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  return router;
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
