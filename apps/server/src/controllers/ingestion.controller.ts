import { redisClient } from "@/utils/redis";
import { Queue } from "bullmq";
import type { Request, Response } from "express";
import { uuid } from "../utils/uuid";

export function ingestion(req: Request, res: Response) {
  const { payload, endpoint } = req.body;

  // validating the payload
  const jsonString = JSON.stringify(payload);
  const validateJson = JSON.parse(jsonString);

  if (!validateJson) return "Invalid Json";

  // then payload will be enqued in bull and redis
  const payloadQueue = new Queue("payload-queue", { connection: redisClient });
  payloadQueue.add("payload", { payload, endpoint }, { jobId: uuid as any });
}
