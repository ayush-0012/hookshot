import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { generateApiKey, generateHash } from "@/utils/general/crypto";
import { getUserId } from "@/utils/general/getUser";
import { desc, eq } from "drizzle-orm";
import type { Request, Response } from "express";

export async function createApiKey(req: Request, res: Response) {
  const { keyName } = req.body;

  console.log("token in headers", req.headers.authorization);
  // Generating api key and hashing it
  const generatedKey = generateApiKey();
  const hashedKey = generateHash(generatedKey);

  try {
    const userId = await getUserId(req);

    // db call to insert hashed api key
    const [apiKey] = await db
      .insert(apiKeys)
      .values({
        hashedApiKey: hashedKey,
        keyName,
        userId,
        expiresAt: null, // default no auto expire
      })
      .returning({
        id: apiKeys.id,
        keyName: apiKeys.keyName,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
      });

    return res
      .status(201)
      .json({ success: true, apiKey: generatedKey, data: apiKey });
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
}

export async function getApiKeys(req: Request, res: Response) {
  try {
    const userId = await getUserId(req);

    const keys = await db
      .select({
        id: apiKeys.id,
        keyName: apiKeys.keyName,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(desc(apiKeys.createdAt));

    return res.status(200).json({ success: true, data: keys });
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
}
