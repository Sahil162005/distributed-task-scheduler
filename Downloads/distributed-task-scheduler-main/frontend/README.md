# Frontend — Distributed Task Scheduler

React + TypeScript frontend for the backend API at `http://localhost:5007`.

## Stack

- React + TypeScript
- Tailwind CSS
- Axios
- React Router
- Socket.io client

## Setup

```bash
cd frontend
npm install
npm run dev
```

Default dev URL: `http://localhost:5173`

## Backend requirements

Run backend on `http://localhost:5007` and ensure CORS/cookies are configured for frontend origin when needed.

## Routes

- `/signup`
- `/login`
- `/dashboard`
- `/jobs/new`
- `/jobs/:id`

## Notes

- Uses cookie-based auth (`withCredentials: true`) and does not store JWT.
- Dashboard expects `GET /api/jobs` for user job list. If backend has not added it yet, dashboard shows an inline warning and still supports detail views.
- Job live updates listen to both `job:update` and `job:status` socket events.
