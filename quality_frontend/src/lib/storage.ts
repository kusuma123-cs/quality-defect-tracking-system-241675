import { z } from "zod";
import type { Defect, DefectStatus, CorrectiveAction, AnalyticsSummary } from "@/lib/types";

const STORAGE_VERSION = 1;
const KEY = "qdt:v1";

/**
 * Schema used to validate/repair persisted localStorage data.
 * This avoids runtime crashes if localStorage is corrupted.
 */
const CorrectiveActionSchema = z.object({
  id: z.string(),
  title: z.string(),
  owner: z.string(),
  dueDate: z.string(),
  status: z.union([z.literal("Open"), z.literal("Done")]),
  createdAt: z.string()
});

const DefectSchema: z.ZodType<Defect> = z.object({
  id: z.string(),
  partNumber: z.string(),
  defectType: z.string(),
  quantity: z.number(),
  line: z.string(),
  shift: z.union([z.literal("A"), z.literal("B"), z.literal("C")]),
  severity: z.union([z.literal("Low"), z.literal("Medium"), z.literal("High"), z.literal("Critical")]),
  occurredAt: z.string(),
  status: z.union([z.literal("Open"), z.literal("In Progress"), z.literal("Complete")]),
  assignedTo: z.string(),
  rootCause: z.string(),
  notes: z.string(),
  imageBase64: z.string().optional(),
  actions: z.array(CorrectiveActionSchema),
  createdAt: z.string(),
  updatedAt: z.string()
});

const StoreSchema = z.object({
  version: z.number(),
  defects: z.array(DefectSchema)
});

type Store = z.infer<typeof StoreSchema>;

function nowIso() {
  return new Date().toISOString();
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function uid(prefix: string) {
  // Simple unique id generator safe for local usage
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function safeParseStore(raw: string | null): Store | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const validated = StoreSchema.safeParse(parsed);
    if (!validated.success) return null;
    return validated.data;
  } catch {
    return null;
  }
}

function defaultSeed(): Store {
  const createdAt = nowIso();
  const occurredAt = todayIsoDate();
  return {
    version: STORAGE_VERSION,
    defects: [
      {
        id: uid("def"),
        partNumber: "PN-10021",
        defectType: "Scratch",
        quantity: 3,
        line: "Line 2",
        shift: "A",
        severity: "Medium",
        occurredAt,
        status: "Open",
        assignedTo: "Unassigned",
        rootCause: "",
        notes: "Found during final inspection. Photo optional.",
        actions: [
          {
            id: uid("act"),
            title: "Inspect upstream handling process",
            owner: "Quality",
            dueDate: occurredAt,
            status: "Open",
            createdAt
          }
        ],
        createdAt,
        updatedAt: createdAt
      }
    ]
  };
}

function writeStore(store: Store) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(store));
}

function readOrInitStore(): Store {
  if (typeof window === "undefined") {
    // Server render fallback; should not be used as source of truth.
    return defaultSeed();
  }
  const existing = safeParseStore(window.localStorage.getItem(KEY));
  if (existing) return existing;

  const seeded = defaultSeed();
  writeStore(seeded);
  return seeded;
}

// PUBLIC_INTERFACE
export function ensureStorageInitialized(): void {
  /** Ensure the store exists in localStorage; creates a seeded store if missing/corrupt. */
  if (typeof window === "undefined") return;
  readOrInitStore();
}

