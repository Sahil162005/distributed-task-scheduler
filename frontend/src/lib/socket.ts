import { io } from "socket.io-client";
import type { JobStatusEvent } from "../types/job";

export const socket = io("http://localhost:5007", {
  autoConnect: false,
  withCredentials: true,
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export const subscribeToJob = (jobId: string) => {
  socket.emit("subscribe:job", jobId);
  socket.emit("subscribe", jobId);
  socket.emit("subscribe", { jobId });
};

export const onJobUpdate = (handler: (event: JobStatusEvent) => void) => {
  const wrapped = (payload: JobStatusEvent) => handler(payload);

  socket.on("job:update", wrapped);
  socket.on("job:status", wrapped);

  return () => {
    socket.off("job:update", wrapped);
    socket.off("job:status", wrapped);
  };
};

export default socket;
