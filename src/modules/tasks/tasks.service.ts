import type { Prisma } from '@prisma/client';
import { AppError } from '../../lib/app-error';
import { buildPagination, getSkip } from '../../lib/pagination';
import { prisma } from '../../lib/prisma';
import { publicUserSelect } from '../../lib/selects';
import type {
  CreateTaskInput,
  ListTasksQuery,
  UpdateTaskInput,
} from './tasks.schemas';

const taskInclude = {
  assignee: { select: publicUserSelect },
} satisfies Prisma.TaskInclude;

type TaskWithAssignee = Prisma.TaskGetPayload<{
  include: typeof taskInclude;
}>;

async function assertProjectAccess(
  projectId: string,
  ownerId: string,
): Promise<void> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId },
    select: { id: true },
  });

  if (!project) {
    throw AppError.notFound('Project not found');
  }
}

async function assertAssigneeExists(assigneeId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: assigneeId },
    select: { id: true },
  });

  if (!user) {
    throw AppError.badRequest(
      'The assigned user does not exist',
      'INVALID_ASSIGNEE',
      [{ field: 'assignedTo', message: 'User not found' }],
    );
  }
}

async function findOwnedTask(
  taskId: string,
  ownerId: string,
): Promise<{ id: string }> {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: { ownerId },
    },
    select: { id: true },
  });

  if (!task) {
    throw AppError.notFound('Task not found');
  }

  return task;
}

function taskOrderBy(
  sortBy: ListTasksQuery['sortBy'],
  sortOrder: ListTasksQuery['sortOrder'],
): Prisma.TaskOrderByWithRelationInput {
  switch (sortBy) {
    case 'title':
      return { title: sortOrder };
    case 'dueDate':
      return { dueDate: { sort: sortOrder, nulls: 'last' } };
    case 'updatedAt':
      return { updatedAt: sortOrder };
    default:
      return { createdAt: sortOrder };
  }
}

export async function listProjectTasks(
  projectId: string,
  ownerId: string,
  query: ListTasksQuery,
): Promise<{
  data: TaskWithAssignee[];
  pagination: ReturnType<typeof buildPagination>;
}> {
  await assertProjectAccess(projectId, ownerId);

  const where: Prisma.TaskWhereInput = { projectId };

  if (query.status) {
    where.status = query.status;
  }

  if (query.assignedTo) {
    where.assignedTo = query.assignedTo;
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [total, tasks] = await prisma.$transaction([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: taskOrderBy(query.sortBy, query.sortOrder),
      skip: getSkip(query.page, query.limit),
      take: query.limit,
    }),
  ]);

  return {
    data: tasks,
    pagination: buildPagination(query.page, query.limit, total),
  };
}

export async function createTask(
  ownerId: string,
  input: CreateTaskInput,
): Promise<TaskWithAssignee> {
  await assertProjectAccess(input.projectId, ownerId);

  if (input.assignedTo) {
    await assertAssigneeExists(input.assignedTo);
  }

  return prisma.task.create({
    data: {
      projectId: input.projectId,
      title: input.title,
      description: input.description ?? null,
      status: input.status,
      dueDate: input.dueDate ?? null,
      assignedTo: input.assignedTo ?? null,
    },
    include: taskInclude,
  });
}

export async function getTask(
  taskId: string,
  ownerId: string,
): Promise<TaskWithAssignee> {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: { ownerId },
    },
    include: taskInclude,
  });

  if (!task) {
    throw AppError.notFound('Task not found');
  }

  return task;
}

export async function updateTask(
  taskId: string,
  ownerId: string,
  input: UpdateTaskInput,
): Promise<TaskWithAssignee> {
  await findOwnedTask(taskId, ownerId);

  const data: Prisma.TaskUncheckedUpdateInput = {};

  if (input.title !== undefined) {
    data.title = input.title;
  }

  if (input.description !== undefined) {
    data.description = input.description;
  }

  if (input.status !== undefined) {
    data.status = input.status;
  }

  if (input.dueDate !== undefined) {
    data.dueDate = input.dueDate;
  }

  if (input.assignedTo !== undefined) {
    if (input.assignedTo) {
      await assertAssigneeExists(input.assignedTo);
    }
    data.assignedTo = input.assignedTo;
  }

  return prisma.task.update({
    where: { id: taskId },
    data,
    include: taskInclude,
  });
}

export async function deleteTask(
  taskId: string,
  ownerId: string,
): Promise<void> {
  await findOwnedTask(taskId, ownerId);
  await prisma.task.delete({ where: { id: taskId } });
}
