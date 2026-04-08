import prisma from "../database/prisma.js";

export const createNewJob = async (user_id: string, payload: any, job_type: string) => {
    const job = await prisma.job.create({
        data: {
            job_type,
            payload,
            user_id,
        },
    });

    return job;
};

export default createNewJob;
