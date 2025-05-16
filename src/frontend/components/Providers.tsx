"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";

import { config } from "../../common/lib/wagmi";
import { ChakraProvider } from "@chakra-ui/react";
import { theme } from '@/frontend/styles/theme';
export function Providers(props: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider theme={theme}>
          {props.children}
        </ChakraProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 