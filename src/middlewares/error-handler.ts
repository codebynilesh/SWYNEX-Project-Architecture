import { Prisma } from '@prisma/client';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { env } from '../config/env';
import { AppError } from '../lib/app-error';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};

function sendError(
  res: Parameters<ErrorRequestHandler>[2],
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): void {
  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  });
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof AppError) {
    sendError(res, error.statusCode, error.code, error.message, error.details);
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(', ')
        : 'field';
      sendError(res, 409, 'CONFLICT', `A record with this ${target} already exists`);
      return;
    }

    if (error.code === 'P2025') {
      sendError(res, 404, 'NOT_FOUND', 'Resource not found');
      return;
    }

    if (error.code === 'P2003') {
      sendError(res, 409, 'FOREIGN_KEY_CONSTRAINT', 'Related resource does not exist');
      return;
    }
  }

  const bodyParserType = (error as { type?: unknown }).type;

  if (bodyParserType === 'entity.parse.failed') {
    sendError(res, 400, 'INVALID_JSON', 'Request body contains invalid JSON');
    return;
  }

  if (bodyParserType === 'entity.too.large') {
    sendError(res, 413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');
    return;
  }

  console.error('[unhandled-error]', error);

  const message =
    env.NODE_ENV === 'production' || !(error instanceof Error)
      ? 'Internal server error'
      : error.message;

  sendError(res, 500, 'INTERNAL_SERVER_ERROR', message);
};
