import { useQuery, UseQueryResult } from '@tanstack/react-query';
import apiClient from '@/frontend/lib/axios-client';
import { Category } from '@/common/types/database.types'; // Adjusted path

// Define the type for the API response
export type CategoriesApiResponse = Category[];

// Query key
export const CATEGORIES_QUERY_KEY = ['categories'];

// Fetch function
const fetchCategories = async (): Promise<CategoriesApiResponse> => {
  const { data } = await apiClient.get<CategoriesApiResponse>('/categories');
  return data;
};

// Custom hook
export const useGetCategoriesQuery = (): UseQueryResult<CategoriesApiResponse, Error> => {
  return useQuery<CategoriesApiResponse, Error, CategoriesApiResponse, string[]>({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: fetchCategories,
    staleTime: 60 * 60 * 1000, // 1 hour, categories don't change often
  });
}; 