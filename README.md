# SWYNEX Task 1: Full-Stack Project Architecture

## Project Overview: TaskFlow Pro

**TaskFlow Pro** is a modern, lightweight full-stack task management web application designed for remote teams to organize projects, track progress, and collaborate seamlessly.

---

## 1. System Architecture

The application uses a standard **3-Tier Architecture**:

* **Frontend:** React.js / Next.js with Tailwind CSS
* **Backend:** Node.js + Express.js REST API
* **Database:** PostgreSQL managed via Prisma ORM
* **Authentication:** JWT (JSON Web Tokens) with `bcrypt` password hashing

---

## 2. Data Models (Database Schema)

### User Model

```json
{
  "id": "UUID (Primary Key)",
  "name": "String",
  "email": "String (Unique)",
  "passwordHash": "String",
  "createdAt": "Timestamp"
}
```

---

## Project Model

```JSON
{
  "id": "UUID (Primary Key)",
  "title": "String",
  "description": "Text",
  "ownerId": "UUID (Foreign Key -> User)",
  "createdAt": "Timestamp"
}
```

---

## Task Model

```JSON
{
  "id": "UUID (Primary Key)",
  "projectId": "UUID (Foreign Key -> Project)",
  "assignedTo": "UUID (Foreign Key -> User, Optional)",
  "title": "String",
  "status": "Enum ('TODO', 'IN_PROGRESS', 'COMPLETED')",
  "dueDate": "Date",
  "createdAt": "Timestamp"
}
```
