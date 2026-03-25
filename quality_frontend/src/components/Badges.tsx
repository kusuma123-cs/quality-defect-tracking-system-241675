import type { DefectStatus, Severity } from "@/lib/types";

function colorForSeverity(sev: Severity) {
  switch (sev) {
    case "Low":
      return "#64748b";
    case "Medium":
      return "#3b82f6";
    case "High":
      return "#f59e0b";
    case "Critical":
      return "#ef4444";
  }
}

function colorForStatus(status: DefectStatus) {
  switch (status) {
    case "Open":
      return "#3b82f6";
    case "In Progress":
      return "#f59e0b";
    case "Complete":
      return "#06b6d4";
  }
}

// PUBLIC_INTERFACE
export function SeverityBadge({ severity }: { severity: Severity }) {
  /** Display a severity badge with color cue. */
  const c = colorForSeverity(severity);
  return (
    <span className="badge" title={`Severity: ${severity}`}>
      <span className="badgeDot" style={{ background: c }} aria-hidden="true" />
      Severity: <strong>{severity}</strong>
    </span>
  );
}

// PUBLIC_INTERFACE
export function StatusBadge({ status }: { status: DefectStatus }) {
  /** Display a workflow status badge with color cue. */
  const c = colorForStatus(status);
  return (
    <span className="badge" title={`Status: ${status}`}>
      <span className="badgeDot" style={{ background: c }} aria-hidden="true" />
      Status: <strong>{status}</strong>
    </span>
  );
}

// PUBLIC_INTERFACE
export function formatDate(isoDate: string) {
  /** Format YYYY-MM-DD for display without locale surprises. */
  if (!isoDate) return "—";
  return isoDate;
}
