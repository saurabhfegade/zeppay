import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "../../common/types/db"; // Relative path
import { supabase } from "../lib/supabase-client"; // Relative path

export interface AuthState {
  user: User | null;
  sessionToken: string | null; // Store the JWT token
  isAuthenticated: boolean;
  isLoading: boolean; // To track async operations like fetching user or session state
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setSessionToken: (token: string | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      sessionToken: null,
      isAuthenticated: false,
      isLoading: true, // Start loading initially
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user, error: null }),
      setSessionToken: (token) => set({ sessionToken: token }),
      setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error, isLoading: false }),

      logout: async () => {
        set({ isLoading: true });
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("Error during logout:", error);
          set({ error: error.message, isLoading: false });
        } else {
          set({
            user: null,
            sessionToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },
    }),
    {
      name: "auth-storage", // Name of the item in storage (must be unique)
      storage: createJSONStorage(() => localStorage), // Or sessionStorage
      partialize: (state) => ({
        sessionToken: state.sessionToken,
      }),
      onRehydrateStorage: () => {
        console.log("Auth store has been rehydrated");
        // Initial session check will be handled by the function called from _app.tsx
      },
    },
  ),
);

// Selector for convenience (optional, but good practice as per Zustand docs for createSelectors utility)
// For now, direct access is fine, but if you add createSelectors, it would look like:
// export const useAuth = createSelectors(useAuthStore);
// Then in components: const user = useAuth.use.user();

// This initializeAuthState function will be simplified or removed once useAuth hook is fully integrated.
// The hook will be responsible for the initial auth check on app load.
export const initializeAuthState = async () => {
  const store = useAuthStore.getState();
  // Ensure isLoading is true at the start of the check
  if (!store.isLoading) {
    store.setLoading(true);
  }
  const token = store.sessionToken;

  if (token) {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error getting session on init:", sessionError);
        store.setError(sessionError.message);
        store.setSessionToken(null);
        store.setUser(null);
        store.setIsAuthenticated(false);
      } else if (session) {
        // We have a Supabase session, likely means authenticated.
        // Setting isAuthenticated: true here. Actual user profile might be fetched elsewhere.
        store.setSessionToken(session.access_token);
        store.setIsAuthenticated(true);
        // Fetch user profile associated with the session if needed
        // const { data: userProfile, error: profileError } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        // if (userProfile) store.setUser(userProfile);
      } else {
        // No active session despite having a token (maybe expired/invalidated)
        store.setSessionToken(null);
        store.setUser(null);
        store.setIsAuthenticated(false);
      }
    } catch (e: unknown) {
      console.error("Catch block error during initializeAuthState:", e);
      const errorMessage =
        e instanceof Error ? e.message : "Failed to initialize auth state";
      store.setError(errorMessage);
      store.setSessionToken(null);
      store.setUser(null);
      store.setIsAuthenticated(false);
    }
  } else {
    // No token found in storage
    store.setUser(null);
    store.setIsAuthenticated(false);
  }
  // Crucially, set loading to false once checks are complete
  store.setLoading(false);
};

// Removed placeholder checkUserAuthentication function
