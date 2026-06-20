import type { Response } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly status = 400
  ) {
    super(message);
  }
}

export function sendError(res: Response, status: number, message: string) {
  return res.status(status).json({ error: message });
}

export function handleRouteError(res: Response, error: unknown) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "Dữ liệu không hợp lệ",
      details: error.flatten()
    });
  }

  if (error instanceof AppError) {
    return sendError(res, error.status, error.message);
  }

  console.error(error);
  return sendError(res, 500, "Hệ thống đang bận, vui lòng thử lại");
}
