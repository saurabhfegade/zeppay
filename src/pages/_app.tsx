import type { AppProps } from 'next/app';
import { Providers } from '@/frontend/components/Providers'; // Assuming this wraps Chakra, Query, and Wagmi
import AppLayout from '@/frontend/components/layout/app-layout';

// If QueryClient is created and managed within Providers, remove it from here.
// Otherwise, if Providers expects queryClient as a prop, adjust accordingly.

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Providers> {/* This should now include WagmiProvider, ChakraProvider, and QueryClientProvider */}
      <AppLayout>
        <Component {...pageProps} />
      </AppLayout>
    </Providers>
  );
}

export default MyApp; 