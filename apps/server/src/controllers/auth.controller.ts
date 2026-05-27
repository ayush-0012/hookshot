import { db } from "@/db";
import { users } from "@/db/schema";
import { getUserId } from "@/utils/general/getUser";
import { tryCatch } from "@/utils/handlers/tryCatch";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";

export async function insertUser(req: Request, res: Response) {
  const { clerkId, userName, email, status } = req.body;

  await getUserId(req);

  // checking if user already exists
  const existingUser = await tryCatch(
    db.select().from(users).where(eq(users.clerkId, clerkId)),
  );

  console.log("existing user", existingUser);

  if (Array.isArray(existingUser) && existingUser.length == 0) {
    const res = await tryCatch(
      db.insert(users).values({
        clerkId,
        userName,
        status,
        email,
      }),
    );
  } else {
    return res.status(200).json({
      success: true,
      message: "User already exists",
    });
  }
}
