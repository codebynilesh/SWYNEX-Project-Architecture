import bcrypt from 'bcryptjs';
import type { Express } from 'express';
import type { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { startTestDatabase, type TestDatabase } from './helpers/test-database';

interface RegisteredUser {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
  token: string;
}

let app: Express;
let prisma: PrismaClient;
let testDatabase: TestDatabase;

const alice = {
  name: 'Alice Example',
  email: 'alice@example.com',
  password: 'Password123!',
};

const bob = {
  name: 'Bob Example',
  email: 'bob@example.com',
  password: 'Password123!',
};

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function registerUser(
  overrides: Partial<typeof alice> = {},
  expectedStatus = 201,
): Promise<RegisteredUser> {
  const response = await request(app)
    .post('/api/auth/register')
    .send({ ...alice, ...overrides });

  expect(response.status).toBe(expectedStatus);
  return response.body.data as RegisteredUser;
}

async function createProject(
  token: string,
  overrides: Record<string, unknown> = {},
) {
  const response = await request(app)
    .post('/api/projects')
    .set(auth(token))
    .send({ title: 'Website Redesign', ...overrides });

  expect(response.status).toBe(201);
  return response.body.data as {
    id: string;
    title: string;
    description: string | null;
    ownerId: string;
    taskCount: number;
  };
}

async function createTask(
  token: string,
  body: Record<string, unknown>,
  expectedStatus = 201,
) {
  const response = await request(app)
    .post('/api/tasks')
    .set(auth(token))
    .send(body);

  expect(response.status).toBe(expectedStatus);
  return response.body;
}

beforeAll(async () => {
  testDatabase = await startTestDatabase();

  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = testDatabase.url;
  process.env.JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-characters';
  process.env.BCRYPT_ROUNDS = '4';
  process.env.CORS_ORIGIN = '*';

  const [{ createApp }, prismaModule] = await Promise.all([
    import('../src/app'),
    import('../src/lib/prisma'),
  ]);

  app = createApp();
  prisma = prismaModule.prisma;
});

beforeEach(async () => {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "tasks", "projects", "users" CASCADE',
  );
});

afterAll(async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
  if (testDatabase) {
    await testDatabase.close();
  }
});

describe('health check', () => {
  it('reports that the API is running', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});

describe('POST /api/auth/register', () => {
  it('returns field-level validation errors for an invalid payload', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'A',
      email: 'not-an-email',
      password: 'short',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'name' }),
        expect.objectContaining({ field: 'email' }),
        expect.objectContaining({ field: 'password' }),
      ]),
    );
  });

  it('rejects unknown fields', async () => {
    const response = await request(app).post('/api/auth/register').send({
      ...alice,
      role: 'admin',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('creates a user, hashes the password, and returns a token', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...alice, email: '  ALICE@example.com ' });

    expect(response.status).toBe(201);
    expect(response.body.data.user).toMatchObject({
      name: alice.name,
      email: alice.email,
    });
    expect(response.body.data.user).not.toHaveProperty('passwordHash');
    expect(typeof response.body.data.token).toBe('string');

    const storedUser = await prisma.user.findUnique({
      where: { email: alice.email },
    });

    expect(storedUser).not.toBeNull();
    expect(storedUser?.passwordHash).not.toBe(alice.password);
    await expect(
      bcrypt.compare(alice.password, storedUser!.passwordHash),
    ).resolves.toBe(true);
  });

  it('rejects a duplicate email address', async () => {
    await registerUser();

    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...alice, name: 'Another Alice' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('EMAIL_IN_USE');
  });
});

describe('POST /api/auth/login', () => {
  it('rejects an incorrect password', async () => {
    await registerUser();

    const response = await request(app).post('/api/auth/login').send({
      email: alice.email,
      password: 'WrongPassword1!',
    });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('logs in and authenticates /api/auth/me', async () => {
    await registerUser();

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: alice.email,
      password: alice.password,
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.user.email).toBe(alice.email);

    const meResponse = await request(app)
      .get('/api/auth/me')
      .set(auth(loginResponse.body.data.token));

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.data.email).toBe(alice.email);
  });

  it('rejects requests without a valid bearer token', async () => {
    const missing = await request(app).get('/api/auth/me');
    expect(missing.status).toBe(401);
    expect(missing.body.error.code).toBe('AUTH_REQUIRED');

    const invalid = await request(app)
      .get('/api/auth/me')
      .set({ Authorization: 'Bearer not-a-real-token' });

    expect(invalid.status).toBe(401);
    expect(invalid.body.error.code).toBe('INVALID_TOKEN');
  });
});

