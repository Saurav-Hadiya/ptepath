import { z } from 'zod';

const emptyToUndefined = (v: unknown): unknown =>
  v === '' || v === null || v === undefined ? undefined : v;

const titleRequired = z.preprocess(
  emptyToUndefined,
  z
    .string({ error: 'title is required.' })
    .trim()
    .min(1, 'title cannot be empty.')
    .max(200, 'title is too long.')
);

const titleOptional = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1, 'title cannot be empty.').max(200, 'title is too long.').optional()
);

const descriptionRequired = z.preprocess(
  emptyToUndefined,
  z
    .string({ error: 'description is required.' })
    .trim()
    .min(1, 'description cannot be empty.')
    .max(1000, 'description is too long.')
);

const descriptionOptional = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .trim()
    .min(1, 'description cannot be empty.')
    .max(1000, 'description is too long.')
    .optional()
);

/** Validates metadata fields only — file presence is checked in the controller. */
export const createResourceSchema = z.object({
  title: titleRequired,
  description: descriptionRequired,
});

export const updateResourceSchema = z
  .object({
    title: titleOptional,
    description: descriptionOptional,
  })
  .refine((data) => data.title !== undefined || data.description !== undefined, {
    message: 'At least one field must be provided to update.',
  });

export const toggleResourceStatusSchema = z.object({
  isActive: z.boolean({ error: 'isActive must be a boolean (true or false).' }),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
