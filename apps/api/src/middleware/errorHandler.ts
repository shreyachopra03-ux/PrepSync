import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const status = err instanceof HttpError ? err.status : 500;
  const message = err instanceof Error ? err.message : "Internal server error";

  if (status === 500) {
    console.error(err);
  }

  res.status(status).json({
    error: status === 500 && env.NODE_ENV === "production" ? "Internal server error" : message,
  });
}
