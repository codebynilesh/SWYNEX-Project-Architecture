import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../lib/app-error';

export type RequestPart = 'body' | 'query' | 'params';

export function validate(
  schema: ZodType,
  part: RequestPart = 'body',
): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      next(
        AppError.validation(
          result.error.issues.map((issue) => ({
            field: issue.path.length > 0 ? issue.path.join('.') : part,
            message: issue.message,
          })),
        ),
      );
      return;
    }

    if (part === 'query') {
      Object.defineProperty(req, 'query', {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } else if (part === 'body') {
      req.body = result.data;
    } else {
      req.params = result.data as typeof req.params;
    }

    next();
  };
}
