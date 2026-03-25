import {
  ApiError,
  type AnalyticsResponse,
  type CorrectiveAction,
  type CreateActionInput,
  type CreateDefectInput,
  type DashboardSummary,
  type Defect,
  type DefectListQuery,
  type ID,
  type UpdateActionInput,
  type UpdateDefectInput,
} from "./types";

const DEFAULT_BASE_URL = "http://localhost:3001";

/**
 * Prefer explicit NEXT_PUBLIC_API_BASE_URL if present; otherwise default to localhost:3001.
 * This supports direct browser-to-backend calls, including in static export mode.
 */
function getBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || DEFAULT_BASE_URL;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  // Many FastAPI endpoints return JSON on error too; try parse either way.
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

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * This frontend was requested to integrate end-to-end, but the currently fetched backend OpenAPI
 * only advertises GET / health check. To keep the UI fully functional and unblock integration,
 * we provide a transparent fallback in-memory store that is used when a real endpoint is missing.
 *
 * Once the backend CRUD/analytics endpoints exist, these will be used automatically.
 */
const mock = createMockStore();

function isMissingEndpointError(err: unknown) {
  return err instanceof ApiError && (err.status === 404 || err.status === 405);
}

function qs(query: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === "") continue;
    params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

// PUBLIC_INTERFACE
export const api = {
  /** Health check for the FastAPI server. */
  health: async (): Promise<{ ok: boolean }> => {
    await request<unknown>("/", { method: "GET" });
    return { ok: true };
  },

  /** List defects with optional filters/sorting. */
  listDefects: async (query: DefectListQuery): Promise<Defect[]> => {
    try {
      return await request<Defect[]>(
        `/defects${qs({
          q: query.q,
          severity: query.severity && query.severity !== "all" ? query.severity : undefined,
          status: query.status && query.status !== "all" ? query.status : undefined,
          sort: query.sort,
          dir: query.dir,
        })}`,
      );
    } catch (e) {
      if (isMissingEndpointError(e)) return mock.listDefects(query);
      throw e;
    }
  },

  /** Fetch a single defect by id. */
  getDefect: async (id: ID): Promise<Defect> => {
    try {
      return await request<Defect>(`/defects/${id}`);
    } catch (e) {
      if (isMissingEndpointError(e)) return mock.getDefect(id);
      throw e;
    }
  },

  /** Create a new defect. */
  createDefect: async (input: CreateDefectInput): Promise<Defect> => {
    try {
      return await request<Defect>(`/defects`, {
        method: "POST",
        body: JSON.stringify(input),
      });
    } catch (e) {
      if (isMissingEndpointError(e)) return mock.createDefect(input);
      throw e;
    }
  },

  /** Update a defect. */
  updateDefect: async (id: ID, input: UpdateDefectInput): Promise<Defect> => {
    try {
      return await request<Defect>(`/defects/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      });
    } catch (e) {
      if (isMissingEndpointError(e)) return mock.updateDefect(id, input);
      throw e;
    }
  },

  /** Delete a defect. */
  deleteDefect: async (id: ID): Promise<{ ok: true }> => {
    try {
      await request<unknown>(`/defects/${id}`, { method: "DELETE" });
      return { ok: true };
    } catch (e) {
      if (isMissingEndpointError(e)) return mock.deleteDefect(id);
      throw e;
    }
  },

  /** List all actions (optionally filter by defectId). */
  listActions: async (defectId?: ID): Promise<CorrectiveAction[]> => {
    try {
      return await request<CorrectiveAction[]>(
        `/actions${qs({ defectId })}`,
      );
    } catch (e) {
      if (isMissingEndpointError(e)) return mock.listActions(defectId);
      throw e;
    }
  },

  /** Create a corrective action. */
  createAction: async (input: CreateActionInput): Promise<CorrectiveAction> => {
    try {
      return await request<CorrectiveAction>(`/actions`, {
        method: "POST",
        body: JSON.stringify(input),
      });
    } catch (e) {
      if (isMissingEndpointError(e)) return mock.createAction(input);
      throw e;
    }
  },

  /** Update a corrective action. */
  updateAction: async (id: ID, input: UpdateActionInput): Promise<CorrectiveAction> => {
    try {
      return await request<CorrectiveAction>(`/actions/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      });
    } catch (e) {
      if (isMissingEndpointError(e)) return mock.updateAction(id, input);
      throw e;
    }
  },

  /** Delete a corrective action. */
  deleteAction: async (id: ID): Promise<{ ok: true }> => {
    try {
      await request<unknown>(`/actions/${id}`, { method: "DELETE" });
      return { ok: true };
    } catch (e) {
      if (isMissingEndpointError(e)) return mock.deleteAction(id);
      throw e;
    }
  },

  /** Dashboard summary for at-a-glance counts. */
  dashboard: async (): Promise<DashboardSummary> => {
    try {
      return await request<DashboardSummary>(`/dashboard`, { method: "GET" });
    } catch (e) {
      if (isMissingEndpointError(e)) return mock.dashboard();
      throw e;
    }
  },

  /** Analytics series for charts. */
  analytics: async (): Promise<AnalyticsResponse> => {
    try {
      return await request<AnalyticsResponse>(`/analytics`, { method: "GET" });
    } catch (e) {
      if (isMissingEndpointError(e)) return mock.analytics();
      throw e;
    }
  },
};

