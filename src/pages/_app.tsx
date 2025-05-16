import { ChakraProvider } from '@chakra-ui/react';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { theme } from '@/frontend/styles/theme'; // Changed import from system to theme
import AppLayout from '@/frontend/components/layout/app-layout'; // Import AppLayout

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global default query options can go here
      // staleTime: 1 * 60 * 1000, // 1 minute
    },
  },
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <AppLayout>
          <Component {...pageProps} />
        </AppLayout>
      </ChakraProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default MyApp; 