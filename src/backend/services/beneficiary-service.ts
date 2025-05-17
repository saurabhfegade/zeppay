import { SupabaseClient } from '@supabase/supabase-js';
import { Beneficiary as BeneficiaryTableRow } from '../../common/types/database.types';
import { ApiError } from '../lib/apiError';
import { AddSponsorBeneficiaryPayload } from '../validation/beneficiary-validation';

// Define a minimal structure for the tables used in this service
// Ideally, this would come from auto-generated Supabase types

// Structure for sponsor_beneficiaries table
interface SponsorBeneficiaryLink {
  sponsor_user_id: string;
  beneficiary_id: string;
  // created_at?: string; // Assuming it's auto-generated
}

// Minimal Database type definition for this service's scope
interface ServiceScopedDatabase {
  public: {
    Tables: {
      beneficiaries: {
        Row: BeneficiaryTableRow;
        Insert: {
          phone_number_for_telegram: string;
          display_name?: string | null;
          // id, created_at, updated_at are typically auto-generated
        };
        Update: {
          display_name?: string | null;
          phone_number_for_telegram?: string;
          // updated_at is typically auto-updated
        };
      };
      sponsor_beneficiaries: {
        Row: SponsorBeneficiaryLink;
        Insert: SponsorBeneficiaryLink; // For upsert, all fields are usually required or have defaults
        Update: Partial<SponsorBeneficiaryLink>; // Upsert might also use this
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export class BeneficiaryService {
  private supabase: SupabaseClient<ServiceScopedDatabase>;

  constructor(supabase: SupabaseClient<ServiceScopedDatabase>) {
    this.supabase = supabase;
  }

  async getBeneficiariesForSponsor(sponsorUserId: string): Promise<BeneficiaryTableRow[]> {
    const { data: sponsorBeneficiaryLinks, error: linkError } = await this.supabase
      .from('sponsor_beneficiaries')
      .select('beneficiary_id')
      .eq('sponsor_user_id', sponsorUserId)
      .returns<SponsorBeneficiaryLink[]>();

    if (linkError) {
      console.error('Error fetching sponsor-beneficiary links:', linkError);
      throw new ApiError('Could not fetch beneficiary links.', 500);
    }

    if (!sponsorBeneficiaryLinks || sponsorBeneficiaryLinks.length === 0) {
      return [];
    }

    const beneficiaryIds = sponsorBeneficiaryLinks.map(link => link.beneficiary_id);

    const { data: beneficiaries, error: beneficiariesError } = await this.supabase
      .from('beneficiaries')
      .select('*') // Selects all columns defined in BeneficiaryTableRow
      .in('id', beneficiaryIds)
      .returns<BeneficiaryTableRow[]>();

    if (beneficiariesError) {
      console.error('Error fetching beneficiaries:', beneficiariesError);
      throw new ApiError('Could not fetch beneficiaries.', 500);
    }

    return beneficiaries || [];
  }

  async addBeneficiaryToSponsor(
    sponsorUserId: string,
    payload: AddSponsorBeneficiaryPayload
  ): Promise<BeneficiaryTableRow> {
    const { 
        data: existingBeneficiary, 
        error: findError 
    } = await this.supabase
      .from('beneficiaries')
      .select('*')
      .eq('phone_number_for_telegram', payload.phone_number_for_telegram)
      .maybeSingle<BeneficiaryTableRow>();

    if (findError && findError.code !== 'PGRST116') { // PGRST116: "Exactly one row is expected, but 0 or more than 1 were found" -> not an error for maybeSingle
      console.error('Error finding beneficiary:', findError);
      throw new ApiError('Could not find beneficiary.', 500);
    }

    let beneficiary: BeneficiaryTableRow;

    if (existingBeneficiary) {
      beneficiary = existingBeneficiary;
      // Only update display_name if it's provided and different
      if (payload.display_name && payload.display_name !== beneficiary.display_name) {
        const { data: updatedBeneficiary, error: updateError } = await this.supabase
          .from('beneficiaries')
          .update({ display_name: payload.display_name }) // Update only specific fields
          .eq('id', beneficiary.id)
          .select() // Selects all columns defined in BeneficiaryTableRow
          .single<BeneficiaryTableRow>();
          
        if (updateError) {
          console.error('Error updating beneficiary display name:', updateError);
          // Consider how to handle this error; re-throwing might be appropriate
          // throw new ApiError('Could not update beneficiary display name.', 500); 
        } else if (updatedBeneficiary) {
          beneficiary = updatedBeneficiary;
        }
      }
    } else {
      // Create new beneficiary
      const insertPayload: ServiceScopedDatabase['public']['Tables']['beneficiaries']['Insert'] = {
        phone_number_for_telegram: payload.phone_number_for_telegram,
      };
      if (payload.display_name) {
        insertPayload.display_name = payload.display_name;
      }
      const { data: { session } } = await this.supabase.auth.getSession();
      console.log('[BeneficiaryService] Session before insert:', session);
      const { data: newBeneficiary, error: createError } = await this.supabase
        .from('beneficiaries')
        .insert(insertPayload)
        .select() // Selects all columns defined in BeneficiaryTableRow
        .single<BeneficiaryTableRow>();

      if (createError || !newBeneficiary) {
        console.error('Error creating beneficiary:', createError);
        throw new ApiError('Could not create beneficiary.', 500);
      }
      beneficiary = newBeneficiary;
    }

    // Link beneficiary to sponsor
    const linkPayload: ServiceScopedDatabase['public']['Tables']['sponsor_beneficiaries']['Insert'] = {
      sponsor_user_id: sponsorUserId,
      beneficiary_id: beneficiary.id, // beneficiary.id will exist for both existing and new
    };
    const { error: linkError } = await this.supabase
      .from('sponsor_beneficiaries')
      .upsert(linkPayload); // Upsert implies it might insert or update based on PK

    if (linkError) {
      console.error('Error linking beneficiary to sponsor:', linkError);
      throw new ApiError('Could not link beneficiary to sponsor.', 500);
    }

    return beneficiary;
  }
} 