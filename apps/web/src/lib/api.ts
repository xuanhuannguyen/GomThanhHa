import type { AdminSummary, AppStateResponse, ClaimRequest, ClaimResponse } from "@binh-gom/shared";

export type { AdminSummary } from "@binh-gom/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Không thể kết nối hệ thống");
  }

  return response.json() as Promise<T>;
}

export function getState() {
  return request<AppStateResponse>("/state", { cache: "no-store" });
}

export function claimPrize(payload: ClaimRequest) {
  return request<ClaimResponse>("/claims", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function registerPlayer(payload: { name: string; studentId: string; phone: string; deviceId: string }) {
  return request<{ ok: boolean; playerId: string }>("/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getAdminSummary(secret: string) {
  return request<AdminSummary & { results: AdminResult[] }>("/admin/summary", {
    headers: { "x-admin-secret": secret },
    cache: "no-store"
  });
}

export async function downloadAdminExport(secret: string) {
  const response = await fetch(`${API_BASE_URL}/admin/export`, {
    headers: { "x-admin-secret": secret }
  });

  if (!response.ok) {
    throw new Error("Không thể xuất Excel");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition");
  const fileName = disposition?.match(/filename="(.+)"/)?.[1] ?? "ket-qua.xlsx";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function resetCampaign(secret: string) {
  return request<{ fileName: string; fileBase64: string; resetEvent: { nextVersion: number } }>("/admin/reset", {
    method: "POST",
    headers: { "x-admin-secret": secret }
  });
}

export type AdminResult = {
  id: string;
  name: string;
  studentId: string;
  phone: string;
  prizeLabel: string;
  confirmedAt: string;
};
