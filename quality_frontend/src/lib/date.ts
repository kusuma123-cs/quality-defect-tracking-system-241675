import type { CorrectiveAction } from "@/lib/api/types";

// PUBLIC_INTERFACE
export function isOverdue(action: CorrectiveAction): boolean {
  /** Returns true if due_date is before today and action is not done/canceled. */
  if (action.status === "done" || action.status === "canceled") return false;
  if (!action.due_date) return false;

  // Support YYYY-MM-DD or full ISO.
  const due = new Date(action.due_date.length <= 10 ? `${action.due_date}T00:00:00` : action.due_date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return due.getTime() < today.getTime();
}

// PUBLIC_INTERFACE
export function formatDate(d: string): string {
  /** Format ISO date or YYYY-MM-DD to a short locale date. */
  const dt = new Date(d.length <= 10 ? `${d}T00:00:00` : d);
  return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}
