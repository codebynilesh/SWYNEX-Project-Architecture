import type { Request, Response } from 'express';
import { getAuthUser } from '../../middlewares/auth';
import type { ListProjectsQuery, ProjectParams } from './projects.schemas';
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from './projects.service';
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from './projects.schemas';

export async function list(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const result = await listProjects(user.id, req.query as unknown as ListProjectsQuery);
  res.status(200).json(result);
}

export async function create(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const project = await createProject(user.id, req.body as CreateProjectInput);
  res.status(201).json({ data: project });
}

export async function get(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { projectId } = req.params as unknown as ProjectParams;
  const project = await getProject(projectId, user.id);
  res.status(200).json({ data: project });
}

export async function update(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { projectId } = req.params as unknown as ProjectParams;
  const project = await updateProject(
    projectId,
    user.id,
    req.body as UpdateProjectInput,
  );
  res.status(200).json({ data: project });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const user = getAuthUser(req);
  const { projectId } = req.params as unknown as ProjectParams;
  await deleteProject(projectId, user.id);
  res.status(204).send();
}
