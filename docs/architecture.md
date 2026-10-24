# SWYNEX Task 1: Full-Stack Application Architecture

## 1. Product Idea
**Project Name:** TaskFlow Pro  
**Concept:** A modern, lightweight task and project management web application designed for remote teams to manage projects, assign tasks, and track real-time progress.

---

## 2. System Architecture Overview
The application follows a standard **3-Tier Full-Stack Architecture**:

- **Frontend:** React.js / Next.js with Tailwind CSS
- **Backend:** Node.js + Express.js REST API
- **Database:** PostgreSQL (or MongoDB) managed with Prisma ORM
- **Authentication:** JWT (JSON Web Tokens) with hashed passwords (bcrypt)

---

## 3. Data Models

### User Model
- `id` (UUID, Primary Key)
- `name` (String)
- `email` (String, Unique)
- `passwordHash` (String)
- `createdAt` (Timestamp)

### Project Model
- `id` (UUID, Primary Key)
- `title` (String)
- `description` (Text)
- `ownerId` (UUID, Foreign Key -> User)
- `createdAt` (Timestamp)

### Task Model
- `id` (UUID, Primary Key)
- `projectId` (UUID, Foreign Key -> Project)
- `assignedTo` (UUID, Foreign Key -> User, Optional)
- `title` (String)
- `status` (Enum: `TODO`, `IN_PROGRESS`, `COMPLETED`)
- `dueDate` (Date)
- `createdAt` (Timestamp)

---

## 4. API Endpoints (RESTful Routes)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | User registration | No |
| `POST` | `/api/auth/login` | User login & JWT issuance | No |
| `GET` | `/api/projects` | Fetch user's projects | Yes |
| `POST` | `/api/projects` | Create a new project | Yes |
| `GET` | `/api/projects/:id/tasks` | Get tasks for a project | Yes |
| `POST` | `/api/tasks` | Create a new task | Yes |
| `PUT` | `/api/tasks/:id` | Update task status or details | Yes |
| `DELETE` | `/api/tasks/:id` | Delete a task | Yes |

---

## 5. Frontend Screens & Layouts

1. **Authentication Page (`/login`, `/register`):**
   - Clean card layout with login/signup form and validation messages.
2. **Dashboard Page (`/dashboard`):**
   - Overview stats (total projects, pending tasks, completed tasks).
   - Sidebar navigation and project cards grid.
3. **Project Details Page (`/projects/:id`):**
   - Kanban board / task list view separated by `TODO`, `IN_PROGRESS`, and `COMPLETED`.
   - Action buttons to add, edit, or delete tasks.