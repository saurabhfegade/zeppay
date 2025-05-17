import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useToast } from '@chakra-ui/react';
import { useVendorSetupActions } from '@/frontend/store/vendor-setup-store';
import apiClient from '@/frontend/lib/axios-client';

interface VendorWalletStatusResponse {
  hasWallet: boolean;
  walletAddress: string;
}

interface UseGetVendorWalletStatusQueryOptions {
  enabled?: boolean;
}

export const useGetVendorWalletStatusQuery = (
  options?: UseGetVendorWalletStatusQueryOptions,
) => {
  const toast = useToast();
  const { setHasWallet, setIsCheckingWalletStatus, openSetupModal, closeSetupModal } = useVendorSetupActions();

  const query = useQuery<VendorWalletStatusResponse, Error>({
    queryKey: ['vendor-wallet-status'],
    queryFn: async () => {
      console.log('[WalletStatusQuery] Fetching wallet status...');
      const response = await apiClient.get<VendorWalletStatusResponse>('/vendors/wallet-status');
      console.log('[WalletStatusQuery] API response:', response.data);
      return response.data;
    },
    enabled: options?.enabled ?? true,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  useEffect(() => {
    console.log('[WalletStatusQuery] isLoading changed:', query.isLoading);
    setIsCheckingWalletStatus(query.isLoading);
  }, [query.isLoading, setIsCheckingWalletStatus]);

  const prevIsSuccessRef = useRef<boolean | undefined>(undefined);
  const prevHasWalletRef = useRef<boolean | undefined | null>(null);
  const prevIsErrorRef = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    console.log('[WalletStatusQuery] Effect for wallet logic running. isSuccess:', query.isSuccess, 'hasData:', !!query.data, 'isError:', query.isError);
    if (query.isSuccess && query.data) {
      console.log('[WalletStatusQuery] Query successful. Data:', query.data, 'PrevSuccess:', prevIsSuccessRef.current, 'PrevHasWallet:', prevHasWalletRef.current);
      if (prevIsSuccessRef.current !== true || prevHasWalletRef.current !== query.data.hasWallet) {
        console.log('[WalletStatusQuery] Conditions met to update wallet state. Current hasWallet:', query.data.hasWallet);
        setHasWallet(query.data.hasWallet);
        if (!query.data.hasWallet) {
          console.log('[WalletStatusQuery] hasWallet is false. Calling openSetupModal().');
          openSetupModal();
        } else {
          console.log('[WalletStatusQuery] hasWallet is true. Calling closeSetupModal().');
          closeSetupModal();
        }
      } else {
        console.log('[WalletStatusQuery] Conditions NOT met to update wallet state (no change).');
      }
    } else if (query.isError && query.error) {
      console.log('[WalletStatusQuery] Query error. Error:', query.error, 'PrevIsError:', prevIsErrorRef.current);
      if (prevIsErrorRef.current !== true) {
        toast({
          title: 'Error Checking Wallet Status',
          description:
            query.error.message ||
            'Could not verify your wallet status. Please try refreshing the page or contact support if the issue persists.',
          status: 'error',
          duration: 7000,
          isClosable: true,
        });
      }
    }
    prevIsSuccessRef.current = query.isSuccess;
    prevHasWalletRef.current = query.data?.hasWallet;
    prevIsErrorRef.current = query.isError;
    console.log('[WalletStatusQuery] Refs updated. PrevSuccess:', prevIsSuccessRef.current, 'PrevHasWallet:', prevHasWalletRef.current, 'PrevIsError:', prevIsErrorRef.current);
  }, [
    query.isSuccess,
    query.data,
    query.isError,
    query.error,
    setHasWallet,
    openSetupModal,
    closeSetupModal,
    toast,
  ]);

  return {
    walletStatus: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isSuccess: query.isSuccess,
    refetchWalletStatus: query.refetch,
  };
}; 