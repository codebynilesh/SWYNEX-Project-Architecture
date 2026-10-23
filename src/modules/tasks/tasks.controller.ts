import type { Request, Response } from 'express';
import { getAuthUser } from '../../middlewares/auth';
import type { ProjectParams } from '../projects/projects.schemas';
import type {
  CreateTaskInput,
  ListTasksQuery,
  TaskParams,
  UpdateTaskInput,
} from './tasks.schemas';
import {
  createTask,
  deleteTask,
  getTask,
  listProjectTasks,
  updateTask,
} from './tasks.service';

export async function create(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const task = await createTask(user.id, req.body as CreateTaskInput);
  res.status(201).json({ data: task });
}

export async function createProjectTask(
  req: Request,
  res: Response,
): Promise<void> {
  const user = getAuthUser(req);
  const { projectId } = req.params as unknown as ProjectParams;
  const body = req.body as Omit<CreateTaskInput, 'projectId'>;
  const task = await createTask(user.id, { ...body, projectId });
  res.status(201).json({ data: task });
}

export async function listByProject(
  req: Request,
  res: Response,
): Promise<void> {
  const user = getAuthUser(req);
  const { projectId } = req.params as unknown as ProjectParams;
  const result = await listProjectTasks(
    projectId,
    user.id,
    req.query as unknown as ListTasksQuery,
  );
  res.status(200).json(result);
}

export async function get(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { taskId } = req.params as unknown as TaskParams;
  const task = await getTask(taskId, user.id);
  res.status(200).json({ data: task });
}

export async function update(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { taskId } = req.params as unknown as TaskParams;
  const task = await updateTask(
    taskId,
    user.id,
    req.body as UpdateTaskInput,
  );
  res.status(200).json({ data: task });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { taskId } = req.params as unknown as TaskParams;
  await deleteTask(taskId, user.id);
  res.status(204).send();
}
