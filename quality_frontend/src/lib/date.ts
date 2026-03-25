import type { CorrectiveAction } from "@/lib/api/types";

// PUBLIC_INTERFACE
export function isOverdue(action: CorrectiveAction): boolean {
  /** Returns true if dueDate is before today and action is not done. */
  if (action.status === "done") return false;

  // Support YYYY-MM-DD or full ISO.
  const due = new Date(action.dueDate.length <= 10 ? `${action.dueDate}T00:00:00` : action.dueDate);
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
