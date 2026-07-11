import { z } from 'zod';

const name = z
  .string({ error: 'Name is required.' })
  .trim()
  .min(1, 'Name is required.')
  .max(100, 'Name must be 100 characters or fewer.');

const email = z
  .string({ error: 'A valid email is required.' })
  .trim()
  .toLowerCase()
  .pipe(z.email('A valid email is required.'));

const password = (label: string) =>
  z
    .string({ error: `${label} is required.` })
    .min(8, `${label} must be at least 8 characters.`)
    .regex(/\d/, `${label} must contain at least one number.`);

export const createStudentSchema = z.object({
  name,
  email,
  temporaryPassword: password('Temporary password'),
});

export const updateStudentSchema = z
  .object({
    name: name.optional(),
    email: email.optional(),
  })
  .refine((data) => data.name !== undefined || data.email !== undefined, {
    message: 'At least one field (name or email) must be provided.',
  });

export const resetStudentPasswordSchema = z.object({
  newTemporaryPassword: password('New temporary password'),
});

export const toggleStudentStatusSchema = z.object({
  isActive: z.boolean({ error: 'isActive must be a boolean.' }),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type ResetStudentPasswordInput = z.infer<typeof resetStudentPasswordSchema>;
export type ToggleStudentStatusInput = z.infer<typeof toggleStudentStatusSchema>;
