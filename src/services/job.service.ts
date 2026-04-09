import prisma from "../database/prisma.js";
import { jobQueue } from "../queue/queue.js";

type JobType = "SEND_EMAIL" | "SEND_MESSAGE";

export const createNewJob = async (user_id: string, payload: unknown, job_type: JobType) => {
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
    return prisma.job.findMany({
        where: { user_id: userId },
        orderBy: {
            created_at: "desc",
        },
    });
};

export default createNewJob;
