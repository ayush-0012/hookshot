import Redis from "ioredis";

// configure using environment variables if available
export const redisClient = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6378,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// handle error events to prevent unhandled exceptions
redisClient.on("error", (err) => {
  console.error("[ioredis] error", err);
});
