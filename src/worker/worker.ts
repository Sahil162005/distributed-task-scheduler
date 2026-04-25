import { Worker } from "bullmq";
import type { Job } from "bullmq";
import type { RedisOptions } from "ioredis";
import TelegramBot from "node-telegram-bot-api";
import { Resend } from "resend";
import prisma from "../database/prisma.js";
import { emitJobStatusUpdate } from "../socket/io.js";

type WorkerJobData = {
    id: string;
    job_type: "SEND_EMAIL" | "SEND_MESSAGE" | "WEBHOOK_DELIVERY" | "WEBSITE_HEALTH_CHECK";
    payload: unknown;
};

type SendEmailPayload = {
    to: string;
    subject: string;
    body: string;
};

type SendMessagePayload = {
    chatId: string;
    message: string;
};

type WebhookDeliveryPayload = {
    url: string;
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    headers: Record<string, string>;
    body: string;
};

type WebsiteHealthCheckPayload = {
    url: string;
    expectedStatus: number;
};

const getRedisConnection = (): RedisOptions => {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
        return {
            host: "localhost",
            port: 6379,
        };
    }

    const parsedUrl = new URL(redisUrl);

    return {
        host: parsedUrl.hostname,
        port: Number(parsedUrl.port || "6379"),
        username: parsedUrl.username || undefined,
        password: parsedUrl.password || undefined,
    };
};

const redisConnection = getRedisConnection();

const parseSendEmailPayload = (payload: unknown): SendEmailPayload => {
    if (typeof payload !== "object" || payload === null) {
        throw new Error("Invalid SEND_EMAIL payload");
    }

    const value = payload as Record<string, unknown>;

    if (
        typeof value.to !== "string" ||
        typeof value.subject !== "string" ||
        typeof value.body !== "string"
    ) {
        throw new Error("Invalid SEND_EMAIL payload fields");
    }

    return {
        to: value.to,
        subject: value.subject,
        body: value.body,
    };
};

const parseSendMessagePayload = (payload: unknown): SendMessagePayload => {
    if (typeof payload !== "object" || payload === null) {
        throw new Error("Invalid SEND_MESSAGE payload");
    }

    const value = payload as Record<string, unknown>;

    if (typeof value.chatId !== "string" || typeof value.message !== "string") {
        throw new Error("Invalid SEND_MESSAGE payload fields");
    }

    return {
        chatId: value.chatId,
        message: value.message,
    };
};

const parseWebhookDeliveryPayload = (payload: unknown): WebhookDeliveryPayload => {
    if (typeof payload !== "object" || payload === null) {
        throw new Error("Invalid WEBHOOK_DELIVERY payload");
    }
    const value = payload as Record<string, unknown>;
    if (typeof value.url !== "string" || typeof value.method !== "string") {
        throw new Error("Invalid WEBHOOK_DELIVERY payload fields");
    }
    return {
        url: value.url,
        method: (value.method as WebhookDeliveryPayload["method"]) ?? "POST",
        headers: (value.headers as Record<string, string>) ?? {},
        body: typeof value.body === "string" ? value.body : "",
    };
};

const parseWebsiteHealthCheckPayload = (payload: unknown): WebsiteHealthCheckPayload => {
    if (typeof payload !== "object" || payload === null) {
        throw new Error("Invalid WEBSITE_HEALTH_CHECK payload");
    }
    const value = payload as Record<string, unknown>;
    if (typeof value.url !== "string") {
        throw new Error("Invalid WEBSITE_HEALTH_CHECK payload fields");
    }
    return {
        url: value.url,
        expectedStatus: typeof value.expectedStatus === "number" ? value.expectedStatus : 200,
    };
};

const processJobByType = async (jobData: WorkerJobData) => {
    switch (jobData.job_type) {
        case "SEND_EMAIL": {
            const resendApiKey = process.env.RESEND_API_KEY;
            const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

            if (!resendApiKey) {
                throw new Error("RESEND_API_KEY is missing");
            }

            const payload = parseSendEmailPayload(jobData.payload);
            const resend = new Resend(resendApiKey);

            await resend.emails.send({
                from: fromEmail,
                to: [payload.to],
                subject: payload.subject,
                html: payload.body,
            });

            return {
                message: "Email sent successfully",
                to: payload.to,
            };
        }
        case "SEND_MESSAGE": {
            const token = process.env.TELEGRAM_BOT_TOKEN;

            if (!token) {
                throw new Error("TELEGRAM_BOT_TOKEN is missing");
            }

            const payload = parseSendMessagePayload(jobData.payload);
            const bot = new TelegramBot(token, { polling: false });

            await bot.sendMessage(payload.chatId, payload.message);

            return {
                message: "Message sent successfully",
                chatId: payload.chatId,
            };
        }
        case "WEBHOOK_DELIVERY": {
            const payload = parseWebhookDeliveryPayload(jobData.payload);
            const requestInit: RequestInit = {
                method: payload.method,
                headers: {
                    "Content-Type": "application/json",
                    ...payload.headers,
                },
            };

            if (["POST", "PUT", "PATCH"].includes(payload.method)) {
                requestInit.body = payload.body;
            }

            const response = await fetch(payload.url, requestInit);
            return {
                message: "Webhook delivered",
                url: payload.url,
                statusCode: response.status,
                ok: response.ok,
            };
        }
        case "WEBSITE_HEALTH_CHECK": {
            const payload = parseWebsiteHealthCheckPayload(jobData.payload);
            const startTime = Date.now();
            const response = await fetch(payload.url, { method: "GET" });
            const responseTime = Date.now() - startTime;
            const isHealthy = response.status === payload.expectedStatus;
            return {
                message: isHealthy ? "Site is healthy" : "Site returned unexpected status",
                url: payload.url,
                statusCode: response.status,
                expectedStatus: payload.expectedStatus,
                responseTimeMs: responseTime,
                healthy: isHealthy,
            };
        }
        default:
            throw new Error("Unsupported job type");
    }
};

type JobUpdateData = Parameters<typeof prisma.job.update>[0]["data"];

const updateJobAndEmitStatus = async (jobId: string, data: JobUpdateData) => {
    const updatedJob = await prisma.job.update({
        where: { id: jobId },
        data,
    });

    emitJobStatusUpdate({
        jobId: updatedJob.id,
        status: updatedJob.status,
        retryCount: updatedJob.retry_count,
        error: updatedJob.error,
        result: updatedJob.result,
        startedAt: updatedJob.started_at,
        completedAt: updatedJob.completed_at,
    });

    return updatedJob;
};

export const jobWorker = new Worker(
    "jobs",
    async (queueJob: Job<WorkerJobData>) => {
        const jobData = queueJob.data;

        await updateJobAndEmitStatus(jobData.id, {
            status: "PROCESSING",
            started_at: new Date(),
            error: null,
        });

        try {
            const result = await processJobByType(jobData);

            await updateJobAndEmitStatus(jobData.id, {
                status: "COMPLETED",
                completed_at: new Date(),
                result: result as object,
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
                await updateJobAndEmitStatus(jobData.id, {
                    status: "RETRYING",
                    retry_count: {
                        increment: 1,
                    },
                    error: errorMessage,
                });

                throw error;
            }

            await updateJobAndEmitStatus(jobData.id, {
                status: "FAILED",
                completed_at: new Date(),
                error: errorMessage,
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
