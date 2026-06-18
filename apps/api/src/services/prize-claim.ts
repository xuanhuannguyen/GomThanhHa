import { claimRequestSchema, type ClaimResponse, type PrizeCode } from "@binh-gom/shared";
import { Prisma, type PrismaClient } from "@prisma/client";
import { pickWeightedPrize, type InventoryItem } from "./prize-draw.js";
import { ensureAppState } from "./inventory.js";

type ClaimInput = unknown;

export async function claimPrize(prisma: PrismaClient, input: ClaimInput): Promise<ClaimResponse> {
  const payload = claimRequestSchema.parse(input);

  for (let txnAttempt = 1; txnAttempt <= 3; txnAttempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const state = await ensureAppState(tx);

          const existingByKey = await tx.drawResult.findUnique({
            where: {
              idempotencyKey_resetVersion: {
                idempotencyKey: payload.idempotencyKey,
                resetVersion: state.resetVersion
              }
            }
          });

          if (existingByKey) {
            return toClaimResponse(existingByKey, true);
          }

          const player = await findOrCreatePlayer(tx, payload);
          const existingByPlayer = await tx.drawResult.findUnique({
            where: {
              playerId_resetVersion: {
                playerId: player.id,
                resetVersion: state.resetVersion
              }
            }
          });

          if (existingByPlayer) {
            return toClaimResponse(existingByPlayer, true);
          }

          for (let attempt = 0; attempt < 3; attempt += 1) {
            const inventory = await tx.prizeInventory.findMany({
              where: {
                resetVersion: state.resetVersion,
                activeFlag: true,
                remainingQty: { gt: 0 }
              },
              orderBy: { prizeCode: "asc" }
            });

            const selected = pickWeightedPrize(inventory as InventoryItem[]);
            if (!selected) {
              throw new Error("Không còn kết quả để cấp");
            }

            const updated = await tx.prizeInventory.updateMany({
              where: {
                prizeCode: selected.prizeCode,
                resetVersion: state.resetVersion,
                remainingQty: { gt: 0 }
              },
              data: {
                remainingQty: { decrement: 1 }
              }
            });

            if (updated.count === 0) {
              continue;
            }

            const result = await tx.drawResult.create({
              data: {
                playerId: player.id,
                prizeCode: selected.prizeCode,
                prizeLabel: selected.prizeLabel,
                idempotencyKey: payload.idempotencyKey,
                resetVersion: state.resetVersion
              }
            });

            return toClaimResponse(result, false);
          }

          throw new Error("Quà vừa hết, vui lòng thử lại");
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable
        }
      );
    } catch (error) {
      const isSerializationError =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2034" || error.message.includes("serialization") || error.message.includes("conflict"));
      
      const isPostgresSerialization = 
        error instanceof Error && 
        (error.message.includes("40001") || error.message.includes("serialization"));

      if ((isSerializationError || isPostgresSerialization) && txnAttempt < 3) {
        console.warn(`[claimPrize] Serialization write conflict on attempt ${txnAttempt}. Retrying transaction...`);
        await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));
        continue;
      }

      throw error;
    }
  }

  throw new Error("Hệ thống bận (xung đột kết nối), vui lòng thử lại");
}

export async function findOrCreatePlayer(
  tx: Prisma.TransactionClient,
  payload: {
    name: string;
    studentId: string;
    phone: string;
    deviceId: string;
  }
) {
  const existing = await tx.player.findFirst({
    where: {
      OR: [{ deviceId: payload.deviceId }, { studentId: payload.studentId }, { phone: payload.phone }]
    }
  });

  if (existing) {
    return existing;
  }

  try {
    return await tx.player.create({
      data: {
        name: payload.name,
        studentId: payload.studentId,
        phone: payload.phone,
        deviceId: payload.deviceId
      }
    });
  } catch (error) {
    if (isUniqueConflict(error)) {
      const player = await tx.player.findFirst({
        where: {
          OR: [{ deviceId: payload.deviceId }, { studentId: payload.studentId }, { phone: payload.phone }]
        }
      });

      if (player) {
        return player;
      }
    }

    throw error;
  }
}

function isUniqueConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function toClaimResponse(
  result: {
    id: string;
    prizeCode: string;
    prizeLabel: string;
    confirmedAt: Date;
    resetVersion: number;
  },
  alreadyClaimed: boolean
): ClaimResponse {
  return {
    resultId: result.id,
    prizeCode: result.prizeCode as PrizeCode,
    prizeLabel: result.prizeLabel,
    confirmedAt: result.confirmedAt.toISOString(),
    resetVersion: result.resetVersion,
    alreadyClaimed
  };
}
