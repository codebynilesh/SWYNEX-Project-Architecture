# SWYNEX — TaskFlow Pro

**TaskFlow Pro** is a lightweight full-stack task management application for
remote teams to organize projects, assign tasks, and track progress.

This repository contains the **backend API and persistence layer**: a typed
Express REST API backed by PostgreSQL through Prisma, with JWT authentication,
request validation, and integration tests.

---

## 1. System Architecture

The application uses a standard **3-Tier Architecture**:

- **Frontend:** React.js / Next.js with Tailwind CSS (planned)
- **Backend:** Node.js + Express 5 REST API
- **Database:** PostgreSQL managed via Prisma ORM
- **Authentication:** JWT (JSON Web Tokens) with bcrypt password hashing
- **Validation:** Zod schemas at the HTTP boundary

---

## 2. Data Models

### User

- `id` — UUID, primary key
- `name` — String (100)
- `email` — String (320), unique, normalized to lowercase
- `passwordHash` — String, bcrypt hash (never returned by the API)
- `createdAt`, `updatedAt` — Timestamps with timezone

### Project

- `id` — UUID, primary key
- `title` — String (120)
- `description` — Text, optional
- `ownerId` — UUID, foreign key to User
- `createdAt`, `updatedAt` — Timestamps with timezone

### Task

- `id` — UUID, primary key
- `projectId` — UUID, foreign key to Project
- `assignedTo` — UUID, optional foreign key to User
- `title` — String (200)
- `description` — Text, optional
- `status` — Enum: `TODO`, `IN_PROGRESS`, `COMPLETED` (defaults to `TODO`)
- `dueDate` — PostgreSQL `DATE`, optional
- `createdAt`, `updatedAt` — Timestamps with timezone

The Prisma schema lives in [`prisma/schema.prisma`](prisma/schema.prisma) and the
checked-in migration is in
[`prisma/migrations/20261023130000_init/migration.sql`](prisma/migrations/20261023130000_init/migration.sql).

---

## 3. Backend Implementation

Implemented under `src/` with explicit layers:

```text
src/
  app.ts                 Express app, middleware, route mounting
  server.ts              HTTP server and graceful shutdown
  config/env.ts          Validated environment configuration
  lib/                   Prisma client, errors, JWT, pagination, selects
  middlewares/           Auth, validation, error handling
  modules/
    auth/                Register, login, current user
    projects/            Full project CRUD
    tasks/               Full task CRUD, filtering, assignment
prisma/
  schema.prisma          Data model and indexes
  migrations/            Versioned SQL migration
  seed.ts                Demo user, project, and tasks
tests/
  api.test.ts            End-to-end API tests against embedded PostgreSQL
```

Key behavior:

- **Complete Tasks resource:** create, read, list/filter/search/sort/paginate,
  update (PUT/PATCH), and delete, with ownership checks.
- **Validation:** Zod schemas enforce types, string lengths, UUIDs, enums, ISO
  dates, unknown-field rejection, and at least one field on updates. Errors
  return field-level details.
- **Authorization:** every project and task is scoped to its owner. Foreign
  resources return `404` rather than leaking existence.
- **Consistency:** duplicate emails return `409`; invalid assignees are rejected;
  foreign-key and Prisma errors are mapped to API error envelopes.
- **Security:** Helmet, CORS allowlist, request body size limits, auth rate
  limiting, bcrypt hashing, signed/expiring JWTs.

---

## 4. Running Locally

Prerequisites: Node.js 20.19+ and Docker (for PostgreSQL).

```bash
npm install
cp .env.example .env
docker compose up -d
npx prisma migrate deploy
npm run db:seed      # optional demo data
npm run dev
```

The API starts at `http://localhost:3000`. Health check: `GET /health`.

Demo credentials after seeding: `demo@taskflow.dev` / `Password123!`.

### Environment variables

| Variable | Required | Default | Purpose |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | yes | - | PostgreSQL connection string |
| `JWT_SECRET` | yes | - | At least 32 characters |
| `JWT_EXPIRES_IN` | no | `1d` | Token lifetime |
| `BCRYPT_ROUNDS` | no | `12` | Password hashing cost |
| `PORT` | no | `3000` | HTTP port |
| `NODE_ENV` | no | `development` | Runtime mode |
| `CORS_ORIGIN` | no | `*` | Comma-separated allowed origins |

### Scripts

| Script | Description |
| :--- | :--- |
| `npm run dev` | Start with hot reload (`tsx watch`) |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run the compiled server |
| `npm test` | Run integration tests |
| `npm run typecheck` | TypeScript without emit |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Create/apply a dev migration |
| `npm run db:deploy` | Apply checked-in migrations |
| `npm run db:push` | Sync schema without a migration |
| `npm run db:seed` | Insert demo user, project, and tasks |
| `npm run prisma:generate` | Regenerate Prisma Client |

---

## 5. API Summary

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Liveness check | No |
| `POST` | `/api/auth/register` | Register a user | No |
| `POST` | `/api/auth/login` | Log in and receive a JWT | No |
| `GET` | `/api/auth/me` | Current user | Yes |
| `GET` | `/api/projects` | List owned projects | Yes |
| `POST` | `/api/projects` | Create a project | Yes |
| `GET` | `/api/projects/:projectId` | Get an owned project | Yes |
| `PUT/PATCH` | `/api/projects/:projectId` | Update a project | Yes |
| `DELETE` | `/api/projects/:projectId` | Delete a project and its tasks | Yes |
| `GET` | `/api/projects/:projectId/tasks` | List/filter project tasks | Yes |
| `POST` | `/api/projects/:projectId/tasks` | Create a task in a project | Yes |
| `POST` | `/api/tasks` | Create a task | Yes |
| `GET` | `/api/tasks/:taskId` | Get a task | Yes |
| `PUT/PATCH` | `/api/tasks/:taskId` | Update task details/status | Yes |
| `DELETE` | `/api/tasks/:taskId` | Delete a task | Yes |

See [`docs/api.md`](docs/api.md) for request bodies, query parameters, status
codes, and validation rules.

---

## 6. Testing

Tests exercise the real Express app and Prisma client against an in-process
PostgreSQL-compatible database (PGlite over the wire protocol), so no external
database or Docker is required:

```bash
npm test
```

Coverage includes registration/login, password hashing, duplicate emails,
authentication failures, project ownership isolation, task validation (status,
UUIDs, due dates, unknown fields), invalid assignees, nested routes, filtering,
search, sorting, pagination, updates, deletes, and 404 behavior.

---

## 7. Original Architecture Notes

See [`docs/architecture.md`](docs/architecture.md) for the original frontend
screens and system design notes.
