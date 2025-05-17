import { useQuery, UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/frontend/lib/axios-client';
import { Sponsorship, Beneficiary, Category } from '@/common/types/database.types'; // Adjusted path

// Define the type for the API response for a single sponsorship item
export interface EnrichedSponsorship extends Sponsorship {
  beneficiary: Beneficiary | null; // Beneficiary might be null if not found, though service tries to fetch it
  categories: Category[];
}

export type SponsorSponsorshipsApiResponse = EnrichedSponsorship[];

// Query key
export const SPONSOR_SPONSORSHIPS_QUERY_KEY = ['sponsorSponsorships'];

// Fetch function
const fetchSponsorSponsorships = async (): Promise<SponsorSponsorshipsApiResponse> => {
  const { data } = await apiClient.get<SponsorSponsorshipsApiResponse>('/sponsors/sponsorships');
  return data;
};

// Custom hook
export const useGetSponsorSponsorshipsQuery = (): UseQueryResult<SponsorSponsorshipsApiResponse, Error> => {
  return useQuery<SponsorSponsorshipsApiResponse, Error, SponsorSponsorshipsApiResponse, string[]>({
    queryKey: SPONSOR_SPONSORSHIPS_QUERY_KEY,
    queryFn: fetchSponsorSponsorships,
    staleTime: 5 * 60 * 1000, // 5 minutes, as sponsorships list might change
  });
}; 