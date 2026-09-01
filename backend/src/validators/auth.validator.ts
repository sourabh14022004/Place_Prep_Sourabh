/**
 * backend/src/validators/auth.validator.ts
 * Zod schemas for all auth endpoints — used both server-side and can be imported by frontend forms.
 */

import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters'),
});

export const changePasswordSchema = z
  .object({
    oldPassword: z
      .string({ required_error: 'Current password is required' })
      .min(6, 'Password must be at least 6 characters'),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'New password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'New password must contain uppercase, lowercase, and a number'
      ),
    confirmPassword: z.string({ required_error: 'Please confirm your new password' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const createUserSchema = z.object({
  email: z.string().email('Invalid email').toLowerCase().trim(),
  role: z.enum(['student', 'faculty', 'admin']),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').trim(),
  // Optional onboarding fields for students
  batch: z.string().optional(),
  branch: z.string().optional(),
  year: z.enum(['1st', '2nd', '3rd', '4th']).optional(),
  // Optional faculty fields
  subject: z.string().optional(),
  stream: z.string().optional(),
  initials: z.string().max(3).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
