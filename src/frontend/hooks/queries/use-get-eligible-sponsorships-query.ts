import { useQuery, UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/frontend/lib/axios-client';
// Assuming the EligibleSponsorshipForVendor interface is exported from the service or a types file
// For now, let's define it here based on the expected structure. Adjust if it's already defined elsewhere.
interface BeneficiaryInfo {
  id: string;
  display_name?: string | null;
  phone_number_for_telegram?: string | null;
}

interface EligibleAllocation {
  sponsorship_allowed_category_id: string;
  category_id: string;
  category_name: string;
  available_usdc: number;
}

export interface EligibleSponsorshipForVendorResponseItem {
  sponsorship_id: string;
  sponsorship_notes?: string | null;
  sponsorship_expires_at?: string | null;
  beneficiary: BeneficiaryInfo;
  eligible_allocations: EligibleAllocation[];
}

export type EligibleSponsorshipsApiResponse = EligibleSponsorshipForVendorResponseItem[];

// Query key
export const ELIGIBLE_SPONSORSHIPS_QUERY_KEY = ['eligible-sponsorships'];

// Fetch function
const fetchEligibleSponsorships = async (): Promise<EligibleSponsorshipsApiResponse> => {
  const { data } = await apiClient.get<EligibleSponsorshipsApiResponse>('/vendors/eligible-sponsorships');
  return data;
};

// Custom hook
export const useGetEligibleSponsorshipsQuery = (): UseQueryResult<EligibleSponsorshipsApiResponse, Error> => {
  return useQuery<EligibleSponsorshipsApiResponse, Error, EligibleSponsorshipsApiResponse, string[]>(
    {
      queryKey: ELIGIBLE_SPONSORSHIPS_QUERY_KEY,
      queryFn: fetchEligibleSponsorships,
      staleTime: 5 * 60 * 1000, // 5 minutes, as sponsorship availability can change
      // enabled: !!vendorId, // This query depends on the vendor being authenticated, which is handled by the API route
    }
  );
}; 