/**
 * backend/src/validators/doubt.validator.ts
 */
import { z } from 'zod';

export const createDoubtSchema = z.object({
  subject: z
    .string({ required_error: 'Subject is required' })
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject cannot exceed 200 characters')
    .trim(),
  body: z
    .string({ required_error: 'Doubt description is required' })
    .min(20, 'Please provide at least 20 characters of description')
    .trim(),
  tag: z.enum(
    ['DSA', 'System Design', 'LLD', 'HR', 'General', 'Web Development', 'Aptitude'],
    { required_error: 'Please select a topic tag' }
  ),
  /** Optional: assign to a specific faculty member */
  assignedFacultyId: z.string().optional(),
});

export const addReplySchema = z.object({
  body: z
    .string({ required_error: 'Reply cannot be empty' })
    .min(1, 'Reply cannot be empty')
    .trim(),
});

export type CreateDoubtInput = z.infer<typeof createDoubtSchema>;
export type AddReplyInput = z.infer<typeof addReplySchema>;
