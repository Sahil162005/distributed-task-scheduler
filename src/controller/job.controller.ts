import { createNewJob } from "../services/job.service.js";
import { getJobById } from "../services/job.service.js";
import type{ Request ,Response } from "express";

type JobType = "SEND_EMAIL" | "SEND_MESSAGE";

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
        return res.status(400).json({message:errorMessage})
    }
}

export const GetJobById = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const jobId = req.params.id;

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