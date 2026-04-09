# Distributed Task Scheduler

A distributed task execution platform that allows users to submit background jobs, process them asynchronously using a worker system, and track their status in real time.

## Overview
The system is designed to handle tasks such as sending emails or messages without blocking the main application flow.

## Features
- Asynchronous job processing using queues
- Retry mechanism for failed jobs
- Job status tracking (PENDING, PROCESSING, COMPLETED, FAILED, RETRYING)
- Secure authentication using JWT
- Scalable worker-based architecture

## Tech Stack
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| TypeScript | Language |
| Express.js | HTTP Server |
| PostgreSQL | Database |
| Prisma ORM | Database ORM |
| Redis | Queue Store |
| BullMQ | Job Queue |
| Resend API | Email Service |
| Docker | Containerization |

## System Architecture
User → API → Queue (Redis + BullMQ) → Worker → Database → Response

## Job Lifecycle
PENDING → PROCESSING → COMPLETED
PENDING → PROCESSING → FAILED
PENDING → PROCESSING → RETRYING → PROCESSING

## Project Structure
src/
controller/     # Request handlers
services/       # Business logic
routes/         # API route definitions
middleware/     # Auth & validation
worker/         # Job processors
queue/          # BullMQ queue setup
database/       # Prisma client
types/          # TypeScript types

## Setup Instructions

### 1. Clone Repository
```bash
git clone https://github.com/Sahil162005/distributed-task-scheduler.git
cd distributed-task-scheduler
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/user-auth
SECRET_KEY=your_secret_key
RESEND_API_KEY=your_resend_api_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
REDIS_URL=redis://localhost:6379
PORT=5007
```

### 4. Start Redis
```bash
docker run -d -p 6379:6379 --name redis redis
```

### 5. Setup Database
```bash
npx prisma migrate dev
npx prisma generate
```

### 6. Run the Server
```bash
npm run dev
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Register a new user |
| POST | /api/auth/login | Login and get JWT token |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/jobs | Submit a new job (auth required) |
| GET | /api/jobs/:id | Get job status (auth required) |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |

## Example Job Request

```json
{
  "job_type": "SEND_EMAIL",
  "payload": {
    "to": "example@gmail.com",
    "subject": "Test Email",
    "body": "Hello from the scheduler"
  }
}
```

## Testing
Use Postman or any API client:
1. Register a user via `POST /api/auth/signup`
2. Login and copy the JWT token
3. Submit a job via `POST /api/jobs` with Bearer token
4. Poll job status via `GET /api/jobs/:id`

## Contribution
- Implemented worker-based job execution
- Integrated external email service
- Designed job lifecycle and retry mechanism
- Developed and tested APIs
- Handled authentication and validation

## Future Improvements
- WebSocket integration for real-time updates
- Dashboard for monitoring jobs
- Multiple worker scaling
- Job prioritization and rate limiting

## License
This project is for academic and educational use.
