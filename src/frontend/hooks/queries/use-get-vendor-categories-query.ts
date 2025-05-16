import { useQuery, UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/frontend/lib/axios-client';
import { Category } from '@/common/types/database.types';
import { useVendorProfileStore } from '@/frontend/store/vendor-profile-store';
import { useEffect } from 'react';

// Define the type for the API response
export type VendorCategoriesApiResponse = Category[];

// Query key for vendor-specific categories
export const VENDOR_CATEGORIES_QUERY_KEY = ['vendor-categories'];

// Fetch function
const fetchVendorCategories = async (): Promise<VendorCategoriesApiResponse> => {
  const { data } = await apiClient.get<VendorCategoriesApiResponse>('/vendors/categories');
  return data;
};

// Custom hook
export const useGetVendorCategoriesQuery = (): UseQueryResult<VendorCategoriesApiResponse, Error> => {
  const setAssignedCategories = useVendorProfileStore((state) => state.setAssignedCategories);

  const queryResult = useQuery<VendorCategoriesApiResponse, Error, VendorCategoriesApiResponse, string[]>(
    {
      queryKey: VENDOR_CATEGORIES_QUERY_KEY,
      queryFn: fetchVendorCategories,
      staleTime: 5 * 60 * 1000, // 5 minutes
      // onSuccess: (data) => {
      //   // Update the Zustand store when data is fetched successfully
      //   setAssignedCategories(data);
      // },
    }
  );

  // Effect to update Zustand store when data changes
  useEffect(() => {
    if (queryResult.data) {
      setAssignedCategories(queryResult.data);
    }
  }, [queryResult.data, setAssignedCategories]);

  return queryResult;
}; 