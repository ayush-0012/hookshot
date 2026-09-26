import { db } from "@/db";
import { users } from "@/db/schema";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import type { Request } from "express";
import { AppError } from "../handlers/responseHandler";
import { tryCatch } from "../handlers/tryCatch";

// getting the userId using the clerkId
export async function getUserId(req: Request) {
  const auth = getAuth(req);

  if (!auth.userId) {
    throw new AppError(401, "User not authenticated");
  }

  // db call to get the userId from this clerkId

  const res = await tryCatch(
    db
      .select({
        userId: users.id,
      })
      .from(users)
      .where(eq(users.clerkId, auth.userId)),
  );

  if (res.error) {
    throw new AppError(500, "Failed to fetch user");
  }

  if (!res.data?.[0]) {
    throw new AppError(404, "User not found. Please sign in again.");
  }

  return res.data[0].userId;
}
