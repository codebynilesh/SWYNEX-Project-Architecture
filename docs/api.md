# TaskFlow Pro API Reference

Base URL: `http://localhost:3000`

All requests and responses use JSON. Protected routes require:

```http
Authorization: Bearer <jwt>
```

## Response conventions

Single resources:

```json
{ "data": { "id": "..." } }
```

Collections:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

Errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [{ "field": "email", "message": "Must be a valid email address" }]
  }
}
```

| Status | Codes |
| :--- | :--- |
| `400` | `VALIDATION_ERROR`, `BAD_REQUEST`, `INVALID_JSON`, `INVALID_ASSIGNEE` |
| `401` | `AUTH_REQUIRED`, `INVALID_TOKEN`, `INVALID_CREDENTIALS` |
| `404` | `NOT_FOUND` |
| `409` | `EMAIL_IN_USE`, `CONFLICT`, `FOREIGN_KEY_CONSTRAINT` |
| `413` | `PAYLOAD_TOO_LARGE` |
| `500` | `INTERNAL_SERVER_ERROR` |

---

## Authentication

### `POST /api/auth/register`

```json
{
  "name": "Alice Example",
  "email": "alice@example.com",
  "password": "Password123!"
}
```

Validation: `name` 2-100 characters, valid email up to 320 characters,
`password` 8-72 characters and at most 72 UTF-8 bytes. Email is trimmed and
lowercased. Passwords are hashed with bcrypt and never returned.

Response `201`:

```json
{
  "data": {
    "user": {
      "id": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
      "name": "Alice Example",
      "email": "alice@example.com",
      "createdAt": "2026-10-23T12:00:00.000Z"
    },
    "token": "<jwt>"
  }
}
```

### `POST /api/auth/login`

```json
{ "email": "alice@example.com", "password": "Password123!" }
```

Response `200`: same shape as registration.

### `GET /api/auth/me`

Returns the authenticated user. Requires a valid JWT.

---

## Projects

All project routes are scoped to the authenticated owner. Accessing another
user's project returns `404` to avoid leaking its existence.

### `GET /api/projects`

Query parameters:

| Name | Type | Default | Notes |
| :--- | :--- | :--- | :--- |
| `page` | integer | `1` | Minimum `1` |
| `limit` | integer | `20` | `1`-`100` |
| `search` | string | - | Case-insensitive title/description match |
| `sortBy` | enum | `createdAt` | `createdAt`, `updatedAt`, `title` |
| `sortOrder` | enum | `desc` | `asc`, `desc` |

Each project includes `taskCount`.

### `POST /api/projects`

```json
{
  "title": "Website Redesign",
  "description": "Refresh the marketing site"
}
```

Validation: `title` 1-120 characters, `description` up to 5000 characters or
`null`. Unknown fields are rejected.

Response `201`: the created project.

### `GET /api/projects/:projectId`

Returns one owned project with `taskCount`.

### `PUT|PATCH /api/projects/:projectId`

Accepts any subset of `title` and `description`. An empty payload is rejected.
`description: null` clears the description.

### `DELETE /api/projects/:projectId`

Response `204`. Tasks belonging to the project are deleted through the database
cascade.

### `GET /api/projects/:projectId/tasks`

Lists tasks for an owned project. Supports `status`, `assignedTo`, `search`,
`page`, `limit`, `sortBy` (`createdAt`, `updatedAt`, `dueDate`, `title`), and
`sortOrder`.

### `POST /api/projects/:projectId/tasks`

Convenience route for creating a task inside a project. The body is the same as
`POST /api/tasks` without `projectId`.

---

## Tasks

Valid statuses: `TODO`, `IN_PROGRESS`, `COMPLETED`.

### `POST /api/tasks`

```json
{
  "projectId": "2fb9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
  "title": "Design the dashboard",
  "description": "Include project and task metrics",
  "status": "TODO",
  "dueDate": "2026-11-01",
  "assignedTo": "3ac9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed"
}
```

Validation:

- `projectId`: valid UUID and owned by the authenticated user.
- `title`: required, 1-200 characters.
- `description`: optional, up to 5000 characters, nullable.
- `status`: optional, defaults to `TODO`.
- `dueDate`: optional ISO date (`YYYY-MM-DD`) or ISO datetime with timezone,
  nullable. Invalid calendar dates such as `2026-02-30` are rejected.
- `assignedTo`: optional UUID of an existing user, nullable.
- Unknown fields are rejected.

Response `201`: the created task, including `assignee` (or `null`).

### `GET /api/tasks/:taskId`

Returns one task if its project belongs to the authenticated user. The response
includes the task's `assignee`.

### `PUT|PATCH /api/tasks/:taskId`

Accepts any subset of `title`, `description`, `status`, `dueDate`, and
`assignedTo`. An empty payload is rejected. Use `null` to clear `dueDate` or
`assignedTo`.

### `DELETE /api/tasks/:taskId`

Response `204`.

---

## Persistence

- PostgreSQL with Prisma ORM.
- Initial migration: `prisma/migrations/20261023130000_init/migration.sql`.
- Unique index on `users.email`; indexes on `projects.ownerId`,
  `tasks.projectId`, `tasks.assignedTo`, and `(tasks.projectId, tasks.status)`.
- Deleting a user cascades to owned projects; deleting a project cascades to its
  tasks; deleting an assigned user sets `tasks.assignedTo` to `NULL`.
- All timestamps are stored with timezone. `tasks.dueDate` uses a PostgreSQL
  `DATE` column.