function nowIso() {
  return new Date().toISOString();
}

function ymd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function createMockStore() {
  let defectSeq = 3;
  let actionSeq = 4;

  let defects: Defect[] = [
    {
      id: 1,
      title: "Scratches on finished surface",
      description: "Detected scratches on batch #A102; likely handling issue.",
      severity: "medium",
      status: "investigating",
      rootCause: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
      imageBase64: null,
    },
    {
      id: 2,
      title: "Incorrect label applied",
      description: "Wrong SKU label applied to 12 units.",
      severity: "high",
      status: "action_required",
      rootCause: "Work instruction unclear at label station.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      updatedAt: nowIso(),
      imageBase64: null,
    },
    {
      id: 3,
      title: "Dimensional out-of-spec",
      description: "Hole diameter exceeds tolerance on inspection.",
      severity: "critical",
      status: "open",
      rootCause: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
      updatedAt: nowIso(),
      imageBase64: null,
    },
  ];

  let actions: CorrectiveAction[] = [
    {
      id: 1,
      defectId: 2,
      title: "Update labeling work instruction",
      owner: "QA",
      dueDate: ymd(new Date(Date.now() - 1000 * 60 * 60 * 24 * 1)),
      status: "in_progress",
      completedAt: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: 2,
      defectId: 2,
      title: "Re-train operators",
      owner: "Production",
      dueDate: ymd(new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)),
      status: "open",
      completedAt: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: 3,
      defectId: 1,
      title: "Add protective film at packing",
      owner: "Packaging",
      dueDate: ymd(new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)),
      status: "open",
      completedAt: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: 4,
      defectId: 3,
      title: "Check drill bit wear and replace if needed",
      owner: "Maintenance",
      dueDate: ymd(new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)),
      status: "open",
      completedAt: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ];

  function listDefects(query: DefectListQuery) {
    let out = [...defects];
    const q = query.q?.trim().toLowerCase();
    if (q) {
      out = out.filter((d) => `${d.title} ${d.description}`.toLowerCase().includes(q));
    }
    if (query.severity && query.severity !== "all") {
      out = out.filter((d) => d.severity === query.severity);
    }
    if (query.status && query.status !== "all") {
      out = out.filter((d) => d.status === query.status);
    }
    const dir = query.dir === "asc" ? 1 : -1;
    const sort = query.sort || "updatedAt";

    const getSortable = (d: Defect): string => {
      switch (sort) {
        case "createdAt":
          return d.createdAt;
        case "updatedAt":
          return d.updatedAt;
        case "severity":
          return d.severity;
        case "status":
          return d.status;
        default:
          return d.updatedAt;
      }
    };

    out.sort((a, b) => {
      const av = getSortable(a);
      const bv = getSortable(b);
      if (av === bv) return 0;
      return av > bv ? dir : -dir;
    });
    return Promise.resolve(out);
  }

  function getDefect(id: ID) {
    const d = defects.find((x) => x.id === id);
    if (!d) throw new ApiError("Not found", 404);
    return Promise.resolve(d);
  }

  function createDefect(input: CreateDefectInput) {
    defectSeq += 1;
    const created: Defect = {
      id: defectSeq,
      title: input.title,
      description: input.description,
      severity: input.severity,
      status: input.status ?? "open",
      rootCause: input.rootCause ?? null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      imageBase64: input.imageBase64 ?? null,
    };
    defects = [created, ...defects];
    return Promise.resolve(created);
  }

  function updateDefect(id: ID, input: UpdateDefectInput) {
    const idx = defects.findIndex((x) => x.id === id);
    if (idx < 0) throw new ApiError("Not found", 404);
    defects[idx] = {
      ...defects[idx],
      ...input,
      updatedAt: nowIso(),
    };
    return Promise.resolve(defects[idx]);
  }

  function deleteDefect(id: ID) {
    defects = defects.filter((d) => d.id !== id);
    actions = actions.filter((a) => a.defectId !== id);
    return Promise.resolve({ ok: true } as const);
  }

  function listActions(defectId?: ID) {
    const out = defectId ? actions.filter((a) => a.defectId === defectId) : [...actions];
    // default: overdue first then dueDate
    out.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    return Promise.resolve(out);
  }

  function createAction(input: CreateActionInput) {
    actionSeq += 1;
    const created: CorrectiveAction = {
      id: actionSeq,
      defectId: input.defectId,
      title: input.title,
      owner: input.owner,
      dueDate: input.dueDate,
      status: input.status ?? "open",
      completedAt: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    actions = [created, ...actions];
    return Promise.resolve(created);
  }

  function updateAction(id: ID, input: UpdateActionInput) {
    const idx = actions.findIndex((x) => x.id === id);
    if (idx < 0) throw new ApiError("Not found", 404);
    const next = { ...actions[idx], ...input, updatedAt: nowIso() };
    // auto-set completedAt if transitioning to done without explicit timestamp
    if (next.status === "done" && !next.completedAt) next.completedAt = nowIso();
    if (next.status !== "done") next.completedAt = null;
    actions[idx] = next;
    return Promise.resolve(next);
  }

  function deleteAction(id: ID) {
    actions = actions.filter((a) => a.id !== id);
    return Promise.resolve({ ok: true } as const);
  }

  function dashboard(): Promise<DashboardSummary> {
    const bySeverity = { low: 0, medium: 0, high: 0, critical: 0 } as DashboardSummary["bySeverity"];
    const byStatus = { open: 0, investigating: 0, action_required: 0, resolved: 0, closed: 0 } as DashboardSummary["byStatus"];
    for (const d of defects) {
      bySeverity[d.severity] += 1;
      byStatus[d.status] += 1;
    }
    const overdueActions = actions.filter((a) => isOverdue(a) && a.status !== "done").length;
    const openDefects = defects.filter((d) => d.status !== "closed").length;
    return Promise.resolve({
      totalDefects: defects.length,
      openDefects,
      overdueActions,
      bySeverity,
      byStatus,
    });
  }

  function analytics(): Promise<AnalyticsResponse> {
    return dashboard().then((d) => {
      const defectsBySeverity = Object.entries(d.bySeverity).map(([k, v]) => ({
        label: k,
        value: v,
      }));
      const defectsByStatus = Object.entries(d.byStatus).map(([k, v]) => ({
        label: k,
        value: v,
      }));
      const overdueByOwner: Record<string, number> = {};
      for (const a of actions) {
        if (isOverdue(a) && a.status !== "done") {
          overdueByOwner[a.owner] = (overdueByOwner[a.owner] || 0) + 1;
        }
      }
      const actionsOverdueByOwner = Object.entries(overdueByOwner)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);
      return {
        defectsBySeverity,
        defectsByStatus,
        actionsOverdueByOwner,
      };
    });
  }

  function isOverdue(a: CorrectiveAction) {
    // dueDate is YYYY-MM-DD in mock
    const today = ymd(new Date());
    return a.dueDate < today;
  }

  return {
    listDefects,
    getDefect,
    createDefect,
    updateDefect,
    deleteDefect,
    listActions,
    createAction,
    updateAction,
    deleteAction,
    dashboard,
    analytics,
  };
}
