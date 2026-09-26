import { db } from "@/db";
import { users } from "@/db/schema";
import { AppError } from "@/utils/handlers/responseHandler";
import { tryCatch } from "@/utils/handlers/tryCatch";
import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";

export async function insertUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { clerkId, userName, email, status } = req.body;

  if (!clerkId) {
    return next(new AppError(400, "clerkId is missing"));
  }

  if (!email) {
    return next(new AppError(400, "Email is required"));
  }

  // checking if user already exists
  const { data: existingUsers, error: lookupErr } = await tryCatch(
    db.select().from(users).where(eq(users.clerkId, clerkId)),
  );

  if (lookupErr) {
    return next(new AppError(500, "Failed to check existing user"));
  }

  if (existingUsers.length > 0) {
    return res.status(200).json({
      success: true,
      message: "User already exists",
    });
  }

  const { error: insertErr } = await tryCatch(
    db.insert(users).values({
      clerkId,
      userName,
      status,
      email,
    }),
  );

  if (insertErr) {
    return next(new AppError(500, "Failed to create user"));
  }

  return res.status(201).json({
    success: true,
    message: "User created",
  });
}
