import prisma from "../database/prisma.js";
import { jobQueue } from "../queue/queue.js";

type JobType = "SEND_EMAIL" | "SEND_MESSAGE" | "WEBHOOK_DELIVERY" | "WEBSITE_HEALTH_CHECK";

const ensureUserExists = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
    });

    if (!user) {
        throw new Error("User not found. Please login again.");
    }
};

export const createNewJob = async (user_id: string, payload: unknown, job_type: JobType) => {
    await ensureUserExists(user_id);

    const job = await prisma.job.create({
        data: {
            job_type,
            payload: payload as object,
            user_id,
        },
    });

    await jobQueue.add(job_type, job, {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 2000,
        },
    });

    return job;
};

export const getJobById = async (id: string) => {
    return prisma.job.findUnique({
        where: { id },
    });
};

export const getJobsByUserId = async (userId: string) => {
    await ensureUserExists(userId);

    return prisma.job.findMany({
        where: { user_id: userId },
        orderBy: {
            created_at: "desc",
        },
    });
};

export default createNewJob;
