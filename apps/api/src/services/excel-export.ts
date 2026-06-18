import ExcelJS from "exceljs";
import type { PrismaClient } from "@prisma/client";

export async function buildResultsWorkbook(prisma: PrismaClient) {
  const state = await prisma.appState.findUnique({ where: { id: "app" } });
  const resetVersion = state?.resetVersion ?? 1;

  const rows = await prisma.drawResult.findMany({
    where: { resetVersion },
    include: { player: true },
    orderBy: { confirmedAt: "asc" }
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Bình Gốm Thanh Hà";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Kết quả");
  sheet.columns = [
    { header: "Tên", key: "name", width: 28 },
    { header: "MSSV", key: "studentId", width: 18 },
    { header: "SĐT", key: "phone", width: 18 },
    { header: "Quà nhận được", key: "prizeLabel", width: 36 },
    { header: "Thời điểm xác nhận", key: "confirmedAt", width: 24 },
    { header: "Phiên bản đặt lại", key: "resetVersion", width: 16 },
    { header: "Ghi chú", key: "note", width: 28 }
  ];

  sheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    sheet.addRow({
      name: row.player.name,
      studentId: row.player.studentId,
      phone: row.player.phone,
      prizeLabel: row.prizeLabel,
      confirmedAt: row.confirmedAt.toISOString(),
      resetVersion: row.resetVersion,
      note: row.prizeCode === "thanks" ? "Không trúng thưởng" : ""
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return {
    buffer: Buffer.from(buffer),
    fileName: `ket-qua-binh-gom-v${resetVersion}-${new Date().toISOString().slice(0, 10)}.xlsx`
  };
}
