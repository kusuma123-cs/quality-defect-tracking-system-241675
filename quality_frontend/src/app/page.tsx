"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRef, useState } from "react";
import { computeSummary, deleteDefect, downloadStoreJson, importStoreJsonFile, resetToSampleData } from "@/lib/storage";
import { useDefectsStore, notifyStoreUpdated } from "@/lib/useLocalStore";
import { SeverityBadge, StatusBadge, formatDate } from "@/components/Badges";
import { IconClipboardList, IconPlus, IconDownload, IconUpload, IconTrash, IconAlertTriangle } from "@/components/Icons";

export default function DashboardPage() {
  const { defects } = useDefectsStore();

  const summary = useMemo(() => computeSummary(defects), [defects]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  return (
    <div className="grid">
      <section className="card">
        <div className="cardHeader">
          <div>
            <div className="cardTitleRow">
              <div className="cardIcon" aria-hidden="true">
                <IconClipboardList />
              </div>
              <div>
                <h1 className="h1">Dashboard</h1>
                <p className="subtle">All data is stored locally in your browser. No backend/API calls are made.</p>
              </div>
            </div>
          </div>

          <div className="row">
            <Link className="btn btnPrimary" href="/defects/new">
              <IconPlus /> Log defect
            </Link>
          </div>
        </div>

        <div className="hr" />

        <div className="row" aria-label="Summary">
          <span className="badge">
            Total defects: <strong>{summary.totalDefects}</strong>
          </span>

          <span className="badge">
            Open/In progress: <strong>{summary.openDefects}</strong>
          </span>

          <span className={`badge ${summary.overdueActions > 0 ? "tintDanger" : "tintSuccess"}`}>
            <span className="badgeDot" style={{ background: summary.overdueActions > 0 ? "#ef4444" : "#10b981" }} aria-hidden="true" />
            Overdue actions: <strong>{summary.overdueActions}</strong>
          </span>
        </div>

        <div className="hr" />

        <div className="callout" aria-label="Data tools">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 850 }}>Data tools</div>
              <div className="subtle">Export/import your localStorage dataset as JSON. No backend.</div>
              {importMsg ? (
                <div className="subtle" style={{ marginTop: 6 }}>
                  {importMsg}
                </div>
              ) : null}
            </div>

            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button
                className="btn"
                onClick={() => {
                  downloadStoreJson();
                }}
              >
                <IconDownload /> Export JSON
              </button>

              <button
                className="btn"
                onClick={() => {
                  setImportMsg(null);
                  fileInputRef.current?.click();
                }}
              >
                <IconUpload /> Import JSON
              </button>

              <button
                className="btn btnDanger"
                onClick={() => {
                  const ok = window.confirm("Reset local data to sample dataset? This will overwrite your current localStorage data.");
                  if (!ok) return;
                  resetToSampleData();
                  notifyStoreUpdated();
                  setImportMsg("Reset complete (sample data restored).");
                }}
              >
                <IconTrash /> Reset sample
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.item(0) ?? null;
                  // Allow selecting the same file again later
                  e.currentTarget.value = "";
                  if (!file) return;

                  void (async () => {
                    const ok = window.confirm("Import will overwrite your current localStorage dataset. Continue?");
                    if (!ok) return;

                    const res = await importStoreJsonFile(file, { overwrite: true });
                    if (!res.ok) {
                      setImportMsg(`Import failed: ${res.error ?? "Unknown error"}`);
                      return;
                    }
                    notifyStoreUpdated();
                    setImportMsg("Import complete.");
                  })();
                }}
              />
            </div>
          </div>
        </div>

        <div className="hr" />

        {defects.length === 0 ? (
          <div className="callout">
            <p style={{ margin: 0 }}>
              No defects yet. Click <strong>Log defect</strong> to add one.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile-friendly card list */}
            <div className="mobileList" aria-label="Defect list (mobile)">
              {defects.map((d) => (
                <div key={d.id} className="callout" style={{ borderStyle: "solid" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ display: "grid", gap: 6 }}>
                      <Link href={`/defects/${d.id}`} style={{ fontWeight: 800, letterSpacing: "-0.01em" }}>
                        {d.defectType} <span className="subtle">({d.partNumber})</span>
                      </Link>
                      <div className="row">
                        <SeverityBadge severity={d.severity} />
                        <StatusBadge status={d.status} />
                      </div>
                      <div className="subtle">
                        {formatDate(d.occurredAt)} · {d.line} / Shift {d.shift} · Qty <strong>{d.quantity}</strong>
                      </div>
                      <div className="subtle">
                        {d.status === "Complete" ? "Closed" : d.rootCause.trim() ? "Root cause provided" : "Root cause missing"}
                      </div>
                    </div>

                    <div>
                      <button
                        className="btn btnDanger"
                        onClick={() => {
                          const ok = window.confirm("Delete this defect? This cannot be undone.");
                          if (!ok) return;
                          deleteDefect(d.id);
                          notifyStoreUpdated();
                        }}
                      >
                        <IconTrash /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="tableWrap">
              <table className="table" aria-label="Defect list">
                <thead>
                  <tr>
                    <th>Defect</th>
                    <th>When</th>
                    <th>Line</th>
                    <th>Qty</th>
                    <th>Workflow</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {defects.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <div style={{ display: "grid", gap: 6 }}>
                          <Link href={`/defects/${d.id}`} style={{ fontWeight: 750 }}>
                            {d.defectType} <span className="subtle">({d.partNumber})</span>
                          </Link>
                          <div className="row">
                            <SeverityBadge severity={d.severity} />
                            <StatusBadge status={d.status} />
                          </div>
                        </div>
                      </td>
                      <td>{formatDate(d.occurredAt)}</td>
                      <td>
                        {d.line} <span className="subtle">/ Shift {d.shift}</span>
                      </td>
                      <td>{d.quantity}</td>
                      <td className="subtle">{d.status === "Complete" ? "Closed" : d.rootCause.trim() ? "Root cause provided" : "Root cause missing"}</td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn btnDanger"
                          onClick={() => {
                            const ok = window.confirm("Delete this defect? This cannot be undone.");
                            if (!ok) return;
                            deleteDefect(d.id);
                            notifyStoreUpdated();
                          }}
                        >
                          <IconTrash /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="card">
        <div className="cardHeader">
          <div>
            <div className="cardTitleRow">
              <div className="cardIcon" aria-hidden="true" style={{ borderColor: "rgba(245,158,11,0.30)", background: "rgba(245,158,11,0.10)", color: "#b45309" }}>
                <IconAlertTriangle />
              </div>
              <div>
                <h2 className="h1">Overdue actions</h2>
                <p className="subtle">Corrective actions with a due date earlier than today and not marked Done.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="hr" />

        {defects.flatMap((d) => d.actions.map((a) => ({ defect: d, action: a }))).filter(({ action }) => action.status !== "Done").length === 0 ? (
          <div className="callout">
            <p style={{ margin: 0 }}>No open actions. Add actions to a defect to track corrective work.</p>
          </div>
        ) : (
          <div className="stack">
            {defects
              .flatMap((d) => d.actions.map((a) => ({ defect: d, action: a })))
              .filter(({ action }) => action.status !== "Done")
              .sort((x, y) => (x.action.dueDate > y.action.dueDate ? 1 : -1))
              .slice(0, 12)
              .map(({ defect, action }) => {
                const today = new Date().toISOString().slice(0, 10);
                const overdue = action.dueDate < today;

                return (
                  <div key={action.id} className={`callout ${overdue ? "danger" : "warn"}`}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ display: "grid", gap: 4 }}>
                        <div style={{ fontWeight: 850 }}>{action.title}</div>
                        <div className="subtle">
                          Owner: <strong>{action.owner || "—"}</strong> · Due: <strong>{formatDate(action.dueDate)}</strong>
                        </div>
                        <div className="subtle">
                          Defect:{" "}
                          <Link href={`/defects/${defect.id}`} className="mono">
                            {defect.id}
                          </Link>
                        </div>
                      </div>

                      <div className={`badge ${overdue ? "tintDanger" : "tintWarn"}`}>
                        <span className="badgeDot" style={{ background: overdue ? "#ef4444" : "#f59e0b" }} aria-hidden="true" />
                        {overdue ? "Overdue" : "Due soon"}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>
    </div>
  );
}
