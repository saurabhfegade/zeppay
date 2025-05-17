import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import apiClient from '@/frontend/lib/axios-client';
import { Sponsorship, Beneficiary, Category } from '@/common/types/database.types'; // Adjusted path
import { SPONSOR_BENEFICIARIES_QUERY_KEY } from '../queries/use-get-sponsor-beneficiaries-query'; // For invalidation
import { SPONSOR_WAAS_WALLET_QUERY_KEY } from '../queries/use-get-sponsor-waas-wallet-query'; // For invalidation

// Request Payload type (matches Zod schema in API route)
export interface CreateSponsorshipPayload {
  beneficiary_phone_number: string;
  amount_usdc: number;
  category_ids: string[];
  notes?: string;
  expires_at?: string; // ISO date string or YYYY-MM-DD
}

// API Response type
export interface CreateSponsorshipResponse extends Sponsorship {
  beneficiary: Beneficiary;
  categories: Category[];
}

// Mutation function
const createSponsorship = async (payload: CreateSponsorshipPayload): Promise<CreateSponsorshipResponse> => {
  const { data } = await apiClient.post<CreateSponsorshipResponse>('/sponsors/sponsorships', payload);
  return data;
};

// Custom hook
export const useCreateSponsorshipMutation = (): UseMutationResult<
  CreateSponsorshipResponse,
  Error, // Or your specific API error type
  CreateSponsorshipPayload
> => {
  const queryClient = useQueryClient();

  return useMutation<CreateSponsorshipResponse, Error, CreateSponsorshipPayload>({
    mutationFn: createSponsorship,
    onSuccess: (data) => {
      // Invalidate queries that should be refetched after creating a sponsorship
      // For example, if there's a query to list all sponsorships for a sponsor:
      queryClient.invalidateQueries({ queryKey: ['sponsorships'] }); // Generic key, adjust if specific
      queryClient.invalidateQueries({ queryKey: SPONSOR_BENEFICIARIES_QUERY_KEY }); // If this list might change or show sponsorship counts
      queryClient.invalidateQueries({ queryKey: SPONSOR_WAAS_WALLET_QUERY_KEY }); // Wallet balance will change
      
      console.log('Sponsorship created successfully:', data);
    },
    onError: (error) => {
      // Handle error, maybe log it or show a generic error message if not handled by toast
      console.error('Error creating sponsorship:', error.message);
    },
  });
}; 