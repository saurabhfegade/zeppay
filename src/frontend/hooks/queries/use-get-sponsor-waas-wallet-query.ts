import { useQuery } from '@tanstack/react-query';
import apiClient from '@/frontend/lib/axios-client';
import { WaasWallet } from '@/common/types/database.types'; // Ensure this path is correct

// Define the type for the API response, which is the WaasWallet
type SponsorWaasWalletResponse = WaasWallet;

// Query key
export const SPONSOR_WAAS_WALLET_QUERY_KEY = ['sponsorWaasWallet'];

// Fetch function
const fetchSponsorWaasWallet = async (): Promise<SponsorWaasWalletResponse> => {
  const { data } = await apiClient.get<SponsorWaasWalletResponse>('/sponsors/waas-wallets');
  return data;
};

// Custom hook
export const useGetSponsorWaasWalletQuery = () => {
  return useQuery<SponsorWaasWalletResponse, Error>({
    queryKey: SPONSOR_WAAS_WALLET_QUERY_KEY,
    queryFn: fetchSponsorWaasWallet,
    // Add any Tanstack Query options here if needed, e.g., staleTime, cacheTime
    // For wallet balance, you might want it to be reasonably fresh:
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}; 