import { db } from "@/db";
import { users } from "@/db/schema";
import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import type { Request } from "express";
import { tryCatch } from "../handlers/tryCatch";

// getting the userId using the clerkId
export async function getUserId(req: Request) {
  const auth = getAuth(req);
  console.log("in the get userid helper", auth.userId); //clerkId

  if (!auth.userId) {
    throw new Error("User not authenticated");
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

  return res.data[0].userId;
}
