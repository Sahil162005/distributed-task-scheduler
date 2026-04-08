import { Queue } from "bullmq";
import type { RedisOptions } from "ioredis";

const redisConnection: RedisOptions = {
	host: "localhost",
	port: 6379,
};

export const jobQueue = new Queue("jobs", {
	connection: redisConnection,
});

export default jobQueue;
