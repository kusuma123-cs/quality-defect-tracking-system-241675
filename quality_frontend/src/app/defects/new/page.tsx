"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Defect, Severity } from "@/lib/types";
import { createDefect } from "@/lib/storage";
import { notifyStoreUpdated } from "@/lib/useLocalStore";
import { IconPlus, IconClipboardList, IconArrowLeft } from "@/components/Icons";
import Link from "next/link";

const severities: Severity[] = ["Low", "Medium", "High", "Critical"];

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewDefectPage() {
  const router = useRouter();

  const [partNumber, setPartNumber] = useState("");
  const [defectType, setDefectType] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [line, setLine] = useState("");
  const [shift, setShift] = useState<Defect["shift"]>("A");
  const [severity, setSeverity] = useState<Severity>("Medium");
  const [occurredAt, setOccurredAt] = useState<string>(todayIsoDate());
  const [assignedTo, setAssignedTo] = useState<string>("Unassigned");
  const [rootCause, setRootCause] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);

  const canSubmit = useMemo(() => {
    return partNumber.trim() && defectType.trim() && quantity > 0 && line.trim();
  }, [partNumber, defectType, quantity, line]);

  async function onFile(file: File | null) {
    if (!file) {
      setImageBase64(undefined);
      return;
    }
    // Convert image to base64 data URL locally (no upload).
    const reader = new FileReader();
    const result = await new Promise<string>((resolve, reject) => {
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
    setImageBase64(result);
  }

  return (
    <section className="card">
      <div className="cardHeader">
        <div>
          <div className="cardTitleRow">
            <div className="cardIcon" aria-hidden="true">
              <IconPlus />
            </div>
            <div>
              <h1 className="h1">Log defect</h1>
              <p className="subtle">This form saves directly to localStorage. No backend required.</p>
            </div>
          </div>
        </div>

        <div className="row">
          <Link className="btn" href="/">
            <IconArrowLeft /> Dashboard
          </Link>
          <Link className="btn" href="/analytics">
            <IconClipboardList /> Analytics
          </Link>
        </div>
      </div>

      <div className="hr" />

      <div className="formGrid" role="form" aria-label="Defect entry form">
        <div>
          <label className="label" htmlFor="partNumber">
            Part number
          </label>
          <input id="partNumber" className="input" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} placeholder="e.g., PN-12345" />
        </div>

        <div>
          <label className="label" htmlFor="defectType">
            Defect type
          </label>
          <input id="defectType" className="input" value={defectType} onChange={(e) => setDefectType(e.target.value)} placeholder="e.g., Scratch, Crack, Missing label" />
        </div>

        <div>
          <label className="label" htmlFor="qty">
            Quantity
          </label>
          <input id="qty" className="input" type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
        </div>

        <div>
          <label className="label" htmlFor="line">
            Line
          </label>
          <input id="line" className="input" value={line} onChange={(e) => setLine(e.target.value)} placeholder="e.g., Line 1" />
        </div>

        <div>
          <label className="label" htmlFor="shift">
            Shift
          </label>
          <select id="shift" className="select" value={shift} onChange={(e) => setShift(e.target.value as Defect["shift"])}>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </div>

        <div>
          <label className="label" htmlFor="severity">
            Severity
          </label>
          <select id="severity" className="select" value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
            {severities.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="subtle" style={{ marginTop: 6 }}>
            Low/Medium/High/Critical uses <strong>green/yellow/red</strong> visual cues across the app.
          </div>
        </div>

        <div>
          <label className="label" htmlFor="occurredAt">
            Date
          </label>
          <input id="occurredAt" className="input" type="date" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
        </div>

        <div>
          <label className="label" htmlFor="assignedTo">
            Assigned to
          </label>
          <input id="assignedTo" className="input" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="e.g., Quality, Supervisor, Name" />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label className="label" htmlFor="rootCause">
            Root cause (required to mark Complete later)
          </label>
          <input id="rootCause" className="input" value={rootCause} onChange={(e) => setRootCause(e.target.value)} placeholder="e.g., Improper handling, tooling wear, supplier issue" />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label className="label" htmlFor="notes">
            Notes
          </label>
          <textarea id="notes" className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add context, containment actions, etc." />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label className="label" htmlFor="image">
            Image (stored as base64 in localStorage)
          </label>
          <input
            id="image"
            className="input"
            type="file"
            accept="image/*"
            onChange={(e) => {
              void onFile(e.target.files?.item(0) ?? null);
            }}
          />
          <div className="subtle" style={{ marginTop: 6 }}>
            Tip: keep images small to avoid exceeding browser storage limits.
          </div>
          {imageBase64 ? (
            <div style={{ marginTop: 10 }}>
              <img
                src={imageBase64}
                alt="Selected defect"
                style={{
                  width: "100%",
                  maxHeight: 260,
                  objectFit: "contain",
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  background: "rgba(17,24,39,0.02)"
                }}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="hr" />

      <div className="row">
        <button
          className="btn btnPrimary"
          disabled={!canSubmit}
          onClick={() => {
            if (!canSubmit) return;
            const defect = createDefect({
              partNumber: partNumber.trim(),
              defectType: defectType.trim(),
              quantity,
              line: line.trim(),
              shift,
              severity,
              occurredAt,
              status: "Open",
              assignedTo: assignedTo.trim() || "Unassigned",
              rootCause: rootCause.trim(),
              notes: notes.trim(),
              imageBase64
            });

            notifyStoreUpdated();
            router.push(`/defects/${defect.id}`);
          }}
        >
          <IconPlus /> Save defect
        </button>

        <button
          className="btn"
          onClick={() => {
            router.push("/");
          }}
        >
          Cancel
        </button>
      </div>
    </section>
  );
}
