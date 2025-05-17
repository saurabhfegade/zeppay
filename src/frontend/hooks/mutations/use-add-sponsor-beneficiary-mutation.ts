import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { AxiosError } from 'axios'; 
import { AddSponsorBeneficiaryPayload } from '@/backend/validation/beneficiary-validation';
import { Beneficiary } from '@/common/types/api'; // Ensure this path is correct
import apiClient from '../../lib/axios-client';

// It's good practice to define a type for your API error response structure if known
interface ApiErrorResponse {
  message?: string;
  errors?: { // More specific type for Zod flattened field errors
    fieldErrors?: Record<string, string[] | undefined>;
    formErrors?: string[];
  };
}

const addSponsorBeneficiary = async (payload: AddSponsorBeneficiaryPayload): Promise<Beneficiary> => {
  const { data } = await apiClient.post<Beneficiary>('/sponsors/beneficiaries', payload);
  return data;
};

export const useAddSponsorBeneficiaryMutation = (): UseMutationResult<
  Beneficiary,
  AxiosError<ApiErrorResponse>, // Typed error for better handling
  AddSponsorBeneficiaryPayload
> => {
  const queryClient = useQueryClient();

  return useMutation<Beneficiary, AxiosError<ApiErrorResponse>, AddSponsorBeneficiaryPayload>({
    mutationFn: addSponsorBeneficiary,
    onSuccess: () => { // Removed newData as it was unused
      queryClient.invalidateQueries({ queryKey: ['sponsorBeneficiaries'] });
    },
    onError: (error) => {
      console.error('Error adding beneficiary:', error.response?.data || error.message);
    },
  });
}; 