import type { Prisma } from '@prisma/client';
import { AppError } from '../../lib/app-error';
import { buildPagination, getSkip } from '../../lib/pagination';
import { prisma } from '../../lib/prisma';
import type {
  CreateProjectInput,
  ListProjectsQuery,
  UpdateProjectInput,
} from './projects.schemas';

const projectInclude = {
  _count: { select: { tasks: true } },
} satisfies Prisma.ProjectInclude;

type ProjectWithCount = Prisma.ProjectGetPayload<{
  include: typeof projectInclude;
}>;

function serializeProject(project: ProjectWithCount) {
  const { _count, ...rest } = project;
  return { ...rest, taskCount: _count.tasks };
}

function projectOrderBy(
  sortBy: ListProjectsQuery['sortBy'],
  sortOrder: ListProjectsQuery['sortOrder'],
): Prisma.ProjectOrderByWithRelationInput {
  switch (sortBy) {
    case 'title':
      return { title: sortOrder };
    case 'updatedAt':
      return { updatedAt: sortOrder };
    default:
      return { createdAt: sortOrder };
  }
}

async function findOwnedProject(projectId: string, ownerId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId },
    select: { id: true },
  });

  if (!project) {
    throw AppError.notFound('Project not found');
  }

  return project;
}

export async function listProjects(
  ownerId: string,
  query: ListProjectsQuery,
) {
  const where: Prisma.ProjectWhereInput = {
    ownerId,
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, projects] = await prisma.$transaction([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      include: projectInclude,
      orderBy: projectOrderBy(query.sortBy, query.sortOrder),
      skip: getSkip(query.page, query.limit),
      take: query.limit,
    }),
  ]);

  return {
    data: projects.map(serializeProject),
    pagination: buildPagination(query.page, query.limit, total),
  };
}

export async function createProject(
  ownerId: string,
  input: CreateProjectInput,
) {
  const project = await prisma.project.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      ownerId,
    },
    include: projectInclude,
  });

  return serializeProject(project);
}

export async function getProject(projectId: string, ownerId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId },
    include: projectInclude,
  });

  if (!project) {
    throw AppError.notFound('Project not found');
  }

  return serializeProject(project);
}

export async function updateProject(
  projectId: string,
  ownerId: string,
  input: UpdateProjectInput,
) {
  await findOwnedProject(projectId, ownerId);

  const data: Prisma.ProjectUpdateInput = {};

  if (input.title !== undefined) {
    data.title = input.title;
  }

  if (input.description !== undefined) {
    data.description = input.description;
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data,
    include: projectInclude,
  });

  return serializeProject(project);
}

export async function deleteProject(
  projectId: string,
  ownerId: string,
): Promise<void> {
  await findOwnedProject(projectId, ownerId);
  await prisma.project.delete({ where: { id: projectId } });
}
