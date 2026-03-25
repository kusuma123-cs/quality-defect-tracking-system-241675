import type { DefectStatus, Severity } from "@/lib/types";

function colorForSeverity(sev: Severity) {
  // Severity cue must be visually distinct and intuitive:
  // - Low: green (good)
  // - Medium: yellow (attention)
  // - High/Critical: red spectrum (urgent)
  switch (sev) {
    case "Low":
      return "#10b981"; // green
    case "Medium":
      return "#f59e0b"; // yellow
    case "High":
      return "#ef4444"; // red
    case "Critical":
      return "#b91c1c"; // deep red
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
