import React, { ReactNode, useEffect, useMemo, useState } from "react";
import {
  Box,
  Flex,
  Button,
  Container,
  Spinner,
  Text,
  HStack,
} from "@chakra-ui/react";
import { useGetMeQuery } from "../../hooks/queries/use-get-me-query";
import { useLogoutMutation } from "../../hooks/mutations/use-logout-mutation";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabase-client";
import { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { ROUTES } from "../../../common/constants/routes";
import { Navbar } from "./navbar";
import { useAuthStore, User as AppUser } from "../../store/auth-store";
import { useGetVendorWalletStatusQuery } from "@/frontend/hooks/queries/use-get-vendor-wallet-status-query";
import { useVendorSetupStore } from "@/frontend/store/vendor-setup-store";
import { SmartWalletSetupModal } from "@/frontend/components/vendor/smart-wallet-setup-modal";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const router = useRouter();
  const [supabaseSession, setSupabaseSession] = useState<Session | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const storeSetUser = useAuthStore((state) => state.setUser);
  const storeLogout = useAuthStore((state) => state.logout);
  const storeSetIsLoading = useAuthStore((state) => state.setIsLoading);
  const appUser = useAuthStore((state) => state.user);

  const hasVendorWallet = useVendorSetupStore((state) => state.hasWallet);
  const isCheckingVendorWalletStatus = useVendorSetupStore(
    (state) => state.isCheckingWalletStatus,
  );

  useEffect(() => {
    storeSetIsLoading(loadingAuth);
  }, [loadingAuth, storeSetIsLoading]);

  const {
    data: userProfileData,
    isLoading: isLoadingUser,
    isError: isErrorUser,
    error: getMeError,
  } = useGetMeQuery({ enabled: !!supabaseSession?.access_token });

  // Memoize the options for useGetVendorWalletStatusQuery
  const vendorWalletStatusQueryOptions = useMemo(
    () => ({
      enabled:
        appUser?.role === "vendor" &&
        !!appUser &&
        !!supabaseSession?.access_token,
    }),
    [appUser, supabaseSession],
  );

  useGetVendorWalletStatusQuery(vendorWalletStatusQueryOptions);

  useEffect(() => {
    if (userProfileData && supabaseSession?.user) {
      const combinedUser: AppUser = {
        ...supabaseSession.user,
        ...userProfileData,
      };
      storeSetUser(combinedUser, supabaseSession.access_token);
    } else if (!isLoadingUser && supabaseSession && isErrorUser) {
      storeLogout();
    }
  }, [
    userProfileData,
    supabaseSession,
    isLoadingUser,
    isErrorUser,
    storeSetUser,
    storeLogout,
    getMeError,
  ]);

  const logoutMutation = useLogoutMutation();

  useEffect(() => {
    storeSetIsLoading(true);

    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error("AppLayout: Error in getSession():", error);
          setSupabaseSession(null);
          storeLogout();
        } else {
          setSupabaseSession(session);
          if (!session) {
            storeLogout();
          }
        }
      } catch (e) {
        console.error("AppLayout: Exception in getSession():", e);
        setSupabaseSession(null);
        storeLogout();
      }
      setLoadingAuth(false);
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, newSession: Session | null) => {
        setSupabaseSession((prevLocalSession) => {
          const newAccessToken = newSession?.access_token;
          const prevAccessToken = prevLocalSession?.access_token;
          const newUserId = newSession?.user?.id;
          const prevUserId = prevLocalSession?.user?.id;

          if (newAccessToken !== prevAccessToken || newUserId !== prevUserId) {
            return newSession;
          }
          return prevLocalSession;
        });

        if (event === "SIGNED_OUT") {
          storeLogout();
          setLoadingAuth(false);
        } else if (event === "SIGNED_IN") {
        } else if (event === "INITIAL_SESSION") {
          if (!newSession) {
            storeLogout();
          }
        }
        if (
          !newSession &&
          event !== "SIGNED_OUT" &&
          event !== "INITIAL_SESSION"
        ) {
          storeLogout();
        }
        if (
          newSession ||
          event === "SIGNED_OUT" ||
          (event === "INITIAL_SESSION" && !newSession)
        ) {
          setLoadingAuth(false);
        }
      },
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [storeSetUser, storeLogout, storeSetIsLoading]);

  const publicPaths = [ROUTES.LOGIN, ROUTES.SIGNUP, "/"];
  const isPublicPage = publicPaths.includes(router.pathname);

  if (loadingAuth && !isPublicPage) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (isLoadingUser && !isPublicPage && supabaseSession) {
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (!supabaseSession && !isPublicPage && !loadingAuth) {
    if (typeof window !== "undefined") {
      router.push("/login");
    }
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (isErrorUser && !isPublicPage && supabaseSession && !isLoadingUser) {
    return (
      <Flex direction="column" justify="center" align="center" height="100vh">
        <Text color="red.500" mb={4}>
          Could not load your profile. Please try logging out and in again.
        </Text>
        <Button
          onClick={() => logoutMutation.mutate()}
          isLoading={logoutMutation.isPending}
          colorScheme="red"
        >
          Logout
        </Button>
      </Flex>
    );
  }

  if (
    appUser &&
    !isLoadingUser &&
    (router.pathname === ROUTES.LOGIN || router.pathname === ROUTES.SIGNUP)
  ) {
    if (typeof window !== "undefined") {
      const dashboardPath =
        appUser.role === "sponsor"
          ? ROUTES.SPONSOR_DASHBOARD
          : ROUTES.VENDOR_DASHBOARD;
      router.push(dashboardPath);
    }
    return (
      <Flex justify="center" align="center" height="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  const baseRenderCondition = !!(appUser && !isLoadingUser);
  const showNavbar = isPublicPage || baseRenderCondition;
  let canRenderChildren: boolean = isPublicPage || baseRenderCondition;

  if (appUser?.role === "vendor" && !isPublicPage) {
    if (isCheckingVendorWalletStatus) {
      canRenderChildren = false;
    } else if (hasVendorWallet === false) {
      canRenderChildren = false;
    }
  }

  return (
    <Box>
      {showNavbar && <Navbar />}
      {appUser?.role === "vendor" && <SmartWalletSetupModal />}
      <Container maxW="container.xl" py={8} as="main">
        {canRenderChildren
          ? children
          : !isPublicPage && (
              <Flex
                justify="center"
                align="center"
                height="calc(100vh - 128px)"
              >
                <Spinner size="xl" />
              </Flex>
            )}
      </Container>
      <Box
        as="footer"
        textAlign="center"
        py={4}
        borderTopWidth={1}
        borderColor="gray.200"
        bg={"white"}
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        zIndex={1000}
      >
        <HStack w="100%" justify="space-between" px={6}>
          <Text fontSize="sm">&copy; {new Date().getFullYear()} ZepPay.</Text>
          <Text fontSize="sm">All rights reserved.</Text>
        </HStack>
      </Box>
    </Box>
  );
};

export default AppLayout;
