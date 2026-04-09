import type{ Request ,Response,NextFunction } from "express";
const isValidEmail= (email:string)=>{
    const valid=/^[a-zA-Z0-9-+_.]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

    const result= valid.test(email);
    return result
}
const validateSendEmail=(payload: unknown)=>{
    if (typeof payload !== "object" || payload === null) {
        return "Fill all the fields";
    }

    const value = payload as Record<string, unknown>;
    const to= value.to;
    const subject=value.subject;
    const body=value.body;
    if(!to||!subject||!body){
        return "Fill all the fields";
    }
    if(typeof to !== "string" || typeof subject !== "string" || typeof body !== "string"){
        return "Fill all the fields";
    }
    if(!isValidEmail(to)){
        return "Invalid Email";
    }
    
    return null
}
const validateSendMessage=(payload: unknown)=>{
    if (typeof payload !== "object" || payload === null) {
        return "Fill all the fields";
    }

    const value = payload as Record<string, unknown>;
    const chatId = value.chatId
    const message = value.message
    if(!chatId||!message){
        return "Fill all the fields"
    }
    if(typeof chatId !== "string" || typeof message !== "string"){
        return "Fill all the fields"
    }
    return null
}
export const validateJobtype=(req:Request,res:Response,next:NextFunction)=>{
    const {payload,job_type}=req.body
    if(job_type==="SEND_MESSAGE"){
       const result= validateSendMessage(payload);
       if(result!==null){
        return res.status(400).json({message:`${result}`})
       }
        
    }
    else if(job_type==="SEND_EMAIL"){
       const result= validateSendEmail(payload)
        if(result!==null){
        return res.status(400).json({message:`${result}`})
       }     
    }
    else{
        return res.status(400).json({message:"Invalid Job Type"})
    }
    next();
}