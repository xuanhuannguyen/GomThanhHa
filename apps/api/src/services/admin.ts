import type { PrismaClient } from "@prisma/client";
import { resetInventory } from "./inventory.js";
import { buildResultsWorkbook } from "./excel-export.js";

export async function getAdminSummary(prisma: PrismaClient) {
  const state = await prisma.appState.findUnique({ where: { id: "app" } });
  const resetVersion = state?.resetVersion ?? 1;

  const [players, confirmedResults, inventory, results] = await Promise.all([
    prisma.player.count(),
    prisma.drawResult.count({ where: { resetVersion } }),
    prisma.prizeInventory.findMany({
      where: { resetVersion },
      orderBy: { prizeCode: "asc" }
    }),
    prisma.drawResult.findMany({
      where: { resetVersion },
      include: { player: true },
      orderBy: { confirmedAt: "desc" },
      take: 100
    })
  ]);

  return {
    players,
    confirmedResults,
    inventory: inventory.map((item) => ({
      prizeCode: item.prizeCode,
      prizeLabel: item.prizeLabel,
      totalQty: item.totalQty,
      remainingQty: item.remainingQty
    })),
    results: results.map((result) => ({
      id: result.id,
      name: result.player.name,
      studentId: result.player.studentId,
      phone: result.player.phone,
      prizeLabel: result.prizeLabel,
      confirmedAt: result.confirmedAt.toISOString()
    }))
  };
}

export async function resetCampaign(prisma: PrismaClient, performedBy: string) {
  const exportFile = await buildResultsWorkbook(prisma);

  const resetEvent = await prisma.$transaction(async (tx) => {
    const state = await tx.appState.upsert({
      where: { id: "app" },
      update: {},
      create: {
        id: "app",
        resetVersion: 1,
        campaignStatus: "active",
        currentCampaignName: "Workshop Bình Gốm Thanh Hà"
      }
    });

    const nextVersion = state.resetVersion + 1;

    await tx.drawResult.deleteMany({ where: { resetVersion: state.resetVersion } });
    await tx.player.deleteMany();
    await tx.prizeInventory.deleteMany({ where: { resetVersion: state.resetVersion } });

    await tx.appState.update({
      where: { id: "app" },
      data: { resetVersion: nextVersion }
    });

    await resetInventory(tx, nextVersion);

    return tx.resetEvent.create({
      data: {
        exportFileName: exportFile.fileName,
        exportedAt: new Date(),
        performedBy,
        previousVersion: state.resetVersion,
        nextVersion
      }
    });
  });

  return {
    resetEvent,
    fileName: exportFile.fileName,
    fileBase64: exportFile.buffer.toString("base64")
  };
}
