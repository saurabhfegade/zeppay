import {
  useMutation,
  useQuery,
  useQueryClient,
  QueryKey,
} from "@tanstack/react-query";
import apiClient from "../lib/axios-client";
import { useAuthStore } from "../store/auth-store";
import type { User } from "../../common/types/db";
import type {
  SignupPayload,
  LoginPayload,
} from "../../backend/validation/auth-schemas";
import type {
  ApiSuccessResponse,
  ApiErrorResponse,
} from "../../common/types/api";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { toaster } from "../../components/ui/toaster";

// Query key factory
const authQueryKeys = {
  me: ["auth", "me"] as const, // `as const` is important for type inference
};

// API Functions
const signupUser = async (payload: SignupPayload): Promise<User> => {
  const { data } = await apiClient.post<ApiSuccessResponse<User>>(
    "/auth/signup",
    payload,
  );
  if (!data.success)
    throw new Error(data.message || "Signup failed during API call"); // Ensure success is true
  return data.data;
};

const loginUser = async (payload: LoginPayload): Promise<User> => {
  const { data } = await apiClient.post<ApiSuccessResponse<User>>(
    "/auth/login",
    payload,
  );
  if (!data.success)
    throw new Error(data.message || "Login failed during API call");
  return data.data;
};

const fetchCurrentUser = async (): Promise<User> => {
  const { data } = await apiClient.get<ApiSuccessResponse<User>>("/auth/me");
  if (!data.success)
    throw new Error(
      data.message || "Fetching current user failed during API call",
    );
  return data.data;
};

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Select state and actions from Zustand
  const zustandUser = useAuthStore((state) => state.user);
  const sessionToken = useAuthStore((state) => state.sessionToken);
  const storeIsAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const storeIsAuthLoading = useAuthStore((state) => state.isLoading);
  const setUser = useAuthStore((state) => state.setUser);
  const setSessionToken = useAuthStore((state) => state.setSessionToken);
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated);
  const storeLogout = useAuthStore((state) => state.logout);

  const {
    data: currentUser,
    isLoading: isUserLoading,
    isError: isUserError,
    error: userApiError,
    refetch: refetchUser,
    isSuccess: isUserSuccess,
  } = useQuery<User, ApiErrorResponse, User, QueryKey>({
    queryKey: authQueryKeys.me,
    queryFn: fetchCurrentUser,
    enabled: !!sessionToken && !storeIsAuthLoading, // Only fetch if token exists and store isn't busy
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Effect for handling query success - More defensive update
  useEffect(() => {
    if (isUserSuccess && currentUser) {
      // Only update if user is different or not currently authenticated in store
      if (currentUser.id !== zustandUser?.id || !storeIsAuthenticated) {
        console.log("[Auth Hook] Query success: Setting user and auth state.");
        setUser(currentUser);
        setIsAuthenticated(true);
      }
    }
    // Dependencies: Include zustandUser and storeIsAuthenticated for comparison
  }, [
    isUserSuccess,
    currentUser,
    setUser,
    setIsAuthenticated,
    zustandUser,
    storeIsAuthenticated,
  ]);

  // Effect for handling query error - More defensive update
  useEffect(() => {
    if (isUserError && userApiError) {
      // Only update if user is currently authenticated in store
      if (storeIsAuthenticated || zustandUser !== null) {
        console.error(
          "[Auth Hook] Query error: Clearing auth state.",
          userApiError,
        );
        setSessionToken(null);
        setUser(null);
        setIsAuthenticated(false);
        // Redirect logic remains the same
        if (
          userApiError?.message?.includes("Invalid or expired token") ||
          userApiError?.message?.includes("Authorization header")
        ) {
          if (router.pathname !== "/login" && router.pathname !== "/signup") {
            router.push("/login?reason=session_expired");
          }
        }
      }
    } // Dependencies: Include storeIsAuthenticated and zustandUser for comparison
  }, [
    isUserError,
    userApiError,
    setSessionToken,
    setUser,
    setIsAuthenticated,
    router,
    storeIsAuthenticated,
    zustandUser,
  ]);

  const signupMutation = useMutation<User, ApiErrorResponse, SignupPayload>({
    mutationFn: signupUser,
    onSuccess: (/* _signedUpUser: User, _variables, _context */) => {
      setIsAuthenticated(false);
      setUser(null);
      alert("Signup successful! Please login.");
      router.push("/login");
    },
    onError: (error: ApiErrorResponse) => {
      console.error("Signup error:", error);
      alert(`Signup failed: ${error.message || "Unknown error"}`);
    },
  });

  const loginMutation = useMutation<User, ApiErrorResponse, LoginPayload>({
    mutationFn: loginUser,
    onSuccess: (userData: User /* , _variables, _context */) => {
      console.log("[Auth Hook] Login success: Setting state.", userData);
      setUser(userData);
      setIsAuthenticated(true);

      toaster.create({
        title: "Login Successful",
        description: "Welcome back!",
        type: "success",
      });
    },
    onError: (error: ApiErrorResponse) => {
      console.error("Login error:", error);
      toaster.create({
        title: "Login Failed",
        description: error.message || "Unknown error occurred during login.",
        type: "error",
      });
    },
  });

  const handleLogout = async () => {
    await storeLogout(); // Clears Zustand state via the store action
    queryClient.setQueryData(authQueryKeys.me, null); // Clear React Query cache for /me
    queryClient.removeQueries({ queryKey: authQueryKeys.me });
    router.push("/login?reason=logout");
  };

  // Recalculate isLoading based potentially updated state
  const isLoading =
    signupMutation.isPending ||
    loginMutation.isPending ||
    isUserLoading ||
    storeIsAuthLoading;
  const finalIsAuthenticated = !!currentUser && storeIsAuthenticated;

  return {
    user: currentUser || zustandUser, // Use query user if available, else fallback to store
    isAuthenticated: finalIsAuthenticated,
    isLoading,
    isUserLoading, // Expose query loading state
    isAuthLoading: storeIsAuthLoading, // Expose store loading state
    signup: signupMutation.mutateAsync,
    login: loginMutation.mutateAsync,
    logout: handleLogout,
    refetchUser,
    error:
      signupMutation.error ||
      loginMutation.error ||
      (isUserError ? userApiError : null),
  };
}
