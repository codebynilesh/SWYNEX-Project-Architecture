import { z } from 'zod';
import {
  limitSchema,
  pageSchema,
  sortOrderSchema,
  uuidSchema,
} from '../common/common.schemas';

export const taskStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']);

const dueDateSchema = z
  .union([
    z.iso.date(),
    z.iso.datetime({ offset: true }),
  ], {
    error: 'dueDate must be an ISO date (YYYY-MM-DD) or ISO datetime',
  })
  .transform((value) => new Date(value));

export const createTaskSchema = z
  .object({
    projectId: uuidSchema('projectId'),
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(200, 'Title must be at most 200 characters'),
    description: z
      .string()
      .trim()
      .max(5000, 'Description must be at most 5000 characters')
      .nullish(),
    status: taskStatusSchema.optional(),
    dueDate: dueDateSchema.nullish(),
    assignedTo: uuidSchema('assignedTo').nullish(),
  })
  .strict();

export const updateTaskSchema = createTaskSchema
  .omit({ projectId: true })
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: 'At least one field must be provided',
  });

export const taskParamsSchema = z
  .object({
    taskId: uuidSchema('taskId'),
  })
  .strict();

export const listTasksQuerySchema = z
  .object({
    status: taskStatusSchema.optional(),
    assignedTo: uuidSchema('assignedTo').optional(),
    search: z
      .string()
      .trim()
      .min(1, 'search must not be empty')
      .max(200, 'search must be at most 200 characters')
      .optional(),
    page: pageSchema,
    limit: limitSchema,
    sortBy: z
      .enum(['createdAt', 'updatedAt', 'dueDate', 'title'])
      .default('createdAt'),
    sortOrder: sortOrderSchema,
  })
  .strict();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type TaskParams = z.infer<typeof taskParamsSchema>;
