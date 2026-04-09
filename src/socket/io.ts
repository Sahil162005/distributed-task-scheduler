import type { Server } from "socket.io";

type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "RETRYING";

type JobStatusEventPayload = {
    jobId: string;
    status: JobStatus;
    retryCount: number;
    error: string | null;
    result: unknown;
    startedAt: Date | null;
    completedAt: Date | null;
};

let ioInstance: Server | null = null;

export const initializeSocket = (io: Server) => {
    ioInstance = io;
};

export const emitJobStatusUpdate = (payload: JobStatusEventPayload) => {
    if (ioInstance === null) {
        return;
    }

    ioInstance.to(`job:${payload.jobId}`).emit("job:status", payload);
};
