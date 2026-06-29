"use client";

import type { AdminResult, AdminSummary } from "@/lib/api";
import { Download, RotateCcw, ShieldCheck, User, Ticket, Sparkles, RefreshCw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { downloadAdminExport, getAdminSummary, resetCampaign, updateAdminInventory } from "@/lib/api";

const adminSecretStorageKey = "bgth_admin_secret";

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [summary, setSummary] = useState<(AdminSummary & { results: AdminResult[] }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingInventory, setSavingInventory] = useState(false);
  const [error, setError] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [inventoryForm, setInventoryForm] = useState({
    experienceTicketQty: 5,
    toHeQty: 20
  });

  useEffect(() => {
    const storedSecret = localStorage.getItem(adminSecretStorageKey);
    if (!storedSecret) return;

    setSecret(storedSecret);
    void loadSummary(storedSecret, false);
  }, []);

  useEffect(() => {
    if (!summary) return;

    const ticket = summary.inventory.find((item) => item.prizeCode === "experience_ticket");
    const toHe = summary.inventory.find((item) => item.prizeCode === "to_he");

    setInventoryForm({
      experienceTicketQty: ticket?.totalQty ?? 5,
      toHeQty: toHe?.totalQty ?? 20
    });
  }, [summary]);

  async function loadSummary(secretToUse = secret, persistSecret = true) {
    setLoading(true);
    setError("");

    try {
      setSummary(await getAdminSummary(secretToUse));
      setIsAuthed(true);
      if (persistSecret) {
        localStorage.setItem(adminSecretStorageKey, secretToUse);
      }
    } catch (adminError) {
      setSummary(null);
      setIsAuthed(false);
      localStorage.removeItem(adminSecretStorageKey);
      setError(adminError instanceof Error ? adminError.message : "Không thể tải bảng quản lý");
    } finally {
      setLoading(false);
    }
  }

  function handleUnlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadSummary(secret.trim());
  }

  async function handleExport() {
    setError("");
    try {
      await downloadAdminExport(secret);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Không thể xuất Excel");
    }
  }

  async function handleSaveInventory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingInventory(true);
    setError("");

    try {
      if (inventoryForm.experienceTicketQty < ticketClaimed) {
        throw new Error(`Vé tham quan đã phát ${ticketClaimed} phần, không thể đặt thấp hơn số đã phát.`);
      }

      if (inventoryForm.toHeQty < toHeClaimed) {
        throw new Error(`Tò he đã phát ${toHeClaimed} phần, không thể đặt thấp hơn số đã phát.`);
      }

      if (100 - inventoryForm.experienceTicketQty - inventoryForm.toHeQty < thanksClaimed) {
        throw new Error(`Phần cảm ơn đã phát ${thanksClaimed} lượt, tổng vé và tò he hiện đang quá cao.`);
      }

      setSummary(await updateAdminInventory(secret, inventoryForm));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Không thể cập nhật phần quà");
    } finally {
      setSavingInventory(false);
    }
  }

  async function handleReset(wantExport: boolean) {
    setShowResetDialog(false);
    setLoading(true);
    setError("");

    try {
      const reset = await resetCampaign(secret);
      if (wantExport) {
        downloadBase64(reset.fileBase64, reset.fileName);
      }
      await loadSummary();
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Không thể đặt lại chiến dịch");
    } finally {
      setLoading(false);
    }
  }

  const ticketInventory = summary?.inventory.find((item) => item.prizeCode === "experience_ticket");
  const toHeInventory = summary?.inventory.find((item) => item.prizeCode === "to_he");
  const thanksInventory = summary?.inventory.find((item) => item.prizeCode === "thanks");
  const ticketClaimed = getClaimedCount(ticketInventory);
  const toHeClaimed = getClaimedCount(toHeInventory);
  const thanksClaimed = getClaimedCount(thanksInventory);
  const ticketMinOption = Math.max(1, ticketClaimed);
  const toHeMinOption = Math.max(15, toHeClaimed);

  return (
    <main className="page game-page" style={{ overflow: "visible" }}>
      {/* Dynamic Background Embers for a Kiln Glow */}
      <div className="kiln-embers">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="ember"
            style={{
              left: `${(i * 11) % 100}%`,
              animationDelay: `${(i * 0.7) % 5}s`,
              animationDuration: `${5 + (i % 4)}s`
            }}
          />
        ))}
      </div>

      {!isAuthed ? (
        <section className="panel stack" style={{ margin: "auto", width: "100%", maxWidth: "400px", zIndex: 10 }}>
          <div>
            <h1 className="title">Quản trị</h1>
            <p className="subtitle">Nhập khóa quản trị để mở bảng quản lý.</p>
          </div>

          <form className="stack" onSubmit={handleUnlock}>
            <div className="field">
              <label htmlFor="secret">Khóa quản trị</label>
              <input
                id="secret"
                type="password"
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                placeholder="Nhập khóa quản trị"
              />
            </div>

            <button className="button secondary" disabled={!secret.trim() || loading} type="submit">
              <ShieldCheck size={18} /> {loading ? "Đang xác nhận..." : "Xác nhận"}
            </button>
          </form>

          {error ? <p className="error">{error}</p> : null}
        </section>
      ) : summary ? (
        <section className="shell" style={{ zIndex: 10 }}>
          <section className="panel" style={{ 
            padding: '12px 20px', 
            boxShadow: '4px 4px 0px var(--brand-dark)',
            width: '100%'
          }}>
            <div className="row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <h1 className="title" style={{ fontSize: '1.4rem', margin: 0, color: 'var(--brand-dark)' }}>Quản trị</h1>
                <p className="subtitle" style={{ fontSize: '0.85rem', margin: 0, color: 'var(--muted)', marginTop: '2px' }}>
                  Quản lý người chơi, xuất Excel và đặt lại sự kiện.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="button ghost" 
                  disabled={loading} 
                  type="button" 
                  onClick={() => loadSummary()}
                  style={{ 
                    minHeight: '36px', 
                    padding: '0 14px', 
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <RefreshCw size={16} /> Làm mới
                </button>
                <button 
                  className="button ghost" 
                  disabled={loading} 
                  type="button" 
                  onClick={handleExport}
                  style={{ 
                    minHeight: '36px', 
                    padding: '0 14px', 
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={16} /> Excel
                </button>
                <button 
                  className="button ghost" 
                  disabled={loading} 
                  type="button" 
                  onClick={() => setShowResetDialog(true)}
                  style={{ 
                    minHeight: '36px', 
                    padding: '0 14px', 
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <RotateCcw size={16} /> Đặt lại
                </button>
              </div>
            </div>

            {error ? <p className="error" style={{ margin: '8px 0 0', padding: '8px 12px' }}>{error}</p> : null}
          </section>

          <div className="admin-grid">
            <Metric label="Người chơi" value={summary.players} />
            <Metric label="Kết quả đã xác nhận" value={summary.confirmedResults} />
            {summary.inventory
              .filter((item) => item.prizeCode !== "thanks")
              .map((item) => (
                <Metric key={item.prizeCode} label={item.prizeLabel} value={`${item.remainingQty}/${item.totalQty}`} />
              ))}
          </div>

          <form className="panel" onSubmit={handleSaveInventory} style={{
            display: 'flex',
            alignItems: 'end',
            gap: '14px',
            flexWrap: 'wrap',
            padding: '16px 20px',
            boxShadow: '4px 4px 0px var(--brand-dark)'
          }}>
            <div style={{ minWidth: '220px', flex: '1 1 220px' }}>
              <label htmlFor="experienceTicketQty" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-dark)', marginBottom: '6px' }}>
                Vé tham quan
              </label>
              <select
                id="experienceTicketQty"
                value={inventoryForm.experienceTicketQty}
                onChange={(event) => setInventoryForm((curr) => ({ ...curr, experienceTicketQty: Number(event.target.value) }))}
                disabled={savingInventory}
                style={{ width: '100%', minHeight: '42px' }}
              >
                {range(ticketMinOption, 20).map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
              <span style={{ display: 'block', marginTop: '6px', color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 700 }}>
                Đã phát {ticketClaimed} phần
              </span>
            </div>

            <div style={{ minWidth: '220px', flex: '1 1 220px' }}>
              <label htmlFor="toHeQty" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-dark)', marginBottom: '6px' }}>
                Tò he
              </label>
              <select
                id="toHeQty"
                value={inventoryForm.toHeQty}
                onChange={(event) => setInventoryForm((curr) => ({ ...curr, toHeQty: Number(event.target.value) }))}
                disabled={savingInventory}
                style={{ width: '100%', minHeight: '42px' }}
              >
                {range(toHeMinOption, 50).map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
              <span style={{ display: 'block', marginTop: '6px', color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 700 }}>
                Đã phát {toHeClaimed} phần
              </span>
            </div>

            <div style={{ minWidth: '180px', flex: '1 1 180px' }}>
              <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-dark)', marginBottom: '6px' }}>
                Chúc may mắn
              </span>
              <strong style={{
                display: 'flex',
                alignItems: 'center',
                minHeight: '42px',
                color: 'var(--brand-dark)',
                fontSize: '1.25rem'
              }}>
                {100 - inventoryForm.experienceTicketQty - inventoryForm.toHeQty}
              </strong>
              <span style={{ display: 'block', marginTop: '6px', color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 700 }}>
                Đã phát {thanksClaimed} lượt
              </span>
            </div>

            <button
              className="button secondary"
              disabled={savingInventory || loading}
              type="submit"
              style={{ minHeight: '42px', padding: '0 18px', fontSize: '0.9rem' }}
            >
              <Save size={16} /> {savingInventory ? "Đang lưu..." : "Lưu phần quà"}
            </button>
          </form>

          <div className="panel table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>SĐT</th>
                  <th>Quà</th>
                  <th>Thời điểm</th>
                </tr>
              </thead>
              <tbody>
                {summary.results.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.phone}</td>
                    <td>{row.prizeLabel}</td>
                    <td>{new Date(row.confirmedAt).toLocaleString("vi-VN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showResetDialog ? (
            <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="reset-dialog-title">
              <div className="admin-modal panel stack">
                <div className="admin-modal-icon">
                  <RotateCcw size={24} />
                </div>
                <div className="stack" style={{ gap: 8 }}>
                  <h2 id="reset-dialog-title" className="font-serif" style={{ color: "var(--brand-dark)", fontSize: "1.45rem" }}>
                    Bạn có muốn in tệp Excel không?
                  </h2>
                  <p className="subtitle">
                    Sau lựa chọn này hệ thống sẽ đặt lại chiến dịch và làm mới dữ liệu người chơi.
                  </p>
                </div>
                <div className="admin-modal-actions">
                  <button className="button secondary" disabled={loading} type="button" onClick={() => handleReset(true)}>
                    Có
                  </button>
                  <button className="button ghost" disabled={loading} type="button" onClick={() => handleReset(false)}>
                    Không
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}

function getMetricDisplayInfo(labelOrCode: string) {
  const normalized = labelOrCode.toLowerCase();

  if (normalized === "người chơi" || normalized === "players" || normalized.includes("nguoi choi")) {
    return {
      label: "Tổng người chơi",
      icon: <User size={20} style={{ color: "var(--brand)" }} />,
    };
  }
  if (normalized.includes("xác nhận") || normalized.includes("confirmed") || normalized.includes("ket qua")) {
    return {
      label: "Kết quả xác nhận",
      icon: <ShieldCheck size={20} style={{ color: "var(--accent)" }} />,
    };
  }
  if (normalized.includes("ve") || normalized.includes("vé") || normalized.includes("ticket") || normalized.includes("experience_ticket")) {
    return {
      label: "Vé trải nghiệm gốm",
      icon: <Ticket size={20} style={{ color: "var(--brand)" }} />,
    };
  }
  if (normalized.includes("to he") || normalized.includes("tò he") || normalized.includes("to_he") || normalized.includes("toy")) {
    return {
      label: "Tò He 12 con giáp",
      icon: <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>🐉</span>,
    };
  }

  return {
    label: labelOrCode,
    icon: <Sparkles size={20} style={{ color: "var(--gold)" }} />,
  };
}

function Metric({ label, value }: { label: string; value: number | string }) {
  const display = getMetricDisplayInfo(label);

  return (
    <div className="panel" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '14px', 
      padding: '12px 18px', 
      boxShadow: '4px 4px 0px var(--brand-dark)',
      minWidth: '200px'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        width: '40px', 
        height: '40px', 
        borderRadius: '8px', 
        background: 'rgba(200, 92, 64, 0.08)',
        flexShrink: 0
      }}>
        {display.icon}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {display.label}
        </span>
        <strong style={{ fontSize: '1.45rem', color: 'var(--brand-dark)', lineHeight: '1.2' }}>
          {value}
        </strong>
      </div>
    </div>
  );
}

function downloadBase64(base64: string, fileName: string) {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function range(min: number, max: number) {
  if (min > max) return [];

  return Array.from({ length: max - min + 1 }, (_, index) => min + index);
}

function getClaimedCount(item?: { totalQty: number; remainingQty: number }) {
  if (!item) return 0;

  return Math.max(0, item.totalQty - item.remainingQty);
}
