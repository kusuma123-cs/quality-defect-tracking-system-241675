export type ID = number;

export type Severity = "low" | "medium" | "high" | "critical";

/**
 * Backend workflow statuses (FastAPI src/api/constants.py).
 */
export type DefectStatus =
  | "open"
  | "investigating"
  | "corrective_action"
  | "resolved"
  | "verified"
  | "closed";

export type ActionStatus = "open" | "in_progress" | "done" | "canceled";

export interface APIMessage {
  message: string;
}

export interface ImageMeta {
  id: ID;
  defect_id: ID;
  file_name?: string | null;
  content_type: string;
  url: string; // usually relative like /images/{id}
  created_at: string; // ISO datetime
}

export interface Defect {
  id: ID;
  title: string;
  description: string;
  severity: Severity;
  status: DefectStatus;

  area?: string | null;
  location?: string | null;
  reported_by?: string | null;
  assigned_to?: string | null;
  due_date?: string | null; // YYYY-MM-DD

  root_cause?: string | null;

  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime

  images: ImageMeta[];
  actions_open: number;
  actions_total: number;
}

export interface CorrectiveAction {
  id: ID;
  defect_id: ID;
  title: string;
  description?: string | null;
  owner?: string | null;
  status: ActionStatus;
  due_date?: string | null; // YYYY-MM-DD
  completed_at?: string | null; // ISO datetime
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

export interface DefectSearchResponse {
  items: Defect[];
  total: number;
  limit: number;
  offset: number;
  sort: "created_at" | "updated_at" | "due_date" | "severity" | "status";
  order: "asc" | "desc";
}

export interface DashboardCounts {
  by_status: Record<DefectStatus, number>;
  by_severity: Record<Severity, number>;
  open_defects: number;
  overdue_actions: number;
}

export interface AnalyticsSeriesPoint {
  label: string;
  value: number;
}

export interface TrendPoint {
  date: string; // YYYY-MM-DD
  created: number;
  resolved: number;
}

export interface AnalyticsResponse {
  range_days: number;
  trends: TrendPoint[];
  avg_days_to_resolve?: number | null;
}

export interface OverdueActionAlert {
  action_id: ID;
  defect_id: ID;
  title: string;
  owner?: string | null;
  due_date: string; // YYYY-MM-DD
  days_overdue: number;
  defect_title: string;
}

export interface OverdueAlertsResponse {
  as_of: string; // ISO datetime
  count: number;
  items: OverdueActionAlert[];
}

/**
 * Frontend filtering model. We'll map to backend query params.
 */
export interface DefectListQuery {
  q?: string;
  severity?: Severity | "all";
  status?: DefectStatus | "all";
  sort?: "created_at" | "updated_at" | "due_date" | "severity" | "status";
  order?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface CreateDefectInput {
  title: string;
  description: string;
  severity: Severity;
  status?: DefectStatus;
  root_cause?: string | null;

  area?: string | null;
  location?: string | null;
  reported_by?: string | null;
  assigned_to?: string | null;
  due_date?: string | null; // YYYY-MM-DD
}

export interface UpdateDefectInput {
  title?: string;
  description?: string;
  severity?: Severity;
  status?: DefectStatus;

  area?: string | null;
  location?: string | null;
  reported_by?: string | null;
  assigned_to?: string | null;

  root_cause?: string | null;
  due_date?: string | null; // YYYY-MM-DD
}

export interface CreateActionInput {
  defect_id: ID;
  title: string;
  description?: string | null;
  owner?: string | null;
  due_date?: string | null; // YYYY-MM-DD
  status?: ActionStatus;
}

export interface UpdateActionInput {
  title?: string;
  description?: string | null;
  owner?: string | null;
  due_date?: string | null; // YYYY-MM-DD
  status?: ActionStatus;
  completed_at?: string | null; // ISO datetime
}

export interface ImageUploadBase64Request {
  file_name?: string | null;
  content_type: string;
  data_base64: string; // may include or not include data-url prefix; backend expects raw base64 bytes
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
