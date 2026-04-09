import type { NextFunction } from "express";
import type { Request,Response } from "express";
import jwt from "jsonwebtoken";
import type { JwtUserPayload } from "../types/auth.js";

export const AuthMiddle= (req:Request,res:Response,next:NextFunction)=>{
    const authHeader = req.headers.authorization;
    const cookieToken = typeof req.cookies?.token === "string" ? req.cookies.token : null;
    let token: string | null = null;

    if (authHeader) {
        const parts = authHeader.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({ message: "Invalid Token" });
        }

        const parsedToken = parts[1];
        if (!parsedToken) {
            return res.status(401).json({ message: "Invalid Token" });
        }

        token = parsedToken;
    } else if (cookieToken) {
        token = cookieToken;
    } else {
        return res.status(401).json({ message: "Authorization header missing" });
    }

    if(token === null || token.length === 0){
        return res.status(401).json({ message: "Invalid Token" });
    }
    const secretKey = process.env.SECRET_KEY;
    if(!secretKey){
        return res.status(500).json({message : "Invalid secret key"});
    }
    try{
        const verified = jwt.verify(token, secretKey) as JwtUserPayload;
        req.user=verified;
        return next();
    }
    catch(err){
         return res.status(401).json({ message: "Invalid or expired token" });
    }
}