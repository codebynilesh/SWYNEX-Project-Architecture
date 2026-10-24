import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { requireAuth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import {
  createProjectTask,
  listByProject,
} from '../tasks/tasks.controller';
import {
  createTaskSchema,
  listTasksQuerySchema,
} from '../tasks/tasks.schemas';
import {
  create,
  get,
  list,
  remove,
  update,
} from './projects.controller';
import {
  createProjectSchema,
  listProjectsQuerySchema,
  projectParamsSchema,
  updateProjectSchema,
} from './projects.schemas';

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

projectsRouter.get(
  '/',
  validate(listProjectsQuerySchema, 'query'),
  asyncHandler(list),
);

projectsRouter.post(
  '/',
  validate(createProjectSchema),
  asyncHandler(create),
);

projectsRouter.get(
  '/:projectId',
  validate(projectParamsSchema, 'params'),
  asyncHandler(get),
);

projectsRouter.put(
  '/:projectId',
  validate(projectParamsSchema, 'params'),
  validate(updateProjectSchema),
  asyncHandler(update),
);

projectsRouter.patch(
  '/:projectId',
  validate(projectParamsSchema, 'params'),
  validate(updateProjectSchema),
  asyncHandler(update),
);

projectsRouter.delete(
  '/:projectId',
  validate(projectParamsSchema, 'params'),
  asyncHandler(remove),
);

projectsRouter.get(
  '/:projectId/tasks',
  validate(projectParamsSchema, 'params'),
  validate(listTasksQuerySchema, 'query'),
  asyncHandler(listByProject),
);

projectsRouter.post(
  '/:projectId/tasks',
  validate(projectParamsSchema, 'params'),
  validate(createTaskSchema.omit({ projectId: true })),
  asyncHandler(createProjectTask),
);
