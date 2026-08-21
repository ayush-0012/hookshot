import { db } from "@/db";
import { apiKeys, endpoint } from "@/db/schema";
import { generateHash } from "@/utils/general/crypto";
import { tryCatch } from "@/utils/handlers/tryCatch";
import { and, eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";

type ValidateApiKeyBody = {
  apiKey: string;
  endpointId: string;
};

// check if the incoming request has an api key in the db (then only allow)
export async function validateApiKey(
  req: Request<{}, {}, ValidateApiKeyBody>,
  res: Response,
  next: NextFunction,
) {
  const { apiKey, endpointId } = req.body;

  if (!apiKey || !endpointId) {
    return res
      .status(400)
      .json({ message: "apiKey and endpointId are required" });
  }

  const { data: connectedUser, error: fetchErr } = await tryCatch(
    db
      .select({ userId: apiKeys.userId })
      .from(apiKeys)
      .innerJoin(
        endpoint,
        and(eq(apiKeys.userId, endpoint.userId), eq(endpoint.id, endpointId)),
      )
      .where(eq(apiKeys.hashedApiKey, generateHash(apiKey))),
  );

  if (fetchErr) {
    return res.status(500).json({ message: "Unable to validate API key" });
  }

  if (connectedUser.length === 0) {
    return res.status(401).json({ message: "Invalid API key" });
  }

  return next();
}
