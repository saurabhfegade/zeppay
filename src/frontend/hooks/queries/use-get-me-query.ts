import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import apiClient from '@/frontend/lib/axios-client';
import { GetMeResponsePayload } from '@/common/types/auth.d';

export const ME_QUERY_KEY = ['me'];

const fetchMe = async (): Promise<GetMeResponsePayload> => {
  const { data } = await apiClient.get<GetMeResponsePayload>('/auth/me');
  return data;
};

export const useGetMeQuery = (
  options?: Omit<UseQueryOptions<GetMeResponsePayload, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<GetMeResponsePayload, Error>({
    queryKey: ME_QUERY_KEY,
    queryFn: fetchMe,
    // It's common to set staleTime and cacheTime for user data
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (use gcTime in v5, cacheTime is for v4)
    retry: 1, // Don't retry endlessly if user is not authenticated
    ...options,
  });
}; 