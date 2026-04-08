import type{ Request ,Response,NextFunction } from "express";
const isValidEmail= (email:string)=>{
    const valid=/^[a-zA-Z0-9-+_.]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

    const result= valid.test(email);
    return result
}
const validateSendEmail=(payload:any)=>{
    const to= payload.to;
    const subject=payload.subject;
    const body=payload.body;
    if(!to||!subject||!body){
        return "Fill all the fields";
    }
    if(!isValidEmail(to)){
        return "Invalid Email";
    }
    
    return null
}
const validateSendMessage=(payload:any)=>{
    const chatId = payload.chatId
    const message = payload.message
    if(!chatId||!message){
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