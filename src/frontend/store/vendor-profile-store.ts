import { create } from 'zustand';
import { Category } from '@/common/types/database.types'; // Assuming this type exists

interface VendorProfileState {
  assignedCategories: Category[];
  setAssignedCategories: (categories: Category[]) => void;
  clearProfile: () => void;
}

export const useVendorProfileStore = create<VendorProfileState>((set) => ({
  assignedCategories: [],
  setAssignedCategories: (categories) => set({ assignedCategories: categories }),
  clearProfile: () => set({ assignedCategories: [] }),
})); 