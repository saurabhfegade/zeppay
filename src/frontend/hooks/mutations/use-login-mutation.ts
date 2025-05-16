import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { supabase } from '@/frontend/lib/supabase-client';
import { LoginRequestPayload } from '@/common/types/auth.d';
import { AuthError, AuthResponse } from '@supabase/supabase-js';

const loginUser = async (payload: LoginRequestPayload): Promise<AuthResponse['data']> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (error) {
    throw error;
  }
  return data;
};

export const useLoginMutation = (
  options?: UseMutationOptions<AuthResponse['data'], AuthError, LoginRequestPayload>
) => {
  return useMutation<AuthResponse['data'], AuthError, LoginRequestPayload>({
    mutationFn: loginUser,
    ...options,
  });
}; 