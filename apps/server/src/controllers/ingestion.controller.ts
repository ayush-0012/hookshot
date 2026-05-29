import { db } from "@/db";
import { payload } from "@/db/schema";
import { testingWorker } from "@/services/worker.service";
import { tryCatch } from "@/utils/handlers/tryCatch";
import { redisClient } from "@/utils/redis";
import { Queue } from "bullmq";
import type { Request, Response } from "express";
import { uuid } from "../utils/uuid";

const payloadQueue = new Queue("payload-queue", {
  connection: redisClient,
});

export async function ingestion(req: Request, res: Response) {
  const { payloadBody, endpoint, eventType, apiKey, signingkey } = req.body;

  if (!apiKey && !signingkey) {
    return res
      .status(401)
      .json({ message: "Unauthorized, missing credentials" });
  }

  console.log("validating json ");

  // validating the payload
  const jsonString = JSON.stringify(payloadBody);
  const validateJson = JSON.parse(jsonString);

  if (!validateJson) return "Invalid Json";

  // we have to get the userId through the apiKey (since this req is coming from user backend to our service)
  const userId = "a9d27f18-5ad8-4192-af13-ebb6c8e48c95"; // hardcoded for testing for now

  // insert the payload in the db first
  const { data: payloadRes, error: insertErr } = await tryCatch(
    db.insert(payload).values({
      payloadBody,
      eventType,
      payloadStatus: null, // it'll be updated later, after the service has returned a res
      userId,
    }),
  );

  console.log("queuing starts");
  if (payloadRes !== null) {
    const job = await payloadQueue.add(
      "payload",
      { body: payloadBody, endpoint },
      { jobId: uuid() },
    );

    console.log("job id added to the queue", job?.id);

    const workerRes = testingWorker();
    console.log("worker res", workerRes);

    return res.status(200).json({ message: "added in queue" });
  } else {
    return res.status(500).json({ message: "error occured while queuing" });
  }
}
