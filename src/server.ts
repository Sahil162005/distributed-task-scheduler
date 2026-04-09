import http from "node:http";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import type { Request, Response } from "express";
import { Server } from "socket.io";
import authRoutes from "./routes/authroutes.js";
import jobRoutes from "./routes/jobroutes.js";
import { initializeSocket } from "./socket/io.js";
import "./worker/worker.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: FRONTEND_ORIGIN,
        credentials: true,
    },
});

initializeSocket(io);

app.use(express.json());
app.use(
    cors({
        origin: FRONTEND_ORIGIN,
        credentials: true,
    })
);
app.use(cookieParser());

io.on("connection", (socket) => {
    const subscribeToJob = (jobId: string) => {
        if (typeof jobId !== "string" || jobId.length === 0) {
            return;
        }

        socket.join(`job:${jobId}`);
    };

    socket.on("subscribe:job", (jobId: string) => {
        subscribeToJob(jobId);
    });

    socket.on("subscribe", (payload: { jobId?: string }) => {
        if (typeof payload?.jobId !== "string") {
            return;
        }

        subscribeToJob(payload.jobId);
    });
});

app.get("/health", (_req: Request, res: Response) => {
    return res.sendStatus(200);
});

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);

httpServer.listen(PORT, () => {
    console.log(`App is running on ${PORT}`);
});



