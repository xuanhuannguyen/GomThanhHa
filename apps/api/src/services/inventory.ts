import { initialPrizeInventory, prizeLabels } from "@binh-gom/shared";
import type { Prisma, PrismaClient } from "@prisma/client";
import { AppError } from "../lib/http.js";

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

export async function updatePrizeInventory(
  prisma: PrismaClient,
  payload: {
    experienceTicketQty: number;
    toHeQty: number;
  }
) {
  const state = await ensureAppState(prisma);
  const thanksQty = 100 - payload.experienceTicketQty - payload.toHeQty;

  const awarded = await prisma.drawResult.groupBy({
    by: ["prizeCode"],
    where: { resetVersion: state.resetVersion },
    _count: { _all: true }
  });

  const awardedByCode = new Map(awarded.map((item) => [item.prizeCode, item._count._all]));
  const nextInventory = [
    {
      prizeCode: "experience_ticket",
      prizeLabel: prizeLabels.experience_ticket,
      totalQty: payload.experienceTicketQty
    },
    {
      prizeCode: "to_he",
      prizeLabel: prizeLabels.to_he,
      totalQty: payload.toHeQty
    },
    {
      prizeCode: "thanks",
      prizeLabel: prizeLabels.thanks,
      totalQty: thanksQty
    }
  ] as const;

  for (const item of nextInventory) {
    const claimedCount = awardedByCode.get(item.prizeCode) ?? 0;
    if (item.totalQty < claimedCount) {
      throw new AppError(`${item.prizeLabel} đã phát ${claimedCount} phần, không thể đặt thấp hơn số đã phát.`);
    }
  }

  await prisma.$transaction(
    nextInventory.map((item) => {
      const claimedCount = awardedByCode.get(item.prizeCode) ?? 0;
      return prisma.prizeInventory.upsert({
        where: {
          prizeCode_resetVersion: {
            prizeCode: item.prizeCode,
            resetVersion: state.resetVersion
          }
        },
        update: {
          prizeLabel: item.prizeLabel,
          totalQty: item.totalQty,
          remainingQty: item.totalQty - claimedCount,
          activeFlag: true
        },
        create: {
          prizeCode: item.prizeCode,
          prizeLabel: item.prizeLabel,
          totalQty: item.totalQty,
          remainingQty: item.totalQty - claimedCount,
          resetVersion: state.resetVersion
        }
      });
    })
  );
}
