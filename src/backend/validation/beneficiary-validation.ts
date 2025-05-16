import { z } from 'zod';

export const addSponsorBeneficiarySchema = z.object({
  display_name: z.string().min(1, "Display name is required").max(255, "Display name too long"),
  phone_number_for_telegram: z.string()
    .min(1, "Phone number is required")
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format (e.g., +1234567890). It should be E.164 format.")
    .max(20, "Phone number too long"),
});

export type AddSponsorBeneficiaryPayload = z.infer<typeof addSponsorBeneficiarySchema>; 