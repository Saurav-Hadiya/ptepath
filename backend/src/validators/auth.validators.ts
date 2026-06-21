import { z } from 'zod';

/** Password policy for auth flows: min 8 characters, at least one number. */
const strongPassword = (label: string) =>
  z
    .string({ error: `${label} is required.` })
    .min(8, 'Password must be at least 8 characters')
    .regex(/\d/, 'Password must contain at least one number');

const confirmPassword = z.string({ error: 'Confirm password is required.' }).min(1, 'Confirm password is required.');

const matchPasswords = <T extends { newPassword: string; confirmPassword: string }>(data: T) =>
  data.newPassword === data.confirmPassword;

export const loginSchema = z.object({
  email: z
    .string({ error: 'Email and password are required' })
    .trim()
    .toLowerCase()
    .min(1, 'Email and password are required'),
  password: z.string({ error: 'Email and password are required' }).min(1, 'Email and password are required'),
});

export const changePasswordSchema = z
  .object({
    newPassword: strongPassword('New password'),
    confirmPassword,
  })
  .refine(matchPasswords, { message: 'Passwords do not match', path: ['confirmPassword'] });

export const resetPasswordSchema = z
  .object({
    userId: z.string({ error: 'All fields are required' }).trim().min(1, 'All fields are required'),
    token: z.string({ error: 'All fields are required' }).trim().min(1, 'All fields are required'),
    newPassword: strongPassword('New password'),
    confirmPassword,
  })
  .refine(matchPasswords, { message: 'Passwords do not match', path: ['confirmPassword'] });

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string({ error: 'All fields are required' }).min(1, 'All fields are required'),
    newPassword: strongPassword('New password'),
    confirmPassword,
  })
  .refine(matchPasswords, { message: 'Passwords do not match', path: ['confirmPassword'] });

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
