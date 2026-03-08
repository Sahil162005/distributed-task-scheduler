import type{ Request ,Response,NextFunction } from "express";
const isValidEmail= (email:string)=>{
    const valid=/^[a-zA-Z0-9-+_.]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

    const result= valid.test(email);
    return result
}
export const ValidateSignup=(req:Request,res:Response,next:NextFunction)=>{
    const {name,email,password}=req.body;
    if(!name||!email||!password){
        return res.status(400).json({message:"Fill all the fields"})
    }
    if(!isValidEmail(email)){
        return res.status(400).json({message:"Invalid Email"})
    }
    if(name.length < 3){
        return res.status(400).json({message:"Name is too short"});
    }
    if(name.length >32){
        return res.status(400).json({message:"Maximum name length is 32 characters"});
    }
    if(password.length < 8){
         return res.status(400).json({message:"Minimum password length is 8 characters"});
    }
    if(password.length > 72){
        return res.status(400).json({message:"Maximum password length is 72 characters"});
    }
    next();
}

export const ValidateLogin =(req:Request,res:Response,next:NextFunction)=>{
    const {email,password}=req.body;
    if(!email||!password){
        return res.status(400).json({message:"Fill all the fields"})
    }
    if(!isValidEmail(email)){
        return res.status(400).json({message:"Invalid Email"})
    }
    if(password.length < 8){
         return res.status(400).json({message:"Minimum password length is 8 characters"});
    }
    if(password.length > 72){
        return res.status(400).json({message:"Maximum password length is 72 characters"});
    }
    next();
}