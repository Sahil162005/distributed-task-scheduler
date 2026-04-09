# distributed-task-scheduler
A distributed task execution platform where users can submit background jobs, track their status in real-time, and have them executed across worker nodes with retry logic and failure handling. Built with Node.js, TypeScript, PostgreSQL, BullMQ, and Redis.

## Run with Docker Compose

```bash
docker compose up --build
```

The stack starts PostgreSQL, Redis, and the Node.js API on `http://localhost:5007`.

## Socket events

- Subscribe client to a job: `subscribe:job` with payload `jobId`
- Worker status updates: `job:status`

## E2E API test harness

Run the ordered HTTP checks (health, auth validation, signup/login, auth middleware, job validation, valid job submission, and job status ownership checks):

```bash
npm run test:e2e:http
```

Use a different API base URL when needed:

```bash
BASE_URL=http://localhost:5007 npm run test:e2e:http
```

Run optional real integration checks for email + Telegram in Step 10:

```bash
RUN_REAL_INTEGRATIONS=1 REAL_EMAIL=you@example.com REAL_CHAT_ID=123456789 npm run test:e2e:http
```

Notes:

- Step 11 (retry progression) is intentionally manual because it requires changing `.env` and restarting the server.
- Step 12 (WebSocket stream) is intentionally manual; the server accepts both `subscribe:job` (string payload) and `subscribe` (`{ jobId }`) subscription styles.

## Frontend app

A React + TypeScript frontend is available in `frontend/`.

```bash
cd frontend
npm install
npm run dev
```

Frontend routes:

- `/signup`
- `/login`
- `/dashboard`
- `/jobs/new`
- `/jobs/:id`

Notes:

- Axios is configured with `withCredentials: true`.
- Socket client listens to both `job:status` and `job:update` and emits both `subscribe:job` and `subscribe` payload styles for compatibility.
