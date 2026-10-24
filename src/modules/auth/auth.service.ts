import bcrypt from 'bcryptjs';
import { env } from '../../config/env';
import { AppError } from '../../lib/app-error';
import { prisma } from '../../lib/prisma';
import { publicUserSelect } from '../../lib/selects';
import { signToken } from '../../lib/token';
import type { LoginInput, RegisterInput } from './auth.schemas';

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existing) {
    throw AppError.conflict(
      'An account with this email already exists',
      'EMAIL_IN_USE',
    );
  }

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
    },
    select: publicUserSelect,
  });

  return {
    user,
    token: signToken({ userId: user.id, email: user.email }),
  };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { ...publicUserSelect, passwordHash: true },
  });

  if (!user) {
    throw AppError.unauthorized(
      'Invalid email or password',
      'INVALID_CREDENTIALS',
    );
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw AppError.unauthorized(
      'Invalid email or password',
      'INVALID_CREDENTIALS',
    );
  }

  const { passwordHash: _passwordHash, ...publicUser } = user;

  return {
    user: publicUser,
    token: signToken({ userId: user.id, email: user.email }),
  };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });

  if (!user) {
    throw AppError.unauthorized(
      'Account associated with this token no longer exists',
      'INVALID_TOKEN',
    );
  }

  return user;
}
