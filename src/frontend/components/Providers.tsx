"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { ChakraProvider } from "@chakra-ui/react";
import { theme } from '@/frontend/styles/theme';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base } from 'viem/chains';

import { config } from "../../common/lib/wagmi";

export function Providers(props: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          projectId={process.env.NEXT_PUBLIC_CDP_PROJECT_ID}
          chain={base}
        >
          <ChakraProvider theme={theme}>
            {props.children}
          </ChakraProvider>
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 