import { db } from "@/db";
import { endpoint, payload } from "@/db/schema";
import { queue, retryQueue } from "@/utils/constants";
import { tryCatch } from "@/utils/handlers/tryCatch";
import { redisClient } from "@/utils/redis";
import { Queue } from "bullmq";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { uuid } from "../utils/general/uuid";

const payloadQueue = new Queue(queue, {
  connection: redisClient,
});

export async function ingestion(req: Request, res: Response) {
  const { payloadBody, eventType, endpointId } = req.body;

  if (!endpointId) {
    return res.status(401).json({ message: "EndpointId is missing" });
  }

  if (!eventType) {
    return res.status(401).json({ message: "Event type is missing" });
  }

  if (!payloadBody) {
    return res.status(401).json({ message: "Payload data is missing" });
  }

  console.log("validating json ");

  // validating the payload
  const jsonString = JSON.stringify(payloadBody);
  const validateJson = JSON.parse(jsonString);

  if (!validateJson) return "Invalid Json";

  // we have to get the userId through the apiKey (since this req is coming from user backend to our service)
  const userId = "a9d27f18-5ad8-4192-af13-ebb6c8e48c95"; // hardcoded for testing for now

  // insert the payload in the db first
  const { data: payloadRes } = await tryCatch(
    db
      .insert(payload)
      .values({
        payloadBody,
        eventType,
        payloadStatus: null, // it'll be updated later, after the service has returned a res
        userId,
      })
      .returning(),
  );

  const payloadId = payloadRes[0].id;

  console.log("queuing starts");
  if (payloadRes !== null) {
    const job = await payloadQueue.add(
      "payload",
      { body: payloadBody, payloadId, eventType, endpointId, ip: req.ip },
      {
        jobId: uuid(),
        attempts: 3,
        backoff: { type: "exponential", delay: 10000 },
      },
    );

    console.log("job id added to the queue", job?.id);

    return res.status(200).json({ message: "added in queue" });
  } else {
    return res.status(500).json({ message: "error occured while queuing" });
  }
}

export async function retryJob(req: Request, res: Response) {
  const {
    id: logId,
    endpoint_id: endpointId,
    payload_id: payloadId,
  } = req.body;

  if (!logId) {
    return res.status(400).json({ message: "Log ID is missing" });
  }

  if (!endpointId) {
    return res.status(400).json({ message: "Endpoint ID is missing" });
  }

  if (!payloadId) {
    return res.status(400).json({ message: "Payload ID is missing" });
  }

  // Parallely making db calls to get the url and payloadBody
  const [
    { data: endpointRes, error: endpointErr },
    { data: payloadRes, error: payloadErr },
  ] = await Promise.all([
    tryCatch(
      db
        .select({ url: endpoint.url, eventTypes: endpoint.eventTypes })
        .from(endpoint)
        .where(eq(endpoint.id, endpointId)),
    ),
    tryCatch(
      db
        .select({ payloadBody: payload.payloadBody })
        .from(payload)
        .where(eq(payload.id, payloadId)),
    ),
  ]);

  if (endpointErr || !endpointRes?.length) {
    return res.status(404).json({ message: "Endpoint not found" });
  }

  if (payloadErr || !payloadRes?.length) {
    return res.status(404).json({ message: "Payload not found" });
  }

  const endpointUrl = endpointRes[0]?.url;
  const eventTypes = endpointRes[0]?.eventTypes;
  const payloadBody = payloadRes[0]?.payloadBody;

  console.log("url and payload", endpointUrl, eventTypes, payloadBody);

  // After getting data, add the job into queue with the data
  const job = await payloadQueue.add(
    retryQueue,
    {
      body: payloadBody,
      payloadId,
      eventTypes,
      endpointId,
      ip: req.ip,
    },
    {
      jobId: uuid(),
      attempts: 1,
      backoff: { type: "exponential", delay: 10000 },
    },
  );

  console.log("job id added to the queue for retry", job?.id);

  return res.status(200).json({
    message: "Added to the queue successfully",
  });
}
