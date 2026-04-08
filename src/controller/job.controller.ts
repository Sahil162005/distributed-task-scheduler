import { createNewJob } from "../services/job.service.js";
import type{ Request ,Response } from "express";

export const CreateJob=async(req:Request,res:Response)=>{
    const user_id=req.user?.id
    const{job_type,payload}=req.body
    if(!user_id){
    
        return res.status(401).json({message:"Unauthorized"})
    }
    try{
        const job= await createNewJob(user_id,payload,job_type);
        return res.status(201).json({message:"Job created",job})
    }
    catch(err:any){
        return res.status(400).json({message:err.message})
    }
}