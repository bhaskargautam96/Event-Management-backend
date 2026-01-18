import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export const mailQueue = new Queue("mail-queue", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    
    removeOnComplete: true, // 🔥 auto cleanup
    removeOnFail: false, // keep failed jobs
  },
});

