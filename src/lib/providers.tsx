"use client";

import { LogtoProvider, type LogtoConfig } from "@logto/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { queryClient } from "./queryClient";

const logtoConfig: LogtoConfig = {
  endpoint: import.meta.env.VITE_LOGTO_ENDPOINT,
  appId: import.meta.env.VITE_LOGTO_APP_ID,
  resources: [import.meta.env.VITE_API_URL ?? (typeof window !== "undefined" ? window.location.origin + "/api" : "http://localhost/api")],
};

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LogtoProvider config={logtoConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </LogtoProvider>
  );
}
