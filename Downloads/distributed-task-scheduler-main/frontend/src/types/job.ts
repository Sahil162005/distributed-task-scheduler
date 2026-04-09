export type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "RETRYING";

export type JobType = "SEND_EMAIL" | "SEND_MESSAGE";

export type Job = {
  id: string;
  user_id: string;
  job_type: JobType;
  payload: Record<string, unknown>;
  status: JobStatus;
  retry_count: number;
  max_retries: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  result: unknown;
  error: string | null;
};

export type JobStatusEvent = {
  jobId: string;
  status: JobStatus;
  retryCount: number;
  error: string | null;
  result: unknown;
  startedAt: string | null;
  completedAt: string | null;
};
