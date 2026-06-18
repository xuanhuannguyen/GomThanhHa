import type { NextFunction, Request, Response } from "express";
import { env } from "./config/env.js";
import { sendError } from "./lib/http.js";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const bearer = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  const headerSecret = req.header("x-admin-secret");

  if (bearer === env.ADMIN_SECRET || headerSecret === env.ADMIN_SECRET) {
    return next();
  }

  return sendError(res, 401, "Không có quyền admin");
}
