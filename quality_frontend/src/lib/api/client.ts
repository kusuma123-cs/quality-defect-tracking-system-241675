import {
  ApiError,
  type AnalyticsResponse,
  type APIMessage,
  type CorrectiveAction,
  type CreateActionInput,
  type CreateDefectInput,
  type DashboardCounts,
  type Defect,
  type DefectListQuery,
  type DefectSearchResponse,
  type ID,
  type ImageMeta,
  type ImageUploadBase64Request,
  type OverdueAlertsResponse,
  type UpdateActionInput,
  type UpdateDefectInput,
} from "./types";

const DEFAULT_BASE_URL = "http://localhost:3001";

/**
 * Prefer an explicit env base URL for browser-to-backend calls.
 *
 * In this repo's preview environment, the orchestrator provides NEXT_PUBLIC_API_BASE
 * (and sometimes NEXT_PUBLIC_BACKEND_URL), not NEXT_PUBLIC_API_BASE_URL.
 * If none are set, we fall back to localhost for local development only.
 */
function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE?.trim() ||
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ||
    DEFAULT_BASE_URL
  );
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
    },
  });

  const text = await res.text();
  const data = text ? safeJsonParse(text) : null;

  if (!res.ok) {
    throw new ApiError(
      `API request failed (${res.status}) for ${path}`,
      res.status,
      data ?? text,
    );
  }

  return (data ?? ({} as unknown)) as T;
}

function qs(query: Record<string, string | number | boolean | undefined | null>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

/**
 * Some UI uses data-url base64 strings from FileReader.readAsDataURL.
 * Backend expects raw base64 bytes in data_base64. Strip prefix if present.
 */
function stripDataUrlPrefix(dataUrlOrBase64: string) {
  const idx = dataUrlOrBase64.indexOf("base64,");
  if (idx >= 0) return dataUrlOrBase64.slice(idx + "base64,".length);
  return dataUrlOrBase64;
}

// PUBLIC_INTERFACE
export const api = {
  /** Health check for the FastAPI server. */
  health: async (): Promise<{ message: string }> => {
    return request<{ message: string }>("/", { method: "GET" });
  },

  /** List/search defects (backend returns paginated DefectSearchResponse). */
  listDefects: async (query: DefectListQuery): Promise<Defect[]> => {
    const res = await request<DefectSearchResponse>(
      `/defects${qs({
        q: query.q,
        severity: query.severity && query.severity !== "all" ? query.severity : undefined,
        status: query.status && query.status !== "all" ? query.status : undefined,
        limit: query.limit ?? 200,
        offset: query.offset ?? 0,
        sort: query.sort ?? "updated_at",
        order: query.order ?? "desc",
      })}`,
      { method: "GET" },
    );
    return res.items;
  },

  /** Fetch a single defect by id. */
  getDefect: async (id: ID): Promise<Defect> => {
    return request<Defect>(`/defects/${id}`, { method: "GET" });
  },

  /** Create a new defect. */
  createDefect: async (input: CreateDefectInput): Promise<Defect> => {
    return request<Defect>(`/defects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  /** Update a defect (backend uses PATCH). */
  updateDefect: async (id: ID, input: UpdateDefectInput): Promise<Defect> => {
    return request<Defect>(`/defects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  /** Delete a defect. */
  deleteDefect: async (id: ID): Promise<APIMessage> => {
    return request<APIMessage>(`/defects/${id}`, { method: "DELETE" });
  },

  /** List all actions (optionally filter by defect_id). */
  listActions: async (defectId?: ID): Promise<CorrectiveAction[]> => {
    return request<CorrectiveAction[]>(
      `/actions${qs({ defect_id: defectId, include_done: true })}`,
      { method: "GET" },
    );
  },

  /** Create a corrective action. */
  createAction: async (input: CreateActionInput): Promise<CorrectiveAction> => {
    return request<CorrectiveAction>(`/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  /** Update a corrective action (backend uses PATCH). */
  updateAction: async (id: ID, input: UpdateActionInput): Promise<CorrectiveAction> => {
    return request<CorrectiveAction>(`/actions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  /** Delete a corrective action. */
  deleteAction: async (id: ID): Promise<APIMessage> => {
    return request<APIMessage>(`/actions/${id}`, { method: "DELETE" });
  },

  /** Dashboard counts for at-a-glance cards/badges. */
  dashboard: async (): Promise<DashboardCounts> => {
    return request<DashboardCounts>(`/analytics/dashboard`, { method: "GET" });
  },

  /** Analytics trends (note: differs from earlier UI series charts). */
  analytics: async (rangeDays = 30): Promise<AnalyticsResponse> => {
    return request<AnalyticsResponse>(`/analytics${qs({ range_days: rangeDays })}`, { method: "GET" });
  },

  /** Overdue alerts list (optional UI usage). */
  overdueAlerts: async (limit = 50): Promise<OverdueAlertsResponse> => {
    return request<OverdueAlertsResponse>(`/analytics/overdue${qs({ limit })}`, { method: "GET" });
  },

  /** Upload defect image (base64) and get stored image metadata. */
  uploadDefectImageBase64: async (
    defectId: ID,
    payload: ImageUploadBase64Request,
  ): Promise<ImageMeta> => {
    return request<ImageMeta>(`/defects/${defectId}/images/base64`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        data_base64: stripDataUrlPrefix(payload.data_base64),
      }),
    });
  },
};
