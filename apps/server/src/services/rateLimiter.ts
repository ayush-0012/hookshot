import { redisClient } from "@/utils/redis";
import type { NextFunction, Request, Response } from "express";

// fixed window / request counter rate limiter using Redis
export async function rateLimiter(
  ip: string | undefined,
  limit: number,
): Promise<number> {
  if (!ip) return 0;

  const key = `ratelimit:${ip}`;

  // Increment the request counter for the IP in Redis
  const currentRequests = await redisClient.incr(key);

  if (currentRequests === 1) {
    await redisClient.expire(key, 60);
  }

  if (currentRequests > limit) {
    return 429;
  }

  return currentRequests;
}

export async function rateLimiterMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.ip) return 0;

  const limit = 10;

  const key = `ratelimit:ingestion:${req.ip}`;

  // Increment the request counter for the IP in Redis
  const currentRequests = await redisClient.incr(key);

  if (currentRequests === 1) {
    await redisClient.expire(key, 60);
  }

  if (currentRequests > limit) {
    return res.status(429).json({ message: "Too Many Requests" });
  }

  next();
}