describe('projects resource', () => {
  it('requires authentication', async () => {
    const response = await request(app).get('/api/projects');

    expect(response.status).toBe(401);
  });

  it('validates project input', async () => {
    const { token } = await registerUser();

    const missingTitle = await request(app)
      .post('/api/projects')
      .set(auth(token))
      .send({ description: 'No title here' });

    expect(missingTitle.status).toBe(400);
    expect(missingTitle.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'title' })]),
    );

    const unknownField = await request(app)
      .post('/api/projects')
      .set(auth(token))
      .send({ title: 'Valid title', archive: true });

    expect(unknownField.status).toBe(400);
  });

  it('creates, reads, updates, and deletes a project', async () => {
    const { token, user } = await registerUser();

    const created = await createProject(token, {
      title: 'TaskFlow Launch',
      description: 'Ship the first release',
    });

    expect(created).toMatchObject({
      title: 'TaskFlow Launch',
      ownerId: user.id,
      taskCount: 0,
    });

    const fetched = await request(app)
      .get(`/api/projects/${created.id}`)
      .set(auth(token));

    expect(fetched.status).toBe(200);
    expect(fetched.body.data.id).toBe(created.id);

    const updated = await request(app)
      .patch(`/api/projects/${created.id}`)
      .set(auth(token))
      .send({ title: 'TaskFlow Launch v2', description: null });

    expect(updated.status).toBe(200);
    expect(updated.body.data.title).toBe('TaskFlow Launch v2');
    expect(updated.body.data.description).toBeNull();

    const emptyUpdate = await request(app)
      .patch(`/api/projects/${created.id}`)
      .set(auth(token))
      .send({});

    expect(emptyUpdate.status).toBe(400);

    const removed = await request(app)
      .delete(`/api/projects/${created.id}`)
      .set(auth(token));

    expect(removed.status).toBe(204);

    const missing = await request(app)
      .get(`/api/projects/${created.id}`)
      .set(auth(token));

    expect(missing.status).toBe(404);
  });

  it('isolates projects between users', async () => {
    const aliceAccount = await registerUser();
    const bobAccount = await registerUser({
      name: bob.name,
      email: bob.email,
    });
    const project = await createProject(aliceAccount.token);

    const response = await request(app)
      .get(`/api/projects/${project.id}`)
      .set(auth(bobAccount.token));

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('lists only owned projects with search and pagination', async () => {
    const { token } = await registerUser();
    await createProject(token, { title: 'Alpha Project' });
    await createProject(token, { title: 'Beta Project' });
    await createProject(token, { title: 'Gamma Project' });

    const all = await request(app)
      .get('/api/projects?page=1&limit=2&sortBy=title&sortOrder=asc')
      .set(auth(token));

    expect(all.status).toBe(200);
    expect(all.body.data).toHaveLength(2);
    expect(all.body.pagination).toMatchObject({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
      hasNextPage: true,
    });

    const search = await request(app)
      .get('/api/projects?search=beta')
      .set(auth(token));

    expect(search.status).toBe(200);
    expect(search.body.data).toHaveLength(1);
    expect(search.body.data[0].title).toBe('Beta Project');
  });
});

