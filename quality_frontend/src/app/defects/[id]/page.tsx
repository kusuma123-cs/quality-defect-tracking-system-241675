"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { DefectStatus } from "@/lib/types";
import {
  addCorrectiveAction,
  deleteCorrectiveAction,
  deleteDefect,
  getDefectById,
  setDefectStatus,
  updateCorrectiveAction,
  updateDefect
} from "@/lib/storage";
import { notifyStoreUpdated, useDefectsStore } from "@/lib/useLocalStore";
import { SeverityBadge, StatusBadge, formatDate } from "@/components/Badges";

export default function DefectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();

  // Subscribe to store updates so the detail view stays consistent
  useDefectsStore();

  const defect = useMemo(() => (id ? getDefectById(id) : null), [id]);

  const [error, setError] = useState<string | null>(null);

  const [newActionTitle, setNewActionTitle] = useState("");
  const [newActionOwner, setNewActionOwner] = useState("");
  const [newActionDueDate, setNewActionDueDate] = useState(() => new Date().toISOString().slice(0, 10));

  if (!defect) {
    return (
      <section className="card">
        <h1 className="h1">Defect not found</h1>
        <p className="subtle">This defect does not exist in localStorage.</p>
        <Link className="btn" href="/">
          Back to dashboard
        </Link>
      </section>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  function trySetStatus(next: DefectStatus) {
    const res = setDefectStatus(defect.id, next);
    if (!res.ok) {
      setError(res.error ?? "Unable to update status.");
      return;
    }
    setError(null);
    notifyStoreUpdated();
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <section className="card">
        <div className="cardHeader">
          <div>
            <h1 className="h1">
              {defect.defectType} <span className="subtle">({defect.partNumber})</span>
            </h1>
            <div className="subtle mono">{defect.id}</div>
          </div>
          <div className="row">
            <Link className="btn" href="/">
              ← Dashboard
            </Link>
            <button
              className="btn btnDanger"
              onClick={() => {
                const ok = window.confirm("Delete this defect and all corrective actions?");
                if (!ok) return;
                deleteDefect(defect.id);
                notifyStoreUpdated();
                router.push("/");
              }}
            >
              Delete
            </button>
          </div>
        </div>

        <div className="hr" />

        <div className="row">
          <SeverityBadge severity={defect.severity} />
          <StatusBadge status={defect.status} />
          <span className="badge">
            Occurred: <strong>{formatDate(defect.occurredAt)}</strong>
          </span>
          <span className="badge">
            Line: <strong>{defect.line}</strong> <span className="subtle">/ Shift {defect.shift}</span>
          </span>
          <span className="badge">
            Qty: <strong>{defect.quantity}</strong>
          </span>
        </div>

        {error ? (
          <div className="callout danger" style={{ marginTop: 12 }}>
            <strong>Workflow rule:</strong> {error}
          </div>
        ) : null}

        <div className="hr" />

        <div className="formGrid">
          <div>
            <label className="label" htmlFor="assignedTo">
              Assigned to
            </label>
            <input
              id="assignedTo"
              className="input"
              value={defect.assignedTo}
              onChange={(e) => {
                updateDefect(defect.id, { assignedTo: e.target.value });
                notifyStoreUpdated();
              }}
            />
          </div>

          <div>
            <label className="label" htmlFor="status">
              Status
            </label>
            <div className="row">
              <button className={`btn ${defect.status === "Open" ? "btnPrimary" : ""}`} onClick={() => trySetStatus("Open")}>
                Open
              </button>
              <button className={`btn ${defect.status === "In Progress" ? "btnPrimary" : ""}`} onClick={() => trySetStatus("In Progress")}>
                In Progress
              </button>
              <button className={`btn ${defect.status === "Complete" ? "btnPrimary" : ""}`} onClick={() => trySetStatus("Complete")}>
                Complete
              </button>
            </div>
            <div className="subtle" style={{ marginTop: 6 }}>
              Cannot set <strong>Complete</strong> without a root cause.
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label className="label" htmlFor="rootCause">
              Root cause
            </label>
            <input
              id="rootCause"
              className="input"
              value={defect.rootCause}
              onChange={(e) => {
                updateDefect(defect.id, { rootCause: e.target.value });
                notifyStoreUpdated();
              }}
              placeholder="Required before marking Complete"
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label className="label" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              className="textarea"
              value={defect.notes}
              onChange={(e) => {
                updateDefect(defect.id, { notes: e.target.value });
                notifyStoreUpdated();
              }}
            />
          </div>
        </div>

        {defect.imageBase64 ? (
          <>
            <div className="hr" />
            <div>
              <div className="h2">Image</div>
              <div className="subtle">Stored locally as base64.</div>
              <div style={{ marginTop: 10 }}>
                <img
                  src={defect.imageBase64}
                  alt="Defect"
                  style={{
                    width: "100%",
                    maxHeight: 320,
                    objectFit: "contain",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "rgba(17,24,39,0.02)"
                  }}
                />
              </div>
            </div>
          </>
        ) : null}
      </section>

      <section className="card">
        <div className="cardHeader">
          <div>
            <h2 className="h1">Corrective actions</h2>
            <p className="subtle">Track actions, due dates, and completion. Overdue items are highlighted.</p>
          </div>
        </div>

        <div className="hr" />

        <div className="formGrid" aria-label="Add corrective action">
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="label" htmlFor="actionTitle">
              Action title
            </label>
            <input id="actionTitle" className="input" value={newActionTitle} onChange={(e) => setNewActionTitle(e.target.value)} placeholder="e.g., Update work instruction / Train operators" />
          </div>

          <div>
            <label className="label" htmlFor="actionOwner">
              Owner
            </label>
            <input id="actionOwner" className="input" value={newActionOwner} onChange={(e) => setNewActionOwner(e.target.value)} placeholder="e.g., Maintenance / Quality / Name" />
          </div>

          <div>
            <label className="label" htmlFor="actionDue">
              Due date
            </label>
            <input id="actionDue" className="input" type="date" value={newActionDueDate} onChange={(e) => setNewActionDueDate(e.target.value)} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <button
              className="btn btnPrimary"
              onClick={() => {
                if (!newActionTitle.trim()) return;
                addCorrectiveAction(defect.id, {
                  title: newActionTitle.trim(),
                  owner: newActionOwner.trim(),
                  dueDate: newActionDueDate
                });
                setNewActionTitle("");
                setNewActionOwner("");
                notifyStoreUpdated();
              }}
            >
              + Add action
            </button>
          </div>
        </div>

        <div className="hr" />

        {defect.actions.length === 0 ? (
          <div className="callout">
            <p style={{ margin: 0 }}>No corrective actions added yet.</p>
          </div>
        ) : (
          <table className="table" aria-label="Corrective actions table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Owner</th>
                <th>Due</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {defect.actions
                .slice()
                .sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1))
                .map((a) => {
                  const overdue = a.status !== "Done" && a.dueDate < today;
                  return (
                    <tr key={a.id} style={overdue ? { background: "rgba(239,68,68,0.05)" } : undefined}>
                      <td style={{ fontWeight: 650 }}>{a.title}</td>
                      <td>
                        <input
                          className="input"
                          value={a.owner}
                          onChange={(e) => {
                            updateCorrectiveAction(defect.id, a.id, { owner: e.target.value });
                            notifyStoreUpdated();
                          }}
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          type="date"
                          value={a.dueDate}
                          onChange={(e) => {
                            updateCorrectiveAction(defect.id, a.id, { dueDate: e.target.value });
                            notifyStoreUpdated();
                          }}
                        />
                      </td>
                      <td>
                        <select
                          className="select"
                          value={a.status}
                          onChange={(e) => {
                            updateCorrectiveAction(defect.id, a.id, { status: e.target.value as "Open" | "Done" });
                            notifyStoreUpdated();
                          }}
                        >
                          <option value="Open">Open</option>
                          <option value="Done">Done</option>
                        </select>
                        {overdue ? <div className="subtle" style={{ color: "#ef4444", fontWeight: 700 }}>Overdue</div> : null}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn btnDanger"
                          onClick={() => {
                            const ok = window.confirm("Delete this corrective action?");
                            if (!ok) return;
                            deleteCorrectiveAction(defect.id, a.id);
                            notifyStoreUpdated();
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
