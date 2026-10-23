import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { requireAuth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import {
  create,
  get,
  remove,
  update,
} from './tasks.controller';
import {
  createTaskSchema,
  taskParamsSchema,
  updateTaskSchema,
} from './tasks.schemas';

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

tasksRouter.post(
  '/',
  validate(createTaskSchema),
  asyncHandler(create),
);

tasksRouter.get(
  '/:taskId',
  validate(taskParamsSchema, 'params'),
  asyncHandler(get),
);

tasksRouter.put(
  '/:taskId',
  validate(taskParamsSchema, 'params'),
  validate(updateTaskSchema),
  asyncHandler(update),
);

tasksRouter.patch(
  '/:taskId',
  validate(taskParamsSchema, 'params'),
  validate(updateTaskSchema),
  asyncHandler(update),
);

tasksRouter.delete(
  '/:taskId',
  validate(taskParamsSchema, 'params'),
  asyncHandler(remove),
);
