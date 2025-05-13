import { z } from 'zod';
import type { UserRole } from '../../common/types/db';

const userRoles: [UserRole, ...UserRole[]] = ['sponsor', 'vendor', 'beneficiary'];

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  role: z.enum(userRoles),
  display_name: z.string().min(2, 'Display name must be at least 2 characters long').optional(),
  phone_number: z.string().optional(), // Add more specific phone validation if needed
});

export type SignupPayload = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type LoginPayload = z.infer<typeof loginSchema>; 