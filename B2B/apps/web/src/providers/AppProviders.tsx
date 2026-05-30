import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

import { attemptRefresh } from "../api/session";
import { CartProvider } from "../contexts/CartContext";

const AuthReadyContext = createContext(false);

export function useAuthReady(): boolean {
  return useContext(AuthReadyContext);
}

export function AppProviders({ children }: { children: ReactNode }): ReactElement {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
    []
  );

  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    void attemptRefresh().finally(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    void import("virtual:pwa-register").then(({ registerSW }) => {
      registerSW({ immediate: true });
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <AuthReadyContext.Provider value={authReady}>{children}</AuthReadyContext.Provider>
      </CartProvider>
    </QueryClientProvider>
  );
}
