// import '../frontend/styles/globals.css';
import type { AppProps } from "next/app";
import { ChakraProvider, Spinner, Center } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // Keep commented out or remove if not used
import { theme } from "frontend/styles/theme";
// import { system } from '../frontend/styles/theme'; // Remove unused import
import AppLayout from "frontend/components/layout/app-layout";
// import { Navbar } from "frontend/components/common/navbar"; // Removed @/ alias
// import { Footer } from "frontend/components/common/footer"; // Removed @/ alias
import { useAuthStore, initializeAuthState } from "frontend/store/auth-store"; // Removed @/ alias
import { useEffect } from "react";
import { useRouter } from "next/router";
import { Toaster } from "components/ui/toaster";
const queryClient = new QueryClient();

// Public paths are still relevant for redirection logic
const publicPaths = ["/login", "/signup"]; // '/' might not be strictly public if we redirect from it when auth

function MyApp({ Component, pageProps }: AppProps) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Initialize auth state once on app load
    initializeAuthState();
  }, []);

  useEffect(() => {
    if (isLoading) return; // Don't do anything while auth state is loading

    const currentPath = router.pathname;

    // If authenticated
    if (isAuthenticated) {
      // If on a public path (login/signup), redirect to appropriate dashboard
      if (publicPaths.includes(currentPath) || currentPath === "/") {
        console.log(
          `Authenticated: Redirecting from ${currentPath} based on role: ${user?.role}`,
        );
        if (user?.role === "sponsor") router.push("/sponsor/dashboard");
        else if (user?.role === "vendor") router.push("/vendor/dashboard");
        else router.push("/sponsor/dashboard"); // Default dashboard if role unknown
      }
      // Else, user is authenticated and on a protected page (or a page not in publicPaths like a dashboard) - do nothing
    }
    // If not authenticated
    else {
      // If on a protected page (not login, not signup, not homepage), redirect to login
      if (!publicPaths.includes(currentPath) && currentPath !== "/") {
        console.log(
          `Not Authenticated: Redirecting from ${currentPath} to /login`,
        );
        router.push("/login");
      }
      // Else, user is not authenticated but on a public page (login, signup, or /) - do nothing
    }
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading) {
    return (
      <ChakraProvider value={theme}>
        <Center h="100vh">
          <Spinner size="xl" />
        </Center>
      </ChakraProvider>
    );
  }

  // Always use AppLayout for all pages
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={theme}>
        <Toaster />
        <AppLayout>
          <Component {...pageProps} />
        </AppLayout>
      </ChakraProvider>
    </QueryClientProvider>
  );
}

export default MyApp;
