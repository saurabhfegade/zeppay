import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/frontend/lib/supabase-client';
import { useRouter } from 'next/router';
import { ME_QUERY_KEY } from '../queries/use-get-me-query';
// import apiClient from '@/frontend/lib/axios-client'; // apiClient no longer needed
import { AuthError } from '@supabase/supabase-js';
import { ROUTES } from '@/common/constants/routes';
import { useAuthStore } from '../../store/auth-store'; // Added import for useAuthStore

// The primary logout action is client-side Supabase signout
const performLogout = async (): Promise<void> => {
  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) {
    console.error('Error signing out from Supabase client:', signOutError);
    throw signOutError; // Propagate error to useMutation's onError
  }
  // The call to apiClient.post('/auth/logout') has been removed as it's redundant.
  // console.log('Backend /auth/logout endpoint notified.'); // Removed
};

export const useLogoutMutation = (
  options?: UseMutationOptions<void, AuthError, void>
) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const storeLogout = useAuthStore((state) => state.logout); // Get logout from store

  return useMutation<void, AuthError, void>({
    mutationFn: performLogout,
    onSuccess: (data, variables, context) => {
      console.log('Client-side Supabase signOut successful.');
      
      storeLogout(); // Clear Zustand auth store
      console.log('Zustand auth store cleared by useLogoutMutation.');

      queryClient.setQueryData(ME_QUERY_KEY, null); 
      console.log('ME_QUERY_KEY cleared from cache.');

      router.push(ROUTES.LOGIN).then(() => {
        console.log('Redirect to login initiated by useLogoutMutation.');
      }).catch(err => {
        console.error('Router push error in logout mutation:', err);
      });

      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      console.error('Error in useLogoutMutation:', error);
      storeLogout(); // Clear Zustand auth store even on error
      queryClient.setQueryData(ME_QUERY_KEY, null);
      router.push(ROUTES.LOGIN); 
      options?.onError?.(error, variables, context);
    },
    ...options,
  });
}; 