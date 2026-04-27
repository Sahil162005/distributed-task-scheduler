import { createNewJob } from "../services/job.service.js";
import { getJobById } from "../services/job.service.js";
import { getJobsByUserId } from "../services/job.service.js";
import type{ Request ,Response } from "express";

type JobType = "SEND_EMAIL" | "SEND_MESSAGE" | "WEBHOOK_DELIVERY" | "WEBSITE_HEALTH_CHECK";

export const CreateJob=async(req:Request,res:Response)=>{
    const user_id=req.user?.id
    const { job_type, payload } = req.body as { job_type?: JobType; payload?: unknown };
    if(!user_id){
    
        return res.status(401).json({message:"Unauthorized"})
    }
    if (!job_type || !payload) {
        return res.status(400).json({ message: "Invalid request payload" });
    }
    try{
        const job= await createNewJob(user_id, payload, job_type);
        return res.status(201).json({message:"Job created",job})
    }
    catch(err: unknown){
        const errorMessage = err instanceof Error ? err.message : "Unable to create job";
        if (errorMessage === "User not found. Please login again.") {
            return res.status(401).json({ message: errorMessage });
        }
        return res.status(400).json({message:errorMessage})
    }
}

export const GetJobById = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const rawJobId = req.params.id;
    const jobId = Array.isArray(rawJobId) ? rawJobId[0] : rawJobId;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (!jobId) {
        return res.status(400).json({ message: "Invalid job id" });
    }

    try {
        const job = await getJobById(jobId);

        if (job === null) {
            return res.status(404).json({ message: "Job not found" });
        }

        if (job.user_id !== userId) {
            return res.status(403).json({ message: "Forbidden" });
        }

        return res.status(200).json({ job });
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unable to fetch job";
        return res.status(400).json({ message: errorMessage });
    }
};

export const GetMyJobs = async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const jobs = await getJobsByUserId(userId);
        return res.status(200).json({ jobs });
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unable to fetch jobs";
        if (errorMessage === "User not found. Please login again.") {
            return res.status(401).json({ message: errorMessage });
        }
        return res.status(400).json({ message: errorMessage });
    }
};