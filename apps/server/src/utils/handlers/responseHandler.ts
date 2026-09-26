import type { NextFunction, Request, Response } from "express";

// Shared error + response helpers. Success shapes stay per-controller
// (frontend depends on them); all errors flow through here.

export class AppError extends Error {
  status: number;
  errors?: string[];

  constructor(status: number, message: string, errors?: string[]) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

// Central error middleware — must be registered last in index.ts.
// Known AppErrors keep their status; everything else becomes a 500
// without leaking internals.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res
      .status(err.status)
      .json(err.errors ? { errors: err.errors } : { message: err.message });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({ message: "Internal server error" });
}

export function notFoundHandler(_req: Request, res: Response) {
  return res.status(404).json({ message: "Not found" });
}
