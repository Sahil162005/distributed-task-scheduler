import type { NextFunction } from "express";
import type { Request,Response } from "express";
import jwt from "jsonwebtoken";
import type { JwtUserPayload } from "../types/auth.js";

export const AuthMiddle= (req:Request,res:Response,next:NextFunction)=>{
    const authheader = req.headers['authorization']
    if(!authheader){
        return res.status(401).json({message : "Authorization header missing"})
    }
    const parts= authheader.split(" ")
    if(parts.length!==2 || parts[0]!=="Bearer"){
        return res.status(401).json({message : "Invalid Token"})
    }
    const token= parts[1]
    if(!token){
    return res.status(401).json({ message: "Invalid Token" })
    }
    const secret_key=process.env.SECRET_KEY
    if(!secret_key){
        return res.status(500).json({message : "Invalid secret key"})
    }
    try{
        const verified = jwt.verify(token,secret_key) as unknown as JwtUserPayload;
        req.user=verified;
        next();
    }
    catch(err){
         return res.status(401).json({ message: "Invalid or expired token" });
    }
}