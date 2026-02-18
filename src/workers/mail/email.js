import "dotenv/config";
import { Worker } from "bullmq";
import { redisConnection } from "../../config/redis.js";
import { sendMail } from "../../services/email/mail.service.js";


const mailWorker = new Worker(
  "mail-queue",
  async (job) => {
    const { to, subject, html, redisKey } = job.data;
    console.log("worker", job.id);
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
    limiter: {
      max: 100, // 100 jobs
      duration: 2000, // per 2 second
    },
  }
);

mailWorker.on("completed", (job) => {
  // console.log("job",job);
  // console.log(`✅ Mail job completed: ${JSON.stringify(job)}`);
});

mailWorker.on("failed", (job, err) => {
  console.error(`❌ Mail job failed: ${job.id}`, err);
});
