import { CreateUser } from "../services/auth.service.js";
import { LoginUser} from "../services/auth.service.js";
import type{ Request ,Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

export const SignUp= async(req:Request,res:Response)=>{
    console.log("SignUp controller running", req.body);
    const {email,password,name}=req.body
    try{
        const user= await CreateUser(email,password,name);
        return res.status(201).json({message:"Account created"});
    }
    catch(err:any){
       return res.status(400).json({message:err.message});
    }
}
export const Login=async(req:Request,res:Response)=>{
    const {email,password}=req.body
    try{
        const user= await LoginUser(email,password);
        const secret=process.env.SECRET_KEY;
        if(!secret){
            return res.status(500).json({message:"Secret key missing"});
        }
        const payload={
            id:user.id,
            role:user.role
        }
        const token= jwt.sign(payload,secret, {expiresIn: '24h'});
        return res.status(200).json({user,token});
    }
    catch(err:any){
        return res.status(400).json({message:err.message});
    }
}
