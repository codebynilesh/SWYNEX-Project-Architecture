import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { env } from '../../config/env';
import { asyncHandler } from '../../lib/async-handler';
import { requireAuth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { login, me, register } from './auth.controller';
import { loginSchema, registerSchema } from './auth.schemas';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts. Please try again later.',
    },
  },
});

export const authRouter = Router();

authRouter.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(register),
);

authRouter.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(login),
);

authRouter.get('/me', requireAuth, asyncHandler(me));
