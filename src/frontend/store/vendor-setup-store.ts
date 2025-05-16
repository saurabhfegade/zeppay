import { create } from 'zustand';

interface VendorSetupState {
  hasWallet: boolean | null;
  isCheckingWalletStatus: boolean;
  isSetupModalOpen: boolean;
  setupStep: number; // 0: Connect Wallet, 1: Register Wallet
  generatedWalletAddress: string | null;
  actions: {
    setHasWallet: (hasWallet: boolean | null) => void;
    setIsCheckingWalletStatus: (isLoading: boolean) => void;
    openSetupModal: () => void;
    closeSetupModal: () => void;
    setSetupStep: (step: number) => void;
    setGeneratedWalletAddress: (address: string | null) => void;
    resetSetupState: () => void;
  };
}

const initialState = {
  hasWallet: null,
  isCheckingWalletStatus: true,
  isSetupModalOpen: false,
  setupStep: 0,
  generatedWalletAddress: null,
};

export const useVendorSetupStore = create<VendorSetupState>((set) => ({
  ...initialState,
  actions: {
    setHasWallet: (hasWallet) => set({ hasWallet }),
    setIsCheckingWalletStatus: (isLoading) => set({ isCheckingWalletStatus: isLoading }),
    openSetupModal: () => set({ isSetupModalOpen: true, setupStep: 0, generatedWalletAddress: null }), // Reset step and address when opening
    closeSetupModal: () => set({ isSetupModalOpen: false }),
    setSetupStep: (step) => set({ setupStep: step }),
    setGeneratedWalletAddress: (address) => set({ generatedWalletAddress: address }),
    resetSetupState: () => set(initialState), // Resets to initial state, useful on logout or completion
  },
}));

// Export actions directly for easier usage (optional, but can be convenient)
export const useVendorSetupActions = () => useVendorSetupStore((state) => state.actions); 