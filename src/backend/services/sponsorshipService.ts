import { supabase } from '../lib/db';
import { ApiError } from '../lib/apiError';
import { Beneficiary, Category, Sponsorship, SponsorshipAllowedCategory, SponsorshipStatus } from '../../common/types/database.types';
import { WalletService } from './walletService';
import { TelegramService } from './telegramService';
import { v4 as uuidv4 } from 'uuid';

export class SponsorshipService {
  /**
   * Creates a new sponsorship from a sponsor to a beneficiary
   * 
   * @param sponsorUserId Sponsor's user ID
   * @param beneficiaryPhoneNumber Beneficiary's phone number
   * @param amountUsdc Amount of USDC to allocate
   * @param categoryIds Array of category IDs allowed for this sponsorship
   * @param notes Optional notes for the sponsorship
   * @param expiresAt Optional expiration date
   * @returns The created sponsorship with beneficiary and category details
   */
  static async createSponsorship(
    sponsorUserId: string,
    beneficiaryPhoneNumber: string,
    amountUsdc: number,
    categoryIds: string[],
    notes?: string,
    expiresAt?: Date
  ) {
    try {
      // Get sponsor's WaaS wallet
      const sponsorWallet = await WalletService.getSponsorWaasWallet(sponsorUserId);
      if (!sponsorWallet) {
        throw new ApiError('Sponsor wallet not found', 404);
      }

      // Refresh wallet balance to ensure sufficient funds
      const updatedWallet = await WalletService.refreshWaasWalletBalance(sponsorWallet.id);
      if (updatedWallet.usdc_balance < amountUsdc) {
        throw new ApiError('Insufficient USDC balance in sponsor wallet', 400);
      }

      // Find or create beneficiary
      const beneficiary = await this.findOrCreateBeneficiary(beneficiaryPhoneNumber);

      // Verify all category IDs exist
      await this.verifyCategoriesExist(categoryIds);

      // Create sponsorship in transaction
      const sponsorship = await this.createSponsorshipRecord(
        sponsorUserId,
        sponsorWallet.id,
        beneficiary.id,
        amountUsdc,
        categoryIds,
        notes,
        expiresAt
      );

      // Fetch categories for response
      const categories = await this.getCategoriesByIds(categoryIds);

      // Get sponsor details for notification
      const { data: sponsor } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', sponsorUserId)
        .single();

      // Send notification to beneficiary via Telegram
      await TelegramService.sendSponsorshipNotification(
        beneficiaryPhoneNumber,
        amountUsdc,
        sponsor?.display_name || 'Sponsor',
        categories.map(c => c.name)
      );

      // Return sponsorship with beneficiary and category details
      return {
        ...sponsorship,
        beneficiary,
        categories,
      };
    } catch (error) {
      console.error('Error creating sponsorship:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to create sponsorship', 500, error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Gets sponsorships created by a sponsor
   * 
   * @param sponsorUserId Sponsor's user ID
   * @returns Array of sponsorships with beneficiary and category details
   */
  static async getSponsorshipsBySponsor(sponsorUserId: string) {
    try {
      // Get sponsorships
      const { data: sponsorships, error } = await supabase
        .from('sponsorships')
        .select('*')
        .eq('sponsor_user_id', sponsorUserId);

      if (error) {
        throw new ApiError('Failed to fetch sponsorships', 500, error.message);
      }

      if (!sponsorships || sponsorships.length === 0) {
        return [];
      }

      // Get beneficiaries and categories for each sponsorship
      const enrichedSponsorships = await Promise.all(
        sponsorships.map(async (sponsorship) => {
          // Get beneficiary
          const { data: beneficiary } = await supabase
            .from('beneficiaries')
            .select('*')
            .eq('id', sponsorship.beneficiary_id)
            .single();

          // Get category IDs for this sponsorship
          const { data: allowedCategories } = await supabase
            .from('sponsorship_allowed_categories')
            .select('category_id')
            .eq('sponsorship_id', sponsorship.id);

          let categories: Category[] = [];
          if (allowedCategories && allowedCategories.length > 0) {
            const categoryIds = allowedCategories.map(ac => ac.category_id);
            categories = await this.getCategoriesByIds(categoryIds);
          }

          return {
            ...sponsorship,
            beneficiary,
            categories,
          };
        })
      );

      return enrichedSponsorships;
    } catch (error) {
      console.error('Error fetching sponsorships:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to fetch sponsorships', 500, error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Gets sponsorships available to a beneficiary with available balance and matching the requested category
   * 
   * @param beneficiaryId Beneficiary's ID
   * @param categoryId Optional category ID to filter by
   * @returns Array of sponsorships with sponsor and category details
   */
  static async getActiveSponsorshipsForBeneficiary(beneficiaryId: string, categoryId?: string) {
    try {
      console.log('Getting active sponsorships for beneficiary:', beneficiaryId);
      
      // Get active sponsorships with remaining balance
      let query = supabase
        .from('sponsorships')
        .select('*')
        .eq('beneficiary_id', beneficiaryId)
        .eq('status', 'active')
        .gt('remaining_usdc', 0);

      // If expires_at is set, only get non-expired sponsorships
      const currentDate = new Date().toISOString();
      query = query.or(`expires_at.is.null,expires_at.gt.${currentDate}`);
      console.log('Querying sponsorships with expiry condition:', currentDate);

      const { data: sponsorships, error } = await query;

      if (error) {
        console.error('Error fetching sponsorships:', error);
        throw new ApiError('Failed to fetch sponsorships', 500, error.message);
      }

      console.log('Initial sponsorships found:', sponsorships?.length || 0);
      console.log('Sponsorships data:', JSON.stringify(sponsorships, null, 2));

      if (!sponsorships || sponsorships.length === 0) {
        return [];
      }

      // If categoryId is provided, filter sponsorships that allow this category
      let filteredSponsorships = sponsorships;
      if (categoryId) {
        console.log('Filtering sponsorships by category:', categoryId);
        const sponsorshipIds = sponsorships.map(s => s.id);
        
        // Get sponsorships that allow this category
        const { data: allowedCategorySponsorships, error: categoryError } = await supabase
          .from('sponsorship_allowed_categories')
          .select('sponsorship_id')
          .eq('category_id', categoryId)
          .in('sponsorship_id', sponsorshipIds);

        if (categoryError) {
          console.error('Error fetching allowed categories:', categoryError);
        }
        
        if (!allowedCategorySponsorships || allowedCategorySponsorships.length === 0) {
          console.log('No sponsorships found for category:', categoryId);
          return [];
        }
        
        const validSponsorshipIds = allowedCategorySponsorships.map(acs => acs.sponsorship_id);
        filteredSponsorships = sponsorships.filter(s => validSponsorshipIds.includes(s.id));
        console.log('Sponsorships after category filtering:', filteredSponsorships.length);
      }

      // Get sponsor details and categories for each sponsorship
      console.log('Enriching sponsorships with sponsor and category details...');
      const enrichedSponsorships = await Promise.all(
        filteredSponsorships.map(async (sponsorship) => {
          // Get sponsor
          const { data: sponsor, error: sponsorError } = await supabase
            .from('users')
            .select('id, display_name, email')
            .eq('id', sponsorship.sponsor_user_id)
            .single();

          if (sponsorError) {
            console.error('Error fetching sponsor details:', sponsorError);
          }

          // Get category IDs for this sponsorship
          const { data: allowedCategories, error: categoriesError } = await supabase
            .from('sponsorship_allowed_categories')
            .select('category_id')
            .eq('sponsorship_id', sponsorship.id);

          if (categoriesError) {
            console.error('Error fetching allowed categories:', categoriesError);
          }

          let categories: Category[] = [];
          if (allowedCategories && allowedCategories.length > 0) {
            const categoryIds = allowedCategories.map(ac => ac.category_id);
            console.log('Fetching categories for sponsorship:', sponsorship.id, 'Categories:', categoryIds);
            categories = await this.getCategoriesByIds(categoryIds);
          }

          const enrichedSponsorship = {
            ...sponsorship,
            sponsor,
            categories,
          };
          console.log('Enriched sponsorship:', JSON.stringify(enrichedSponsorship, null, 2));

          return enrichedSponsorship;
        })
      );

      console.log('Total enriched sponsorships:', enrichedSponsorships.length);
      return enrichedSponsorships;
    } catch (error) {
      console.error('Error fetching beneficiary sponsorships:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to fetch beneficiary sponsorships', 500, error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Updates a sponsorship's remaining balance after a transaction
   * 
   * @param sponsorshipId Sponsorship ID
   * @param amountUsdc Amount of USDC used in transaction
   * @returns The updated sponsorship
   */
  static async updateSponsorshipBalance(sponsorshipId: string, amountUsdc: number) {
    try {
      // Get current sponsorship
      const { data: sponsorship, error } = await supabase
        .from('sponsorships')
        .select('*')
        .eq('id', sponsorshipId)
        .single();

      if (error || !sponsorship) {
        throw new ApiError('Sponsorship not found', 404, error?.message);
      }

      if (sponsorship.status !== 'active') {
        throw new ApiError('Sponsorship is not active', 400);
      }

      if (sponsorship.remaining_usdc < amountUsdc) {
        throw new ApiError('Insufficient sponsorship balance', 400);
      }

      // Calculate new balance
      const newBalance = sponsorship.remaining_usdc - amountUsdc;
      let newStatus: SponsorshipStatus = 'active';
      
      // If balance reaches zero, mark as depleted
      if (newBalance <= 0) {
        newStatus = 'depleted';
      }

      // Update sponsorship
      const { data: updatedSponsorship, error: updateError } = await supabase
        .from('sponsorships')
        .update({
          remaining_usdc: newBalance,
          status: newStatus,
        })
        .eq('id', sponsorshipId)
        .select()
        .single();

      if (updateError) {
        throw new ApiError('Failed to update sponsorship balance', 500, updateError.message);
      }

      return updatedSponsorship;
    } catch (error) {
      console.error('Error updating sponsorship balance:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to update sponsorship balance', 500, error instanceof Error ? error.message : undefined);
    }
  }

  /**
   * Cancels a sponsorship
   * 
   * @param sponsorshipId Sponsorship ID
   * @param sponsorUserId Sponsor's user ID (for verification)
   * @returns The cancelled sponsorship
   */
  static async cancelSponsorship(sponsorshipId: string, sponsorUserId: string) {
    try {
      // Get current sponsorship and verify sponsor
      const { data: sponsorship, error } = await supabase
        .from('sponsorships')
        .select('*')
        .eq('id', sponsorshipId)
        .eq('sponsor_user_id', sponsorUserId)
        .single();

      if (error || !sponsorship) {
        throw new ApiError('Sponsorship not found or you do not have permission to cancel it', 404, error?.message);
      }

      if (sponsorship.status === 'cancelled') {
        return sponsorship; // Already cancelled
      }

      // Update sponsorship
      const { data: updatedSponsorship, error: updateError } = await supabase
        .from('sponsorships')
        .update({
          status: 'cancelled',
        })
        .eq('id', sponsorshipId)
        .select()
        .single();

      if (updateError) {
        throw new ApiError('Failed to cancel sponsorship', 500, updateError.message);
      }

      return updatedSponsorship;
    } catch (error) {
      console.error('Error cancelling sponsorship:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to cancel sponsorship', 500, error instanceof Error ? error.message : undefined);
    }
  }

  // Helper Methods

  /**
   * Finds a beneficiary by phone number or creates a new one
   * 
   * @param phoneNumber Beneficiary's phone number
   * @returns The found or created beneficiary
   */
  private static async findOrCreateBeneficiary(phoneNumber: string): Promise<Beneficiary> {
    // Try to find existing beneficiary
    const { data: existingBeneficiary } = await supabase
      .from('beneficiaries')
      .select('*')
      .eq('phone_number_for_telegram', phoneNumber)
      .single();

    if (existingBeneficiary) {
      return existingBeneficiary as Beneficiary;
    }

    // Create new beneficiary
    const beneficiaryData = {
      id: uuidv4(),
      phone_number_for_telegram: phoneNumber,
      created_at: new Date(),
    };

    const { data, error } = await supabase
      .from('beneficiaries')
      .insert(beneficiaryData)
      .select()
      .single();

    if (error) {
      throw new ApiError('Failed to create beneficiary', 500, error.message);
    }

    return data as Beneficiary;
  }

  /**
   * Verifies that all category IDs exist
   * 
   * @param categoryIds Array of category IDs
   * @throws ApiError if any category is not found
   */
  private static async verifyCategoriesExist(categoryIds: string[]) {
    if (!categoryIds.length) {
      throw new ApiError('At least one category must be specified', 400);
    }

    const { data, error } = await supabase
      .from('categories')
      .select('id')
      .in('id', categoryIds);

    if (error) {
      throw new ApiError('Failed to verify categories', 500, error.message);
    }

    if (!data || data.length !== categoryIds.length) {
      throw new ApiError('One or more categories do not exist', 400);
    }
  }

  /**
   * Creates a sponsorship record and its allowed categories
   * 
   * @param sponsorUserId Sponsor's user ID
   * @param sponsorWaasWalletId Sponsor's WaaS wallet ID
   * @param beneficiaryId Beneficiary's ID
   * @param amountUsdc Amount of USDC to allocate
   * @param categoryIds Array of category IDs allowed for this sponsorship
   * @param notes Optional notes for the sponsorship
   * @param expiresAt Optional expiration date
   * @returns The created sponsorship
   */
  private static async createSponsorshipRecord(
    sponsorUserId: string,
    sponsorWaasWalletId: string,
    beneficiaryId: string,
    amountUsdc: number,
    categoryIds: string[],
    notes?: string,
    expiresAt?: Date
  ): Promise<Sponsorship> {
    // Create sponsorship in a transaction
    const sponsorshipId = uuidv4();
    const now = new Date();

    // Create main sponsorship record
    const sponsorshipData = {
      id: sponsorshipId,
      sponsor_user_id: sponsorUserId,
      sponsor_waas_wallet_id: sponsorWaasWalletId,
      beneficiary_id: beneficiaryId,
      total_allocated_usdc: amountUsdc,
      remaining_usdc: amountUsdc,
      status: 'active' as SponsorshipStatus,
      notes,
      created_at: now,
      expires_at: expiresAt,
    };

    const { data: sponsorship, error } = await supabase
      .from('sponsorships')
      .insert(sponsorshipData)
      .select()
      .single();

    if (error) {
      throw new ApiError('Failed to create sponsorship', 500, error.message);
    }

    // Create sponsorship allowed categories
    const categoryLinks = categoryIds.map(categoryId => ({
      sponsorship_id: sponsorshipId,
      category_id: categoryId,
    }));

    const { error: categoriesError } = await supabase
      .from('sponsorship_allowed_categories')
      .insert(categoryLinks);

    if (categoriesError) {
      // If category links fail, attempt to delete the sponsorship
      await supabase.from('sponsorships').delete().eq('id', sponsorshipId);
      throw new ApiError('Failed to link categories to sponsorship', 500, categoriesError.message);
    }

    return sponsorship as Sponsorship;
  }

  /**
   * Gets categories by their IDs
   * 
   * @param categoryIds Array of category IDs
   * @returns Array of categories
   */
  private static async getCategoriesByIds(categoryIds: string[]): Promise<Category[]> {
    if (!categoryIds.length) {
      return [];
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .in('id', categoryIds);

    if (error) {
      throw new ApiError('Failed to fetch categories', 500, error.message);
    }

    return data as Category[];
  }
} 