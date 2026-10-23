import { z } from 'zod';
import {
  limitSchema,
  pageSchema,
  sortOrderSchema,
  uuidSchema,
} from '../common/common.schemas';

export const createProjectSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(120, 'Title must be at most 120 characters'),
    description: z
      .string()
      .trim()
      .max(5000, 'Description must be at most 5000 characters')
      .nullish(),
  })
  .strict();

export const updateProjectSchema = createProjectSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: 'At least one field must be provided',
  });

export const projectParamsSchema = z
  .object({
    projectId: uuidSchema('projectId'),
  })
  .strict();

export const listProjectsQuerySchema = z
  .object({
    search: z
      .string()
      .trim()
      .min(1, 'search must not be empty')
      .max(120, 'search must be at most 120 characters')
      .optional(),
    page: pageSchema,
    limit: limitSchema,
    sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('createdAt'),
    sortOrder: sortOrderSchema,
  })
  .strict();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
export type ProjectParams = z.infer<typeof projectParamsSchema>;
