import type { NextFunction } from "express";
import type { Request,Response } from "express";
import jwt from "jsonwebtoken";
import type { JwtUserPayload } from "../types/auth.js";
import prisma from "../database/prisma.js";

export const AuthMiddle= async (req:Request,res:Response,next:NextFunction)=>{
    const authHeader = req.headers.authorization;
    const cookieToken = typeof req.cookies?.token === "string" ? req.cookies.token : null;
    let token: string | null = null;
    let tokenSource: "header" | "cookie" | null = null;

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
        tokenSource = "header";
    } else if (cookieToken) {
        token = cookieToken;
        tokenSource = "cookie";
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

    const clearCookieIfNeeded = () => {
        if (tokenSource === "cookie") {
            res.clearCookie("token", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
            });
        }
    };

    try{
        const verified = jwt.verify(token, secretKey) as JwtUserPayload;

        if (!verified || typeof verified.id !== "string") {
            clearCookieIfNeeded();
            return res.status(401).json({ message: "Invalid token payload" });
        }

        const user = await prisma.user.findUnique({
            where: { id: verified.id },
            select: { id: true, role: true },
        });

        if (!user) {
            clearCookieIfNeeded();
            return res.status(401).json({ message: "User no longer exists, please log in again" });
        }

        req.user={
            id: user.id,
            role: user.role,
        };
        return next();
    }
    catch(err){
         clearCookieIfNeeded();
         return res.status(401).json({ message: "Invalid or expired token" });
    }
}