// PUBLIC_INTERFACE
export function getDefects(): Defect[] {
  /** Get all defects from localStorage (sorted by most recently updated). */
  const store = readOrInitStore();
  return [...store.defects].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

// PUBLIC_INTERFACE
export function getDefectById(id: string): Defect | null {
  /** Get a single defect by id from localStorage. */
  const store = readOrInitStore();
  return store.defects.find((d) => d.id === id) ?? null;
}

// PUBLIC_INTERFACE
export function createDefect(input: Omit<Defect, "id" | "createdAt" | "updatedAt" | "actions"> & { actions?: CorrectiveAction[] }): Defect {
  /** Create a defect and persist it to localStorage. */
  const store = readOrInitStore();
  const createdAt = nowIso();
  const defect: Defect = {
    ...input,
    id: uid("def"),
    actions: input.actions ?? [],
    createdAt,
    updatedAt: createdAt
  };
  store.defects.push(defect);
  writeStore(store);
  return defect;
}

// PUBLIC_INTERFACE
export function updateDefect(id: string, patch: Partial<Omit<Defect, "id" | "createdAt">>): Defect | null {
  /** Update a defect with a patch. Returns updated defect or null if not found. */
  const store = readOrInitStore();
  const idx = store.defects.findIndex((d) => d.id === id);
  if (idx < 0) return null;

  const updated: Defect = {
    ...store.defects[idx],
    ...patch,
    updatedAt: nowIso()
  };
  store.defects[idx] = updated;
  writeStore(store);
  return updated;
}

// PUBLIC_INTERFACE
export function deleteDefect(id: string): boolean {
  /** Delete a defect by id. */
  const store = readOrInitStore();
  const before = store.defects.length;
  store.defects = store.defects.filter((d) => d.id !== id);
  writeStore(store);
  return store.defects.length !== before;
}

// PUBLIC_INTERFACE
export function addCorrectiveAction(defectId: string, input: Omit<CorrectiveAction, "id" | "createdAt" | "status"> & { status?: CorrectiveAction["status"] }): CorrectiveAction | null {
  /** Add a corrective action to a defect. Returns created action or null if defect not found. */
  const defect = getDefectById(defectId);
  if (!defect) return null;

  const action: CorrectiveAction = {
    id: uid("act"),
    title: input.title,
    owner: input.owner,
    dueDate: input.dueDate,
    status: input.status ?? "Open",
    createdAt: nowIso()
  };

  updateDefect(defectId, { actions: [...defect.actions, action] });
  return action;
}

// PUBLIC_INTERFACE
export function updateCorrectiveAction(defectId: string, actionId: string, patch: Partial<Omit<CorrectiveAction, "id" | "createdAt">>): CorrectiveAction | null {
  /** Update a corrective action. Returns updated action or null if not found. */
  const defect = getDefectById(defectId);
  if (!defect) return null;

  const nextActions = defect.actions.map((a) => (a.id === actionId ? { ...a, ...patch } : a));
  const updated = nextActions.find((a) => a.id === actionId) ?? null;
  if (!updated) return null;

  updateDefect(defectId, { actions: nextActions });
  return updated;
}

// PUBLIC_INTERFACE
export function deleteCorrectiveAction(defectId: string, actionId: string): boolean {
  /** Delete a corrective action from a defect. */
  const defect = getDefectById(defectId);
  if (!defect) return false;
  const before = defect.actions.length;
  updateDefect(defectId, { actions: defect.actions.filter((a) => a.id !== actionId) });
  return before !== defect.actions.length;
}

// PUBLIC_INTERFACE
export function setDefectStatus(defectId: string, status: DefectStatus): { ok: boolean; error?: string } {
  /**
   * Update workflow status with root-cause enforcement:
   * - You cannot set "Complete" if rootCause is empty.
   */
  const defect = getDefectById(defectId);
  if (!defect) return { ok: false, error: "Defect not found." };

  if (status === "Complete" && defect.rootCause.trim().length === 0) {
    return { ok: false, error: "Root cause is required before marking Complete." };
  }

  updateDefect(defectId, { status });
  return { ok: true };
}

// PUBLIC_INTERFACE
export function computeSummary(defects: Defect[]): AnalyticsSummary {
  /** Compute top-level dashboard summary (open counts + overdue actions). */
  const totalDefects = defects.length;
  const openDefects = defects.filter((d) => d.status !== "Complete").length;

  const today = new Date().toISOString().slice(0, 10);
  const overdueActions = defects
    .flatMap((d) => d.actions)
    .filter((a) => a.status !== "Done" && a.dueDate < today).length;

  return { totalDefects, openDefects, overdueActions };
}
