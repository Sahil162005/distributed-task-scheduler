import prisma from "../database/prisma.js";
import { jobQueue } from "../queue/queue.js";

export const createNewJob = async (user_id: string, payload: any, job_type: string) => {
    const job = await prisma.job.create({
        data: {
            job_type,
            payload,
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

export default createNewJob;
