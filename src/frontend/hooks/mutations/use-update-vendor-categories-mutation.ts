import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/frontend/lib/axios-client';
import { Category } from '@/common/types/database.types'; // Assuming this type exists
import { VENDOR_CATEGORIES_QUERY_KEY } from '@/frontend/hooks/queries/use-get-vendor-categories-query'; // To invalidate vendor's categories query
import { useVendorProfileStore } from '@/frontend/store/vendor-profile-store';

interface UpdateVendorCategoriesPayload {
  category_ids: string[];
}

interface UpdateVendorCategoriesResponse {
  message: string;
  categories: Category[];
}

// API function
const updateVendorCategories = async (payload: UpdateVendorCategoriesPayload): Promise<UpdateVendorCategoriesResponse> => {
  const { data } = await apiClient.post<UpdateVendorCategoriesResponse>('/vendors/categories', payload);
  return data;
};

// Custom hook
export const useUpdateVendorCategoriesMutation = (): UseMutationResult<
  UpdateVendorCategoriesResponse,
  Error,
  UpdateVendorCategoriesPayload
> => {
  const queryClient = useQueryClient();
  const setAssignedCategories = useVendorProfileStore((state) => state.setAssignedCategories);

  return useMutation<UpdateVendorCategoriesResponse, Error, UpdateVendorCategoriesPayload>(
    {
      mutationFn: updateVendorCategories,
      onSuccess: (data) => {
        // Update the Zustand store with the new categories
        setAssignedCategories(data.categories);
        // Invalidate and refetch the vendor's categories query to keep server state fresh
        queryClient.invalidateQueries({ queryKey: VENDOR_CATEGORIES_QUERY_KEY });
        // Optionally, invalidate general categories if it makes sense, though likely not needed here
        // queryClient.invalidateQueries({ queryKey: ['categories'] });
      },
      onError: (error) => {
        // Handle error (e.g., show a notification)
        console.error('Error updating vendor categories:', error);
      },
    }
  );
}; 