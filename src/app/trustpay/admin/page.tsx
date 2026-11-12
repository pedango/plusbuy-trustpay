"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatGhs } from "@/lib/money";

type Tab = "payments" | "disputes" | "webhooks" | "integrity" | "demo";

async function readJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = (await res.json()) as { data?: T; error?: { message: string } };
  if (!res.ok) throw new Error(body.error?.message ?? "Request failed");
  return body.data as T;
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("payments");
  const [payments, setPayments] = useState<Array<Record<string, string | number>>>([]);
  const [disputes, setDisputes] = useState<Array<Record<string, string | number>>>([]);
  const [webhooks, setWebhooks] = useState<Array<Record<string, string | number | null>>>([]);
  const [checks, setChecks] = useState<Array<{ id: string; label: string; pass: boolean; detail?: string }>>([]);
  const [days, setDays] = useState("7");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      const [p, d, w, c] = await Promise.all([
        readJson<Array<Record<string, string | number>>>("/api/trustpay/v1/admin/payments"),
        readJson<Array<Record<string, string | number>>>("/api/trustpay/v1/admin/disputes"),
        readJson<Array<Record<string, string | number | null>>>("/api/trustpay/v1/admin/webhooks"),
        readJson<Array<{ id: string; label: string; pass: boolean; detail?: string }>>(
          "/api/trustpay/v1/admin/ledger-integrity",
        ),
      ]);
      setPayments(p);
      setDisputes(d);
      setWebhooks(w);
      setChecks(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load admin data");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function post(url: string, body?: unknown) {
    try {
      await readJson(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : "{}",
      });
      toast.success("Done");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  const tabs: Array<[Tab, string]> = [
    ["payments", "Payments"],
    ["disputes", "Disputes"],
    ["webhooks", "Webhook log"],
    ["integrity", "Ledger integrity"],
    ["demo", "Demo controls"],
  ];

  return (
    <div className="space-y-4">
      <h1 className="page-title text-[var(--tp-brand-dark)]">TrustPay admin</h1>
      {error ? <p className="text-sm text-[var(--status-bad-fg)]">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        {tabs.map(([id, label]) => (
          <button key={id} className={`btn btn-sm ${tab === id ? "btn-tp" : "btn-secondary"}`} type="button" onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "payments" ? (
        <div className="card bg-white overflow-x-auto">
          {payments.length === 0 ? <p className="text-sm text-[var(--muted)]">No payments yet.</p> : null}
          <table className="w-full text-sm">
            <tbody>
              {payments.map((row) => (
                <tr key={String(row.id)} className="border-t border-[var(--border)]">
                  <td className="py-2">{row.reference}</td>
                  <td>{row.status}</td>
                  <td>{formatGhs(Number(row.amountMinor))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "disputes" ? (
        <div className="card bg-white space-y-3">
          {disputes.length === 0 ? <p className="text-sm text-[var(--muted)]">No disputes.</p> : null}
          {disputes.map((row) => (
            <div key={String(row.id)} className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] py-2">
              <div>
                <p className="font-medium">{row.reference}</p>
                <p className="text-sm text-[var(--muted)]">{row.reason}</p>
              </div>
              {row.status === "OPEN" ? (
                <div className="flex gap-2">
                  <button className="btn btn-sm btn-secondary" type="button" onClick={() => post(`/api/trustpay/v1/admin/disputes/${row.id}/resolve`, { resolution: "REFUND" })}>
                    Refund buyer
                  </button>
                  <button className="btn btn-sm btn-tp" type="button" onClick={() => post(`/api/trustpay/v1/admin/disputes/${row.id}/resolve`, { resolution: "RELEASE" })}>
                    Release to merchant
                  </button>
                </div>
              ) : (
                <span className="text-sm">{row.status}</span>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {tab === "webhooks" ? (
        <div className="card bg-white space-y-2 text-sm">
          {webhooks.length === 0 ? <p className="text-[var(--muted)]">No webhook events.</p> : null}
          {webhooks.map((row) => (
            <div key={String(row.id)} className="flex items-center justify-between gap-2 border-t border-[var(--border)] py-2">
              <span>
                {row.type} · {row.status} · attempts {row.attempts}
                {row.lastError ? ` · ${row.lastError}` : ""}
              </span>
              <button className="btn btn-sm btn-secondary" type="button" onClick={() => post(`/api/trustpay/v1/admin/webhooks/${row.id}/retry`)}>
                Retry
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "integrity" ? (
        <div className="card bg-white space-y-2">
          {checks.map((check) => (
            <div key={check.id} className="flex items-center justify-between border-t border-[var(--border)] py-2 text-sm">
              <span>{check.label}</span>
              <span className={check.pass ? "text-[var(--status-ok-fg)]" : "text-[var(--status-bad-fg)]"}>
                {check.pass ? "Pass" : "Fail"}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "demo" ? (
        <div className="card bg-white space-y-3">
          <label className="label" htmlFor="days">
            Fast-forward days
          </label>
          <input id="days" className="input max-w-xs" value={days} onChange={(e) => setDays(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-tp" type="button" onClick={() => post("/api/trustpay/v1/admin/demo/fast-forward", { days: Number(days) })}>
              Fast-forward time
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => post("/api/trustpay/v1/admin/demo/maintenance")}>
              Run maintenance now
            </button>
            <button className="btn btn-danger" type="button" onClick={() => post("/api/trustpay/v1/admin/demo/reset")}>
              Reset demo data
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
