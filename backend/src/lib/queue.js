import "dotenv/config";
import { Queue } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: {},
});

export const reviewQueue = new Queue("code-review", { connection });

export { connection };
