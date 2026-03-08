import express  from "express";
import dotenv from 'dotenv';
import type { Request ,Response } from "express";
import authRoutes from './routes/authroutes.js'
dotenv.config();
const app=express();
const PORT=process.env.PORT || 5000;
app.use(express.json());

app.get('/health',(req:Request,res:Response)=>{
    res.sendStatus(200);
})
app.use('/api/auth',authRoutes)
app.listen(PORT,()=>console.log(`App is running on ${PORT}`));



