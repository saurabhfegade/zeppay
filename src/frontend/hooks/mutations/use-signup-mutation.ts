import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import apiClient from '@/frontend/lib/axios-client';
import { SignUpRequestPayload, SignUpResponsePayload } from '@/common/types/auth.d';

const signUpUser = async (payload: SignUpRequestPayload): Promise<SignUpResponsePayload> => {
  const { data } = await apiClient.post<SignUpResponsePayload>('/auth/signup', payload);
  return data;
};

export const useSignUpMutation = (
  options?: UseMutationOptions<SignUpResponsePayload, Error, SignUpRequestPayload>
) => {
  return useMutation<SignUpResponsePayload, Error, SignUpRequestPayload>({
    mutationFn: signUpUser,
    ...options,
  });
}; 