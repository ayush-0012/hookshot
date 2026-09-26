import { getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "@/utils/handlers/responseHandler";

// Shared user-auth gate for dashboard routes (clerk session -> Bearer token).
// Mount before protected routers; unauthenticated requests get a 401 JSON
// instead of per-controller 500s.
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.headers.authorization) {
    return next(new AppError(401, "Missing auth token"));
  }

  const auth = getAuth(req);

  if (!auth.userId) {
    return next(new AppError(401, "Unauthorized"));
  }

  return next();
}
