import { Queue } from "bullmq";
import type { RedisOptions } from "ioredis";

const getRedisConnection = (): RedisOptions => {
	const redisUrl = process.env.REDIS_URL;

	if (!redisUrl) {
		return {
			host: "localhost",
			port: 6379,
		};
	}

	const parsedUrl = new URL(redisUrl);

	return {
		host: parsedUrl.hostname,
		port: Number(parsedUrl.port || "6379"),
		username: parsedUrl.username || undefined,
		password: parsedUrl.password || undefined,
	};
};

const redisConnection = getRedisConnection();

export const jobQueue = new Queue("jobs", {
	connection: redisConnection,
});

export default jobQueue;