describe('tasks resource', () => {
  it('validates task input', async () => {
    const { token } = await registerUser();
    const project = await createProject(token);

    const missingTitle = await createTask(
      token,
      { projectId: project.id },
      400,
    );
    expect(missingTitle.error.code).toBe('VALIDATION_ERROR');
    expect(missingTitle.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'title' })]),
    );

    const invalidStatus = await createTask(
      token,
      { projectId: project.id, title: 'Task', status: 'DONE' },
      400,
    );
    expect(invalidStatus.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'status' })]),
    );

    const invalidDueDate = await createTask(
      token,
      { projectId: project.id, title: 'Task', dueDate: '2026-02-30' },
      400,
    );
    expect(invalidDueDate.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'dueDate' })]),
    );

    const unknownField = await createTask(
      token,
      { projectId: project.id, title: 'Task', priority: 'high' },
      400,
    );
    expect(unknownField.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects creating a task in a project owned by another user', async () => {
    const aliceAccount = await registerUser();
    const bobAccount = await registerUser({
      name: bob.name,
      email: bob.email,
    });
    const project = await createProject(aliceAccount.token);

    const response = await createTask(
      bobAccount.token,
      { projectId: project.id, title: 'Sneaky task' },
      404,
    );

    expect(response.error.code).toBe('NOT_FOUND');
  });

  it('rejects a valid but non-existent assignee', async () => {
    const { token } = await registerUser();
    const project = await createProject(token);

    const response = await createTask(
      token,
      {
        projectId: project.id,
        title: 'Assign to ghost',
        assignedTo: '00000000-0000-4000-8000-000000000000',
      },
      400,
    );

    expect(response.error.code).toBe('INVALID_ASSIGNEE');
  });

  it('creates a task with every field and default status', async () => {
    const aliceAccount = await registerUser();
    const bobAccount = await registerUser({
      name: bob.name,
      email: bob.email,
    });
    const project = await createProject(aliceAccount.token);

    const response = await createTask(aliceAccount.token, {
      projectId: project.id,
      title: 'Design the dashboard',
      description: 'Include project and task metrics',
      dueDate: '2026-11-01',
      assignedTo: bobAccount.user.id,
    });

    expect(response.data).toMatchObject({
      projectId: project.id,
      title: 'Design the dashboard',
      description: 'Include project and task metrics',
      status: 'TODO',
      assignedTo: bobAccount.user.id,
      assignee: {
        id: bobAccount.user.id,
        email: bob.email,
      },
    });
    expect(response.data.dueDate).toBe('2026-11-01T00:00:00.000Z');

    const persisted = await prisma.task.findUnique({
      where: { id: response.data.id },
    });
    expect(persisted?.status).toBe('TODO');
  });

  it('supports creating tasks through the nested project route', async () => {
    const { token } = await registerUser();
    const project = await createProject(token);

    const response = await request(app)
      .post(`/api/projects/${project.id}/tasks`)
      .set(auth(token))
      .send({ title: 'Nested task' });

    expect(response.status).toBe(201);
    expect(response.body.data.projectId).toBe(project.id);
    expect(response.body.data.status).toBe('TODO');
  });

  it('lists, filters, searches, sorts, and paginates project tasks', async () => {
    const aliceAccount = await registerUser();
    const bobAccount = await registerUser({
      name: bob.name,
      email: bob.email,
    });
    const project = await createProject(aliceAccount.token);

    await createTask(aliceAccount.token, {
      projectId: project.id,
      title: 'Write requirements',
      status: 'COMPLETED',
      dueDate: '2026-10-01',
      assignedTo: bobAccount.user.id,
    });
    await createTask(aliceAccount.token, {
      projectId: project.id,
      title: 'Build API',
      status: 'IN_PROGRESS',
      dueDate: '2026-10-20',
    });
    await createTask(aliceAccount.token, {
      projectId: project.id,
      title: 'Write documentation',
      status: 'TODO',
    });

    const completed = await request(app)
      .get(`/api/projects/${project.id}/tasks?status=COMPLETED`)
      .set(auth(aliceAccount.token));

    expect(completed.status).toBe(200);
    expect(completed.body.data).toHaveLength(1);
    expect(completed.body.data[0].title).toBe('Write requirements');
    expect(completed.body.data[0].assignee.email).toBe(bob.email);

    const assigned = await request(app)
      .get(
        `/api/projects/${project.id}/tasks?assignedTo=${bobAccount.user.id}`,
      )
      .set(auth(aliceAccount.token));

    expect(assigned.status).toBe(200);
    expect(assigned.body.data).toHaveLength(1);

    const search = await request(app)
      .get(`/api/projects/${project.id}/tasks?search=documentation`)
      .set(auth(aliceAccount.token));

    expect(search.status).toBe(200);
    expect(search.body.data).toHaveLength(1);

    const sorted = await request(app)
      .get(
        `/api/projects/${project.id}/tasks?sortBy=dueDate&sortOrder=asc`,
      )
      .set(auth(aliceAccount.token));

    expect(sorted.status).toBe(200);
    expect(sorted.body.data.map((task: { title: string }) => task.title)).toEqual(
      ['Write requirements', 'Build API', 'Write documentation'],
    );

    const page = await request(app)
      .get(`/api/projects/${project.id}/tasks?page=2&limit=2&sortBy=title&sortOrder=asc`)
      .set(auth(aliceAccount.token));

    expect(page.status).toBe(200);
    expect(page.body.data).toHaveLength(1);
    expect(page.body.pagination).toMatchObject({
      page: 2,
      limit: 2,
      total: 3,
      totalPages: 2,
      hasPreviousPage: true,
      hasNextPage: false,
    });
  });

  it('updates task details and status', async () => {
    const aliceAccount = await registerUser();
    const bobAccount = await registerUser({
      name: bob.name,
      email: bob.email,
    });
    const project = await createProject(aliceAccount.token);
    const created = await createTask(aliceAccount.token, {
      projectId: project.id,
      title: 'Initial title',
      assignedTo: bobAccount.user.id,
    });

    const updated = await request(app)
      .put(`/api/tasks/${created.data.id}`)
      .set(auth(aliceAccount.token))
      .send({
        title: 'Updated title',
        status: 'IN_PROGRESS',
        dueDate: '2026-12-15T09:30:00.000Z',
        assignedTo: null,
        description: 'Now with details',
      });

    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({
      title: 'Updated title',
      status: 'IN_PROGRESS',
      description: 'Now with details',
      assignedTo: null,
      assignee: null,
    });
    expect(updated.body.data.dueDate).toBe('2026-12-15T00:00:00.000Z');

    const emptyUpdate = await request(app)
      .patch(`/api/tasks/${created.data.id}`)
      .set(auth(aliceAccount.token))
      .send({});

    expect(emptyUpdate.status).toBe(400);
  });

  it('prevents another user from reading or modifying a task', async () => {
    const aliceAccount = await registerUser();
    const bobAccount = await registerUser({
      name: bob.name,
      email: bob.email,
    });
    const project = await createProject(aliceAccount.token);
    const created = await createTask(aliceAccount.token, {
      projectId: project.id,
      title: 'Private task',
    });

    const read = await request(app)
      .get(`/api/tasks/${created.data.id}`)
      .set(auth(bobAccount.token));
    expect(read.status).toBe(404);

    const update = await request(app)
      .patch(`/api/tasks/${created.data.id}`)
      .set(auth(bobAccount.token))
      .send({ status: 'COMPLETED' });
    expect(update.status).toBe(404);

    const remove = await request(app)
      .delete(`/api/tasks/${created.data.id}`)
      .set(auth(bobAccount.token));
    expect(remove.status).toBe(404);
  });

  it('validates UUID route parameters', async () => {
    const { token } = await registerUser();

    const response = await request(app)
      .get('/api/tasks/not-a-uuid')
      .set(auth(token));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('deletes a task and persists the deletion', async () => {
    const { token } = await registerUser();
    const project = await createProject(token);
    const created = await createTask(token, {
      projectId: project.id,
      title: 'Temporary task',
    });

    const removed = await request(app)
      .delete(`/api/tasks/${created.data.id}`)
      .set(auth(token));

    expect(removed.status).toBe(204);

    const missing = await request(app)
      .get(`/api/tasks/${created.data.id}`)
      .set(auth(token));

    expect(missing.status).toBe(404);
    await expect(
      prisma.task.count({ where: { id: created.data.id } }),
    ).resolves.toBe(0);
  });
});
