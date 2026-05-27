import { db } from "@/db";
import { endpoint } from "@/db/schema";
import { encryptData, generateSigningKey } from "@/utils/crypto";
import { getUserId } from "@/utils/general/getUser";
import { tryCatch } from "@/utils/handlers/tryCatch";
import type { Request, Response } from "express";

export async function createUserEndpoint(req: Request, res: Response) {
  // one endpoint can have multiple event types, so event type will be an array (must validate)
  const { endpoint: endpointUrl, eventTypes } = req.body;

  if (!Array.isArray(eventTypes)) {
    return res
      .status(422)
      .json({ message: "Saying EventTypes is not an array" });
  }

  const userId = await getUserId(req);
  const signingKey = generateSigningKey();
  const encryptedSigningKey = encryptData(signingKey);

  const { data: endpointRes, error } = await tryCatch(
    db
      .insert(endpoint)
      .values({
        url: endpointUrl,
        eventTypes,
        encryptedSigningKey,
        userId,
      })
      .returning(),
  );

  const endpointId = endpointRes[0].id;

  if (endpointRes) {
    return res.status(201).json({
      message: "Endpoint created successfully",
      endpointId,
      signingKey,
    });
  }

  if (error) {
    return res.status(500).json({
      message: "Error occurred while creating endpoint",
      error,
    });
  }
}
