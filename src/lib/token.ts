import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './app-error';

const TOKEN_ISSUER = 'taskflow-pro';
const TOKEN_AUDIENCE = 'taskflow-pro-api';

export interface TokenPayload {
  userId: string;
  email: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign({ email: payload.email }, env.JWT_SECRET, {
    subject: payload.userId,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
    algorithm: 'HS256',
  });
}

export function verifyToken(token: string): TokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      algorithms: ['HS256'],
    });

    if (
      typeof payload === 'string' ||
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string'
    ) {
      throw new Error('Malformed token payload');
    }

    return { userId: payload.sub, email: payload.email };
  } catch {
    throw AppError.unauthorized('Invalid or expired token', 'INVALID_TOKEN');
  }
}
