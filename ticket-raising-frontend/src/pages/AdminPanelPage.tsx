import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import Button from "../components/Button";
import ConfirmDialog from "../components/ConfirmDialog";
import { apiFetch, type ApiError } from "../api/http";
import { getAuth } from "../auth/authStore";

type AdminTicketRow = {
  ticket_id: string;
  type: string;
  user_email_hash: string;
  raised_by_name: string;
  raised_by_email: string;
  created_at?: string;
  status: "confirmed" | "in_progress" | "resolved";
  resolved_by_email?: string | null;
  resolved_at?: string | null;
};

type ListResponse = { tickets: AdminTicketRow[] };

function formatChennai(iso?: string | null) {
  if (!iso) return "-";
  const normalized = /Z$|[+\-]\d{2}:\d{2}$/.test(iso) ? iso : `${iso}Z`;
  const d = new Date(normalized);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}:${get("second")}`;
}

function AdminTabs() {
  const tabClass = ({ isActive }: { isActive: boolean }) =>
    [
      "cursor-pointer select-none",
      "px-3 py-2 rounded-xl text-sm font-semibold transition",
      isActive ? "text-white" : "text-slate-700 hover:bg-slate-100",
    ].join(" ");

  return (
    <div className="flex gap-2">
      <NavLink
        to="/app/admin/tickets"
        className={tabClass as any}
        style={({ isActive }) => (isActive ? { background: "var(--brand)" } : undefined)}
      >
        Tickets
      </NavLink>
      <NavLink
        to="/app/admin/users"
        className={tabClass as any}
        style={({ isActive }) => (isActive ? { background: "var(--brand)" } : undefined)}
      >
        Users
      </NavLink>
    </div>
  );
}

type ExportPreset = "day" | "week" | "month" | "year" | "custom";

export default function AdminPanelPage() {
  const auth = getAuth();
  const isAdmin = !!auth?.user?.is_admin;

  const [tickets, setTickets] = useState<AdminTicketRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [pending, setPending] = useState<{ ticket: AdminTicketRow; next: AdminTicketRow["status"] } | null>(null);

  // ✅ export filter state (default month)
  const [preset, setPreset] = useState<ExportPreset>("month");
  const [fromDate, setFromDate] = useState(""); // YYYY-MM-DD
  const [toDate, setToDate] = useState("");   // YYYY-MM-DD

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const res = await apiFetch<ListResponse>("/admin/tickets");
      setTickets(res.tickets);
    } catch (e) {
      const apiErr = e as ApiError;
      setErr(apiErr.detail || "Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const sorted = useMemo(() => {
    return [...tickets].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  }, [tickets]);

  function onSelectChange(ticket: AdminTicketRow, next: AdminTicketRow["status"]) {
    if (ticket.status === next) return;
    setPending({ ticket, next });
    setConfirmOpen(true);
  }

  async function confirmChange() {
    if (!pending) return;
    setConfirmLoading(true);
    setMsg(null);
    setErr(null);

    try {
      await apiFetch(`/admin/tickets/${pending.ticket.ticket_id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: pending.next }),
      });

      setMsg(
        pending.next === "resolved"
          ? `Ticket ${pending.ticket.ticket_id} resolved (mail sent).`
          : `Ticket ${pending.ticket.ticket_id} updated to ${pending.next}.`
      );
      setConfirmOpen(false);
      setPending(null);
      await load();
    } catch (e) {
      const apiErr = e as ApiError;
      setErr(apiErr.detail || "Failed to update status.");
    } finally {
      setConfirmLoading(false);
    }
  }

  function cancelChange() {
    setConfirmOpen(false);
    setPending(null);
    load();
  }

  async function downloadExcel() {
    setErr(null);
    setMsg(null);

    try {
      const token = getAuth()?.token;

      const params = new URLSearchParams();
      params.set("preset", preset);
      if (preset === "custom") {
        if (!fromDate || !toDate) {
          setErr("Please select From and To dates for custom export.");
          return;
        }
        params.set("from", fromDate);
        params.set("to", toDate);
      }

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/tickets/export?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        let detail = "Export failed";
        try {
          const j = await res.json();
          detail = j?.detail || detail;
        } catch {}
        throw new Error(detail);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const cd = res.headers.get("Content-Disposition") || "";
      const match = /filename="([^"]+)"/.exec(cd);
      a.download = match?.[1] || "tickets.xlsx";

      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setMsg("Excel downloaded.");
    } catch (e: any) {
      setErr(e?.message || "Export failed.");
    }
  }

  if (!isAdmin) {
    return (
      <div className="card p-6">
        <div className="text-lg font-semibold text-slate-900">Admin</div>
        <div className="mt-2 text-sm text-slate-600">Admin access required.</div>
      </div>
    );
  }

  const confirmMessage =
    pending
      ? `Are you sure you want to change status?\n\nTicket: ${pending.ticket.ticket_id}\n${pending.ticket.status} → ${pending.next}`
      : "";

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Status Change"
        message={confirmMessage}
        confirmText="Yes, Change"
        cancelText="Cancel"
        onConfirm={confirmChange}
        onCancel={cancelChange}
        loading={confirmLoading}
      />

      <div className="card p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Admin</h1>
              <p className="mt-1 text-sm text-slate-600">Manage tickets and export to Excel.</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-end">
              <AdminTabs />
              <Button variant="secondary" onClick={load} disabled={loading}>
                Refresh
              </Button>
              <Button onClick={downloadExcel}>Download Excel</Button>
            </div>
          </div>

          {/* ✅ Export filter row */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <label className="block">
              <span className="label">Export filter</span>
              <select className="input mt-1 min-w-[220px]" value={preset} onChange={(e) => setPreset(e.target.value as ExportPreset)}>
                <option value="day">Day (Today)</option>
                <option value="week">Week (This week)</option>
                <option value="month">Month (This month)</option>
                <option value="year">Year (This year)</option>
                <option value="custom">Custom range</option>
              </select>
            </label>

            {preset === "custom" ? (
              <>
                <label className="block">
                  <span className="label">From</span>
                  <input className="input mt-1" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </label>
                <label className="block">
                  <span className="label">To</span>
                  <input className="input mt-1" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </label>
              </>
            ) : null}
          </div>

          {msg ? <div className="banner-success">{msg}</div> : null}
          {err ? <div className="banner-error">{err}</div> : null}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-auto">
          <table className="min-w-[1350px] w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="text-left px-4 py-3">Ticket ID</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Raised By</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Created </th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Resolved By</th>
                <th className="text-left px-4 py-3">Resolved At</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((t) => (
                <tr key={t.ticket_id} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{t.ticket_id}</td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{t.type}</td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{t.raised_by_name || "-"}</td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{t.raised_by_email || "-"}</td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{formatChennai(t.created_at)}</td>
                  <td className="px-4 py-3">
                    <select
                      className="input mt-0 min-w-[190px] font-semibold"
                      value={t.status}
                      onChange={(e) => onSelectChange(t, e.target.value as any)}
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="in_progress">In-Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{t.resolved_by_email || "-"}</td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{formatChennai(t.resolved_at)}</td>
                </tr>
              ))}

              {!sorted.length ? (
                <tr>
                  <td className="px-4 py-6 text-slate-600" colSpan={8}>
                    {loading ? "Loading..." : "No tickets found."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}