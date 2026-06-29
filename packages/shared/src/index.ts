import { z } from "zod";

export const prizeCodes = ["experience_ticket", "to_he", "thanks"] as const;

export type PrizeCode = (typeof prizeCodes)[number];

export const prizeLabels: Record<PrizeCode, string> = {
  experience_ticket: "Vé trải nghiệm làm gốm Thanh Hà",
  to_he: "Nhân vật tò he 12 con giáp",
  thanks: "Chúc bạn may mắn lần sau"
};

export const initialPrizeInventory: Array<{
  prizeCode: PrizeCode;
  prizeLabel: string;
  totalQty: number;
}> = [
  {
    prizeCode: "experience_ticket",
    prizeLabel: prizeLabels.experience_ticket,
    totalQty: 5
  },
  {
    prizeCode: "to_he",
    prizeLabel: prizeLabels.to_he,
    totalQty: 20
  },
  {
    prizeCode: "thanks",
    prizeLabel: prizeLabels.thanks,
    totalQty: 75
  }
];

export const playerSchema = z.object({
  name: z.string().trim().min(2, "Tên phải có ít nhất 2 ký tự").max(80, "Tên không được quá 80 ký tự"),
  phone: z
    .string()
    .trim()
    .transform((val) => val.replace(/[\s.\-_()]/g, ""))
    .refine((val) => /^(0|84|\+84)(3|5|7|8|9)([0-9]{8})$/.test(val), {
      message: "Số điện thoại Việt Nam không hợp lệ (Ví dụ: 0987654321)",
    })
    .transform((val) => val.replace(/^(84|\+84)/, "0")),
  deviceId: z.string().trim().min(8).max(120)
});

export const claimRequestSchema = playerSchema.extend({
  idempotencyKey: z.string().trim().min(12).max(120)
});

export const adminLoginSchema = z.object({
  secret: z.string().min(1)
});

export const prizeInventoryUpdateSchema = z.object({
  experienceTicketQty: z.number().int().min(1).max(20),
  toHeQty: z.number().int().min(15).max(50)
});

export type PlayerInput = z.infer<typeof playerSchema>;
export type ClaimRequest = z.infer<typeof claimRequestSchema>;

export type ClaimResponse = {
  resultId: string;
  prizeCode: PrizeCode;
  prizeLabel: string;
  confirmedAt: string;
  resetVersion: number;
  alreadyClaimed: boolean;
};

export type AppStateResponse = {
  resetVersion: number;
  campaignStatus: string;
  currentCampaignName: string;
  inventory: Array<{
    prizeCode: PrizeCode;
    prizeLabel: string;
    totalQty: number;
  }>;
};

export type AdminSummary = {
  players: number;
  confirmedResults: number;
  inventory: Array<{
    prizeCode: PrizeCode;
    prizeLabel: string;
    totalQty: number;
    remainingQty: number;
  }>;
};
