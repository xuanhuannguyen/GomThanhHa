import { initialPrizeInventory } from "@binh-gom/shared";
import type { Prisma, PrismaClient } from "@prisma/client";

type PrismaLike = PrismaClient | Prisma.TransactionClient;

export async function ensureAppState(prisma: PrismaLike) {
  const state = await prisma.appState.upsert({
    where: { id: "app" },
    update: {},
    create: {
      id: "app",
      resetVersion: 1,
      campaignStatus: "active",
      currentCampaignName: "Workshop Bình Gốm Thanh Hà"
    }
  });

  for (const prize of initialPrizeInventory) {
    await prisma.prizeInventory.upsert({
      where: {
        prizeCode_resetVersion: {
          prizeCode: prize.prizeCode,
          resetVersion: state.resetVersion
        }
      },
      update: {},
      create: {
        prizeCode: prize.prizeCode,
        prizeLabel: prize.prizeLabel,
        totalQty: prize.totalQty,
        remainingQty: prize.totalQty,
        resetVersion: state.resetVersion
      }
    });
  }

  return state;
}

export async function resetInventory(prisma: PrismaLike, resetVersion: number) {
  await prisma.prizeInventory.deleteMany({
    where: { resetVersion }
  });

  for (const prize of initialPrizeInventory) {
    await prisma.prizeInventory.create({
      data: {
        prizeCode: prize.prizeCode,
        prizeLabel: prize.prizeLabel,
        totalQty: prize.totalQty,
        remainingQty: prize.totalQty,
        resetVersion
      }
    });
  }
}
