/**
 * backend/src/validators/experience.validator.ts
 */
import { z } from 'zod';

const experienceRoundSchema = z.object({
  roundNumber: z.number().int().min(1),
  type: z.string().min(1, 'Round type is required'),
  topics: z.array(z.string()).default([]),
  description: z.string().min(10, 'Round description must be at least 10 characters').trim(),
  cleared: z.boolean(),
});

export const submitExperienceSchema = z.object({
  companySlug: z.string({ required_error: 'Company is required' }).min(1),
  role: z.string({ required_error: 'Role applied for is required' }).min(2).trim(),
  interviewDate: z.string({ required_error: 'Interview date is required' }),
  outcome: z.enum(['offer', 'rejected', 'waiting'], {
    required_error: 'Please select an outcome',
  }),
  overallDifficulty: z.enum(['Easy', 'Medium', 'Hard'], {
    required_error: 'Please select overall difficulty',
  }),
  roundsCount: z.number().int().min(1).max(10),
  rounds: z
    .array(experienceRoundSchema)
    .min(1, 'Please add at least one round'),
  experienceText: z
    .string({ required_error: 'Experience description is required' })
    .min(50, 'Please share at least 50 characters about your experience')
    .trim(),
  tips: z.string().max(1000).optional(),
});

export type SubmitExperienceInput = z.infer<typeof submitExperienceSchema>;
