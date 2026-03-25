export type ID = number;

export type Severity = "low" | "medium" | "high" | "critical";
export type DefectStatus = "open" | "investigating" | "action_required" | "resolved" | "closed";

export interface Defect {
  id: ID;
  title: string;
  description: string;
  severity: Severity;
  status: DefectStatus;
  rootCause?: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  imageBase64?: string | null; // stored/retrieved as base64 string if supported by backend
}

export interface CorrectiveAction {
  id: ID;
  defectId: ID;
  title: string;
  owner: string;
  dueDate: string; // ISO date (YYYY-MM-DD or ISO)
  status: "open" | "in_progress" | "done";
  completedAt?: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface DashboardSummary {
  totalDefects: number;
  openDefects: number;
  overdueActions: number;
  bySeverity: Record<Severity, number>;
  byStatus: Record<DefectStatus, number>;
}

export interface AnalyticsSeriesPoint {
  label: string;
  value: number;
}

export interface AnalyticsResponse {
  defectsBySeverity: AnalyticsSeriesPoint[];
  defectsByStatus: AnalyticsSeriesPoint[];
  actionsOverdueByOwner: AnalyticsSeriesPoint[];
}

export interface DefectListQuery {
  q?: string;
  severity?: Severity | "all";
  status?: DefectStatus | "all";
  sort?: "createdAt" | "updatedAt" | "severity" | "status";
  dir?: "asc" | "desc";
}

export interface CreateDefectInput {
  title: string;
  description: string;
  severity: Severity;
  status?: DefectStatus;
  rootCause?: string | null;
  imageBase64?: string | null;
}

export interface UpdateDefectInput {
  title?: string;
  description?: string;
  severity?: Severity;
  status?: DefectStatus;
  rootCause?: string | null;
  imageBase64?: string | null;
}

export interface CreateActionInput {
  defectId: ID;
  title: string;
  owner: string;
  dueDate: string;
  status?: "open" | "in_progress" | "done";
}

export interface UpdateActionInput {
  title?: string;
  owner?: string;
  dueDate?: string;
  status?: "open" | "in_progress" | "done";
  completedAt?: string | null;
}

/**
 * A standard API error type thrown by the client.
 */
export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}
