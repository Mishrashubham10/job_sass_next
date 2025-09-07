import { experienceLabels } from '@/drizzle/schema';
import z from 'zod';

export const jobInfoSchema = z.object({
  name: z.string().min(1, 'Required'),
  title: z.string().min(1).nullable(),
  experienceLabel: z.enum(experienceLabels),
  description: z.string().min(1, 'Required'),
});