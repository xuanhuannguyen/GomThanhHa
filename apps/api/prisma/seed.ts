import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { initialPrizeInventory } from "@binh-gom/shared";

const prisma = new PrismaClient();

async function main() {
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
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
