import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User as SupabaseUser } from '@supabase/supabase-js';

// Define your extended user type if you have one (e.g., with role)
export interface User extends SupabaseUser {
  role?: 'sponsor' | 'vendor' | string; // string for flexibility if roles can be dynamic
  display_name?: string;
  // Add other custom properties your user object might have
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // To track initial auth state loading
  sessionToken: string | null; // Store JWT if needed by non-Supabase APIs
  setUser: (user: User | null, token?: string | null) => void;
  logout: () => Promise<void>; // Make logout async if it involves API calls
  setIsLoading: (loading: boolean) => void;
  // You might also want a function to initialize/check auth state on app load
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true, // Start with loading true until initial check is done
      sessionToken: null,
      setUser: (user, token = null) => {
        set({
          user,
          isAuthenticated: !!user,
          sessionToken: token,
          isLoading: false,
        });
      },
      logout: async () => {
        // Perform Supabase logout (or your custom API logout)
        // Example: const { error } = await supabase.auth.signOut();
        // if (error) console.error('Error logging out:', error);
        set({
          user: null,
          isAuthenticated: false,
          sessionToken: null,
          isLoading: false,
        });
        // Clear any other persisted user-related data if necessary
      },
      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage', // unique name for localStorage key
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      // Only persist parts of the store you want to keep across sessions
      // By default, everything is persisted. You might want to exclude sensitive tokens
      // or only persist a flag like isAuthenticated and re-fetch user on load.
      // partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// Optional: Function to initialize auth state from Supabase session on app load
// This would typically be called in your _app.tsx
// import { supabase } from '../lib/supabase-client'; // Adjust path

// export const initializeAuth = async () => {
//   useAuthStore.getState().setIsLoading(true);
//   const { data: { session }, error } = await supabase.auth.getSession();

//   if (error) {
//     console.error('Error getting session:', error);
//     useAuthStore.getState().setUser(null);
//     return;
//   }

//   if (session) {
//     // You might need to fetch full user profile details if session.user is minimal
//     // For now, assuming session.user has enough info or you add a fetch here
//     const userWithRole = { 
//       ...session.user,
//       role: session.user.app_metadata?.role || session.user.user_metadata?.role,
//       display_name: session.user.user_metadata?.display_name || session.user.email
//     } as User;
//     useAuthStore.getState().setUser(userWithRole, session.access_token);
//   } else {
//     useAuthStore.getState().setUser(null);
//   }
//   useAuthStore.getState().setIsLoading(false);
// }; 