import { Worker } from "bullmq";
import type { Job } from "bullmq";
import type { RedisOptions } from "ioredis";
import { Status } from "@prisma/client";
import prisma from "../database/prisma.js";

type WorkerJobData = {
    id: string;
    job_type: "SEND_EMAIL" | "SEND_MESSAGE";
    payload: unknown;
};

const redisConnection: RedisOptions = {
    host: "localhost",
    port: 6379,
};

const processJobByType = async (jobData: WorkerJobData) => {
    switch (jobData.job_type) {
        case "SEND_EMAIL":
            return {
                message: "SEND_EMAIL processed",
                payload: jobData.payload,
            };
        case "SEND_MESSAGE":
            return {
                message: "SEND_MESSAGE processed",
                payload: jobData.payload,
            };
        default:
            throw new Error("Unsupported job type");
    }
};

export const jobWorker = new Worker(
    "jobs",
    async (queueJob: Job<WorkerJobData>) => {
        const jobData = queueJob.data;

        await prisma.job.update({
            where: { id: jobData.id },
            data: {
                status: Status.PROCESSING,
                started_at: new Date(),
                error: null,
            },
        });

        try {
            const result = await processJobByType(jobData);

            await prisma.job.update({
                where: { id: jobData.id },
                data: {
                    status: Status.COMPLETED,
                    completed_at: new Date(),
                    result,
                },
            });

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown processing error";

            const dbJob = await prisma.job.findUnique({
                where: { id: jobData.id },
                select: {
                    retry_count: true,
                    max_retries: true,
                },
            });

            if (!dbJob) {
                throw new Error(`Job not found in DB: ${jobData.id}`);
            }

            if (dbJob.retry_count < dbJob.max_retries) {
                await prisma.job.update({
                    where: { id: jobData.id },
                    data: {
                        status: Status.RETRYING,
                        retry_count: {
                            increment: 1,
                        },
                        error: errorMessage,
                    },
                });

                throw error;
            }

            await prisma.job.update({
                where: { id: jobData.id },
                data: {
                    status: Status.FAILED,
                    completed_at: new Date(),
                    error: errorMessage,
                },
            });

            throw error;
        }
    },
    {
        connection: redisConnection,
    }
);

jobWorker.on("ready", () => {
    console.log("Worker is listening to jobs queue");
});

jobWorker.on("failed", (queueJob, error) => {
    console.error(`Queue job ${queueJob?.id ?? "unknown"} failed:`, error.message);
});

export default jobWorker;
