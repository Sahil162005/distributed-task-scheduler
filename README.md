# Distributed Task Scheduler

A distributed task execution platform where users can submit background jobs, track their status in real-time, and have them executed across worker nodes with retry logic and failure handling.

## Tech Stack

- **Backend:** Node.js, TypeScript, Express
- **Database:** PostgreSQL, Prisma ORM
- **Queue:** BullMQ, Redis
- **Email:** Resend
- **Frontend:** React, Vite, Tailwind CSS
- **Realtime:** Socket.io

## Features

- User authentication (signup/login with JWT)
- Job submission with validation
- Background job processing with BullMQ workers
- Automatic retry logic with configurable max retries
- Real-time job status updates via WebSockets
- Email notifications via Resend
- Job history and status tracking dashboard

## Getting Started

### Prerequisites
- Node.js 22+
- Docker & Docker Compose

### Setup

1. Clone the repository
```bash
   git clone https://github.com/Sahil162005/distributed-task-scheduler.git
   cd distributed-task-scheduler
```

2. Create `.env` file
```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/distributed_task_scheduler"
   REDIS_URL="redis://localhost:6379"
   JWT_SECRET="your-secret-key"
   RESEND_API_KEY="your-resend-api-key"
```

3. Start services
```bash
   docker-compose up -d postgres redis
```

4. Install dependencies & run migrations
```bash
   npm install
   npx prisma migrate deploy
   npm run dev
```

5. Start frontend
```bash
   cd frontend
   npm install
   npm run dev
```

## Contributors

- [Sahil Yadav](https://github.com/Sahil162005)
- [Krish Yadav](https://github.com/krshydv)
