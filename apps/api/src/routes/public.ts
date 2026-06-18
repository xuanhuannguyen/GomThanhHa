import { Router } from "express";
import { claimPrize, findOrCreatePlayer } from "../services/prize-claim.js";
import { playerSchema } from "@binh-gom/shared";
import { prisma } from "../lib/prisma.js";
import { handleRouteError } from "../lib/http.js";
import { ensureAppState } from "../services/inventory.js";

export const publicRouter = Router();

publicRouter.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (error) {
    handleRouteError(res, error);
  }
});

publicRouter.get("/state", async (_req, res) => {
  try {
    const state = await ensureAppState(prisma);
    res.json({
      resetVersion: state.resetVersion,
      campaignStatus: state.campaignStatus,
      currentCampaignName: state.currentCampaignName
    });
  } catch (error) {
    handleRouteError(res, error);
  }
});

publicRouter.post("/claims", async (req, res) => {
  try {
    const result = await claimPrize(prisma, req.body);
    res.status(result.alreadyClaimed ? 200 : 201).json(result);
  } catch (error) {
    handleRouteError(res, error);
  }
});

publicRouter.post("/register", async (req, res) => {
  try {
    const payload = playerSchema.extend({ deviceId: playerSchema.shape.deviceId }).parse(req.body);
    
    const existing = await prisma.player.findFirst({
      where: {
        OR: [{ deviceId: payload.deviceId }, { studentId: payload.studentId }, { phone: payload.phone }]
      }
    });

    if (existing) {
      let reason = "Thông tin";
      if (existing.phone === payload.phone) reason = "Số điện thoại";
      else if (existing.studentId === payload.studentId) reason = "MSSV";
      else if (existing.deviceId === payload.deviceId) reason = "Thiết bị";

      res.status(400).json({ error: `${reason} này đã được sử dụng để tham gia chương trình.` });
      return;
    }

    const player = await prisma.player.create({
      data: {
        name: payload.name,
        studentId: payload.studentId,
        phone: payload.phone,
        deviceId: payload.deviceId
      }
    });
    res.status(200).json({ ok: true, playerId: player.id });
  } catch (error) {
    handleRouteError(res, error);
  }
});
