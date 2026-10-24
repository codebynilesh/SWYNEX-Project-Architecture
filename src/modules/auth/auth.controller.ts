import type { Request, Response } from 'express';
import { getAuthUser } from '../../middlewares/auth';
import type { LoginInput, RegisterInput } from './auth.schemas';
import { getCurrentUser, loginUser, registerUser } from './auth.service';

export async function register(req: Request, res: Response): Promise<void> {
  const result = await registerUser(req.body as RegisterInput);
  res.status(201).json({ data: result });
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await loginUser(req.body as LoginInput);
  res.status(200).json({ data: result });
}

export async function me(req: Request, res: Response): Promise<void> {
  const authUser = getAuthUser(req);
  const user = await getCurrentUser(authUser.id);
  res.status(200).json({ data: user });
}
