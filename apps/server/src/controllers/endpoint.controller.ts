import { db } from "@/db";
import { endpoint, logs } from "@/db/schema";
import { encryptData, generateSigningKey } from "@/utils/general/crypto";
import { getUserId } from "@/utils/general/getUser";
import { tryCatch } from "@/utils/handlers/tryCatch";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";

export async function createUserEndpoint(req: Request, res: Response) {
  // one endpoint can have multiple event types, so event type will be an array (must validate)
  const { endpoint: endpointUrl, eventTypes } = req.body;

  if (!Array.isArray(eventTypes)) {
    return res
      .status(422)
      .json({ message: "Saying EventTypes is not an array" });
  }

  // const userId = await getUserId(req);
  const signingKey = generateSigningKey();
  const encryptedSigningKey = encryptData(signingKey);

  const { data: endpointRes, error } = await tryCatch(
    db
      .insert(endpoint)
      .values({
        url: endpointUrl,
        eventTypes,
        encryptedSigningKey,
        userId: "a9d27f18-5ad8-4192-af13-ebb6c8e48c95",
      })
      .returning(),
  );

  if (endpointRes) {
    return res.status(201).json({
      message: "Endpoint created successfully",
      id: endpointRes[0].id,
    });
  }

  if (error) {
    return res.status(500).json({
      message: "Error occurred while creating endpoint",
      error,
    });
  }
}

// to fetch all the webhooks of the user along with their status
export async function fetchUserWebhooks(req: Request, res: Response) {
  if (!req.headers.authorization) return res.status(401);

  const userId = await getUserId(req);

  // db call to fetch the logs
  const { data: logsResult, error: fetchErr } = await tryCatch(
    db
      .select({
        id: logs.id,
        endpointUrl: endpoint.url,
        statusCode: logs.statusCode,
        attemptNumber: logs.attemptNumber,
        endpointResponse: logs.endpointResponse,
        failureCategory: logs.failureCategory,
        failureReason: logs.failureReason,
        startedAt: logs.startedAt,
        finishedAt: logs.finishedAt,
      })
      .from(logs)
      .innerJoin(endpoint, eq(logs.endpointId, endpoint.id))
      .where(eq(logs.userId, userId)),
  );

  if (fetchErr) {
    return res
      .status(400)
      .json({ message: `Failed to fetch the logs ${fetchErr}` });
  }

  return res.status(200).json({ logs: logsResult });
}
