import IORedis from "ioredis";
export const redisConnection = new IORedis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,

  // Required for BullMQ
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});
redisConnection.on("connect", () => {
  console.log("✅ Redis connected");
});

redisConnection.on("ready", () => {
  console.log("🚀 Redis ready");
});

redisConnection.on("error", (err) => {
  console.error("❌ Redis error", err);
});
