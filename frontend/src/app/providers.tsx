"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { useState } from "react";

import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 phút
            retry: 1,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <AntdRegistry>{children}</AntdRegistry>
        <Toaster
          richColors
          position="top-right"
          closeButton
          toastOptions={{
            actionButtonStyle: { backgroundColor: "#2563eb", color: "#ffffff", borderRadius: "8px", fontSize: "13px", fontWeight: 600 },
          }}
        />
      </QueryClientProvider>
    </SessionProvider>
  );
}
