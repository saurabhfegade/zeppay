import { supabase } from '../lib/db';
import { ApiError } from '../lib/apiError';
import { Category } from '../../common/types/database.types';
import { v4 as uuidv4 } from 'uuid';

export class CategoryService {
  /**
   * Gets all available categories
   * 
   * @returns Array of categories
   */
  static async getAllCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        throw new ApiError('Failed to fetch categories', 500, error.message);
      }

      return data as Category[];
    } catch (error) {
      console.error('Error fetching categories:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to fetch categories', 500, error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Creates a new category (admin only)
   * 
   * @param name Category name (must be unique)
   * @param description Optional category description
   * @returns The created category
   */
  static async createCategory(name: string, description?: string): Promise<Category> {
    try {
      // Check if category with this name already exists
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('*')
        .eq('name', name)
        .single();

      if (existingCategory) {
        throw new ApiError('Category with this name already exists', 400);
      }

      const categoryData = {
        id: uuidv4(),
        name,
        description,
      };

      const { data, error } = await supabase
        .from('categories')
        .insert(categoryData)
        .select()
        .single();

      if (error) {
        throw new ApiError('Failed to create category', 500, error.message);
      }

      return data as Category;
    } catch (error) {
      console.error('Error creating category:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to create category', 500, error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Updates a category (admin only)
   * 
   * @param categoryId Category ID
   * @param updates Object with name and/or description
   * @returns The updated category
   */
  static async updateCategory(
    categoryId: string,
    updates: { name?: string; description?: string }
  ): Promise<Category> {
    try {
      // Check if category exists
      const { data: existingCategory, error: existingError } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (existingError || !existingCategory) {
        throw new ApiError('Category not found', 404);
      }

      // If name is being updated, check if it's unique
      if (updates.name && updates.name !== existingCategory.name) {
        const { data: nameCheck } = await supabase
          .from('categories')
          .select('*')
          .eq('name', updates.name)
          .single();

        if (nameCheck) {
          throw new ApiError('Category with this name already exists', 400);
        }
      }

      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', categoryId)
        .select()
        .single();

      if (error) {
        throw new ApiError('Failed to update category', 500, error.message);
      }

      return data as Category;
    } catch (error) {
      console.error('Error updating category:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to update category', 500, error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Deletes a category (admin only)
   * Note: This should be used carefully as it will affect sponsorships and transactions
   * 
   * @param categoryId Category ID
   * @returns Success message
   */
  static async deleteCategory(categoryId: string): Promise<{ message: string }> {
    try {
      // Check if category exists
      const { data: existingCategory, error: existingError } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (existingError || !existingCategory) {
        throw new ApiError('Category not found', 404);
      }

      // Check if category is in use
      const { data: usageData, error: usageError } = await supabase.rpc('check_category_usage', {
        category_id: categoryId,
      });

      if (usageError) {
        throw new ApiError('Failed to check category usage', 500, usageError.message);
      }

      if (usageData && usageData.is_used) {
        throw new ApiError(
          'Cannot delete category as it is in use by sponsorships or transactions',
          400
        );
      }

      // Delete category
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        throw new ApiError('Failed to delete category', 500, error.message);
      }

      return { message: 'Category deleted successfully' };
    } catch (error) {
      console.error('Error deleting category:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to delete category', 500, error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Gets categories assigned to a vendor
   * 
   * @param vendorUserId Vendor's user ID
   * @returns Array of categories
   */
  static async getVendorCategories(vendorUserId: string): Promise<Category[]> {
    try {
      // Get vendor's category IDs
      const { data: vendorCategories, error: vendorCategoryError } = await supabase
        .from('vendor_categories')
        .select('category_id')
        .eq('vendor_id', vendorUserId);

      if (vendorCategoryError) {
        throw new ApiError('Failed to fetch vendor categories', 500, vendorCategoryError.message);
      }

      if (!vendorCategories || vendorCategories.length === 0) {
        return [];
      }

      // Get category details
      const categoryIds = vendorCategories.map(vc => vc.category_id);
      const { data: categories, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .in('id', categoryIds)
        .order('name');

      if (categoryError) {
        throw new ApiError('Failed to fetch category details', 500, categoryError.message);
      }

      return categories as Category[];
    } catch (error) {
      console.error('Error fetching vendor categories:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to fetch vendor categories', 500, error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Updates a vendor's assigned categories
   * 
   * @param vendorUserId Vendor's user ID
   * @param categoryIds Array of category IDs to assign
   * @returns Array of assigned categories
   */
  static async updateVendorCategories(
    vendorUserId: string,
    categoryIds: string[]
  ): Promise<Category[]> {
    try {
      // Verify that all categories exist
      if (categoryIds.length > 0) {
        const { data: categories, error: categoryError } = await supabase
          .from('categories')
          .select('id')
          .in('id', categoryIds);

        if (categoryError) {
          throw new ApiError('Failed to verify categories', 500, categoryError.message);
        }

        if (!categories || categories.length !== categoryIds.length) {
          throw new ApiError('One or more categories do not exist', 400);
        }
      }

      // Delete existing vendor-category relationships
      await supabase
        .from('vendor_categories')
        .delete()
        .eq('vendor_id', vendorUserId);

      // If no categories, we're done
      if (categoryIds.length === 0) {
        return [];
      }

      // Create new vendor-category relationships
      const vendorCategoryData = categoryIds.map(categoryId => ({
        vendor_id: vendorUserId,
        category_id: categoryId,
      }));

      const { error } = await supabase.from('vendor_categories').insert(vendorCategoryData);

      if (error) {
        throw new ApiError('Failed to update vendor categories', 500, error.message);
      }

      // Get updated categories
      return this.getVendorCategories(vendorUserId);
    } catch (error) {
      console.error('Error updating vendor categories:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to update vendor categories', 500, error instanceof Error ? error.message : undefined);
    }
  }
} 