import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { useToast } from '@chakra-ui/react';
import { useVendorSetupStore } from '@/frontend/store/vendor-setup-store';
import { useAuthStore } from '@/frontend/store/auth-store';
import { SmartWallet } from '@/common/types/database.types';

interface RegisterVendorWalletPayload {
  wallet_address: string;
  network_id?: string;
}

interface ApiErrorResponse {
  message: string;
  details?: unknown;
  errors?: Record<string, string[]>;
}

const registerVendorWalletFn = async (payload: RegisterVendorWalletPayload, token: string | null): Promise<SmartWallet> => {
  if (!token) {
    throw new Error('Authentication token is missing. Cannot register wallet.');
  }
  const { data } = await axios.post<SmartWallet>('/api/vendors/register-wallet', payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

export const useRegisterVendorWalletMutation = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { setHasWallet, closeSetupModal } = useVendorSetupStore((state) => state.actions);
  const authToken = useAuthStore((state) => state.sessionToken);

  return useMutation<SmartWallet, AxiosError<ApiErrorResponse>, RegisterVendorWalletPayload>({
    mutationFn: (payload: RegisterVendorWalletPayload) => registerVendorWalletFn(payload, authToken),
    onSuccess: (data: SmartWallet) => {
      setHasWallet(true);
      closeSetupModal();
      queryClient.invalidateQueries({ queryKey: ["vendor-wallet-status"] });
      toast({
        title: 'Smart Wallet Registered',
        description: `Your wallet ${data.wallet_address} has been successfully registered.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to register smart wallet.';
      console.error('Error registering vendor smart wallet:', error.response?.data || error);
      toast({
        title: 'Registration Failed',
        description: errorMessage,
        status: 'error',
        duration: 7000,
        isClosable: true,
      });
    },
  });
}; 