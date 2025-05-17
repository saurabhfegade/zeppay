import { useQuery, UseQueryResult } from '@tanstack/react-query';
import apiClient from '../../lib/axios-client'; // Import the configured apiClient
import { Beneficiary } from '@/common/types/api'; // Ensure this path is correct

export const SPONSOR_BENEFICIARIES_QUERY_KEY = ['sponsorBeneficiaries'];

const fetchSponsorBeneficiaries = async (): Promise<Beneficiary[]> => {
  const { data } = await apiClient.get<Beneficiary[]>('/sponsors/beneficiaries');
  return data;
};

export const useGetSponsorBeneficiariesQuery = (): UseQueryResult<Beneficiary[], Error> => {
  return useQuery<Beneficiary[], Error, Beneficiary[], string[]>({
    queryKey: SPONSOR_BENEFICIARIES_QUERY_KEY,
    queryFn: fetchSponsorBeneficiaries,
    // You can add options like staleTime, cacheTime here if needed
  });
}; 