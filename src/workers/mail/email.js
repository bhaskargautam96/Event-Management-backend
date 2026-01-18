import "dotenv/config";
import { Worker } from "bullmq";
import { redisConnection } from "../../config/redis.js";


const mailWorker = new Worker(
  "mail-queue",
  async (job) => {
    const { to, subject, html, redisKey } = job.data;
    console.log("worker",job,redisKey)
    // 🔴 STEP 3: Send email
    // await sendMail({ to, subject, html });

    // 🔴 STEP 4: REMOVE Redis cache/flag AFTER success
    // if (redisKey) {
    //   await redisConnection.del(redisKey);
    //   console.log("🧹 Redis flag removed:", redisKey);
    // }

    return { success: true };
  },
  {
    connection: redisConnection,
    concurrency: 2, // Gmail safe
  }
);

mailWorker.on("completed", (job) => {
  console.log(`✅ Mail job completed: ${job.id}`);
});

mailWorker.on("failed", (job, err) => {
  console.error(`❌ Mail job failed: ${job.id}`, err);
});
