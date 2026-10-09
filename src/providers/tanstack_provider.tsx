import { QueryClientProvider } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

type TanstackProviderProps = {
  children: ReactNode;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch just because the tab got focus again
      refetchOnWindowFocus: false,
      // One more try before a query fails; a hook's own `retry` still wins
      retry: 1,
    },
  },
});

export const TanstackProvider = ({ children }: TanstackProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
