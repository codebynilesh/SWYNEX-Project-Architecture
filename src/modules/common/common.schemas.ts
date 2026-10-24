import { z } from 'zod';

export const pageSchema = z.coerce
  .number()
  .int('page must be an integer')
  .min(1, 'page must be at least 1')
  .default(1);

export const limitSchema = z.coerce
  .number()
  .int('limit must be an integer')
  .min(1, 'limit must be at least 1')
  .max(100, 'limit must be at most 100')
  .default(20);

export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc');

export function uuidSchema(fieldName: string) {
  return z.uuid(`${fieldName} must be a valid UUID`);
}
