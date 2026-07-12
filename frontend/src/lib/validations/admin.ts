import { z } from 'zod';

const temporaryPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/\d/, 'Password must contain at least one number');

export const createStudentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  temporaryPassword: temporaryPasswordSchema,
});

export const updateStudentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
});

export const resetPasswordAdminSchema = z.object({
  temporaryPassword: temporaryPasswordSchema,
});

export const adminChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/\d/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ─── Speaking Questions ──────────────────────────────────────────────────────

const TEXT_CONTENT_SPEAKING_TYPES = [
  'read_aloud',
  'repeat_sentence',
  'respond_situation',
  'answer_short',
];

export const adminSpeakingFormSchema = z
  .object({
    type: z.enum(['read_aloud', 'repeat_sentence', 'describe_image', 'respond_situation', 'answer_short']),
    content: z.string().trim().optional(),
    acceptedAnswers: z.array(z.string().trim().min(1, 'Answer cannot be empty')).optional(),
    imageFile: z.instanceof(File).nullable().optional(),
    existingImageUrl: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (TEXT_CONTENT_SPEAKING_TYPES.includes(data.type) && !data.content) {
      ctx.addIssue({ code: 'custom', message: 'Content is required for this question type.', path: ['content'] });
    }
    if (data.type === 'describe_image' && !data.imageFile && !data.existingImageUrl) {
      ctx.addIssue({ code: 'custom', message: 'An image is required.', path: ['imageFile'] });
    }
    if (data.type === 'answer_short') {
      const answers = (data.acceptedAnswers ?? []).filter((a) => a.trim().length > 0);
      if (answers.length < 1) {
        ctx.addIssue({
          code: 'custom',
          message: 'At least one accepted answer is required.',
          path: ['acceptedAnswers'],
        });
      }
    }
  });

export type AdminSpeakingFormValues = z.infer<typeof adminSpeakingFormSchema>;

// ─── Writing Questions ───────────────────────────────────────────────────────

export const adminWritingFormSchema = z.object({
  type: z.enum(['summarise_written_text', 'write_essay']),
  content: z.string().trim().min(1, 'Content is required'),
});

export type AdminWritingFormValues = z.infer<typeof adminWritingFormSchema>;

// ─── Mock Test Templates ─────────────────────────────────────────────────────

export const adminMockTestFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Template name is required'),
    description: z.string().trim().min(1, 'Description is required'),
    totalTime: z.coerce.number().int('Must be a whole number').min(10, 'Must be at least 10 minutes'),
    counts: z.record(z.string(), z.coerce.number().int().min(0)),
  })
  .superRefine((data, ctx) => {
    const total = Object.values(data.counts).reduce((sum, n) => sum + n, 0);
    if (total < 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'At least one question rule is required.',
        path: ['counts'],
      });
    }
  });

export type AdminMockTestFormValues = z.infer<typeof adminMockTestFormSchema>;

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type ResetPasswordAdminInput = z.infer<typeof resetPasswordAdminSchema>;
export type AdminChangePasswordInput = z.infer<typeof adminChangePasswordSchema>;
