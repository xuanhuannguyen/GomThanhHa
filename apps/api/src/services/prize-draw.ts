import type { PrizeCode } from "@binh-gom/shared";

export type InventoryItem = {
  prizeCode: PrizeCode;
  prizeLabel: string;
  remainingQty: number;
};

export function pickWeightedPrize(items: InventoryItem[]): InventoryItem | null {
  const available = items.filter((item) => item.remainingQty > 0);
  const total = available.reduce((sum, item) => sum + item.remainingQty, 0);

  if (total <= 0) {
    return null;
  }

  let cursor = Math.floor(Math.random() * total);

  for (const item of available) {
    if (cursor < item.remainingQty) {
      return item;
    }

    cursor -= item.remainingQty;
  }

  return available.at(-1) ?? null;
}
