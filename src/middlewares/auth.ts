import type { Request, RequestHandler } from 'express';
import { AppError } from '../lib/app-error';
import { verifyToken } from '../lib/token';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.header('authorization');

  if (!header) {
    next(AppError.unauthorized());
    return;
  }

  const [scheme, token, extra] = header.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token || extra) {
    next(AppError.unauthorized('Malformed Authorization header', 'INVALID_TOKEN'));
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.userId, email: payload.email };
    next();
  } catch (error) {
    next(error);
  }
};

export function getAuthUser(req: Request): AuthenticatedUser {
  if (!req.user) {
    throw AppError.unauthorized();
  }

  return req.user;
}
