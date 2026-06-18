import { Router } from "express";
import { requireAdmin } from "../middleware.js";
import { prisma } from "../lib/prisma.js";
import { handleRouteError } from "../lib/http.js";
import { buildResultsWorkbook } from "../services/excel-export.js";
import { getAdminSummary, resetCampaign } from "../services/admin.js";

export const adminRouter = Router();

adminRouter.use(requireAdmin);

adminRouter.get("/summary", async (_req, res) => {
  try {
    res.json(await getAdminSummary(prisma));
  } catch (error) {
    handleRouteError(res, error);
  }
});

adminRouter.get("/export", async (_req, res) => {
  try {
    const workbook = await buildResultsWorkbook(prisma);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${workbook.fileName}"`);
    res.send(workbook.buffer);
  } catch (error) {
    handleRouteError(res, error);
  }
});

adminRouter.post("/reset", async (_req, res) => {
  try {
    const result = await resetCampaign(prisma, "admin");
    res.json(result);
  } catch (error) {
    handleRouteError(res, error);
  }
});
