import { db } from "@/db";
import { endpoint, logs } from "@/db/schema";
import { encryptData, generateSigningKey } from "@/utils/general/crypto";
import { getUserId } from "@/utils/general/getUser";
import { AppError } from "@/utils/handlers/responseHandler";
import { tryCatch } from "@/utils/handlers/tryCatch";
import { createEndpointSchema } from "@/utils/validation/schemas";
import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";

export async function createUserEndpoint(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // one endpoint can have multiple event types, so event type will be an array (must validate)
  const parsed = createEndpointSchema.safeParse(req.body);

  if (!parsed.success) {
    return next(
      new AppError(
        422,
        "Invalid endpoint payload",
        parsed.error.issues.map((issue) => issue.message),
      ),
    );
  }

  const { endpoint: endpointUrl, eventTypes } = parsed.data;

  try {
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

    if (error || !endpointRes?.[0]) {
      return next(new AppError(500, "Error occurred while creating endpoint"));
    }

    return res.status(201).json({
      message: "Endpoint created successfully",
      id: endpointRes[0].id,
    });
  } catch (err) {
    return next(err);
  }
}

// to fetch all the webhooks of the user along with their status
export async function fetchUserWebhooks(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
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
      return next(new AppError(400, "Failed to fetch the logs"));
    }

    return res.status(200).json({ logs: logsResult });
  } catch (err) {
    return next(err);
  }
}
