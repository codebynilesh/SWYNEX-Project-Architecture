# TaskFlow Pro — Frontend

React + Vite + Tailwind CSS frontend for TaskFlow Pro.

## Setup
```bash
npm install
npm run dev # http://localhost:5173 proxies /api to :3000
```

Build:
```bash
npm run build # -> dist/
```

Env:
- `VITE_API_URL` — API base URL. Leave empty to use same-origin / proxy.

## Features
- JWT auth (login/register/me)
- Protected routes with loading states
- Dashboard with project CRUD, search, sort, pagination
- Kanban board + list view for tasks with status transitions, filtering, and error handling
- Loading skeletons, error banners with retry, empty states, inline validation
