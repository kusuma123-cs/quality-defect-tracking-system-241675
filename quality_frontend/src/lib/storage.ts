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
  const today = todayIsoDate();

  // Provide a small, varied dataset so dashboard + analytics have something meaningful to show.
  // Note: imageBase64 is intentionally omitted to avoid bloating localStorage.
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
        occurredAt: today,
        status: "Open",
        assignedTo: "Unassigned",
        rootCause: "",
        notes: "Found during final inspection. Photo optional.",
        actions: [
          {
            id: uid("act"),
            title: "Inspect upstream handling process",
            owner: "Quality",
            dueDate: today,
            status: "Open",
            createdAt
          }
        ],
        createdAt,
        updatedAt: createdAt
      },
      {
        id: uid("def"),
        partNumber: "PN-88410",
        defectType: "Missing label",
        quantity: 12,
        line: "Line 1",
        shift: "B",
        severity: "High",
        occurredAt: new Date(Date.now() - 86400000 * 3).toISOString().slice(0, 10),
        status: "In Progress",
        assignedTo: "Supervisor",
        rootCause: "",
        notes: "Containment: 100% check on finished goods for this part number.",
        actions: [
          {
            id: uid("act"),
            title: "Verify label printer settings + sensor alignment",
            owner: "Maintenance",
            dueDate: new Date(Date.now() - 86400000 * 1).toISOString().slice(0, 10),
            status: "Open",
            createdAt
          },
          {
            id: uid("act"),
            title: "Update label work instruction and retrain shift B",
            owner: "Quality",
            dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
            status: "Open",
            createdAt
          }
        ],
        createdAt,
        updatedAt: createdAt
      },
      {
        id: uid("def"),
        partNumber: "PN-55002",
        defectType: "Crack",
        quantity: 1,
        line: "Line 3",
        shift: "C",
        severity: "Critical",
        occurredAt: new Date(Date.now() - 86400000 * 10).toISOString().slice(0, 10),
        status: "Complete",
        assignedTo: "Quality",
        rootCause: "Tooling wear caused excessive press force.",
        notes: "Corrective action implemented; monitoring for recurrence.",
        actions: [
          {
            id: uid("act"),
            title: "Replace worn tooling insert",
            owner: "Maintenance",
            dueDate: new Date(Date.now() - 86400000 * 9).toISOString().slice(0, 10),
            status: "Done",
            createdAt
          },
          {
            id: uid("act"),
            title: "Add tooling inspection to weekly PM checklist",
            owner: "Engineering",
            dueDate: new Date(Date.now() - 86400000 * 7).toISOString().slice(0, 10),
            status: "Done",
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

/**
 * Download a text blob as a file (client-side only).
 */
function downloadTextFile(filename: string, text: string, mimeType = "application/json") {
  if (typeof window === "undefined") return;
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Read a File into a string (client-side only).
 */
async function readFileAsText(file: File): Promise<string> {
  const reader = new FileReader();
  return await new Promise<string>((resolve, reject) => {
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(file);
  });
}

// PUBLIC_INTERFACE
export function exportStoreJson(pretty = true): string {
  /** Export the entire local defect store as a JSON string. */
  const store = readOrInitStore();
  const payload = {
    version: store.version,
    exportedAt: nowIso(),
    defects: store.defects
  };
  return JSON.stringify(payload, null, pretty ? 2 : 0);
}

// PUBLIC_INTERFACE
export function downloadStoreJson(filename?: string): void {
  /** Download the entire local defect store as a JSON file. */
  if (typeof window === "undefined") return;
  const name = filename ?? `qdt-export-${todayIsoDate()}.json`;
  downloadTextFile(name, exportStoreJson(true));
}

function coerceStoreFromUnknown(input: unknown): Store | null {
  // Accept either a raw store shape or an export wrapper (version/exportedAt/defects).
  if (!input || typeof input !== "object") return null;

  const raw = input as Record<string, unknown>;
  const maybeStore =
    raw && typeof raw.version === "number" && Array.isArray(raw.defects)
      ? raw
      : raw && raw.store && typeof raw.store === "object"
        ? (raw.store as Record<string, unknown>)
        : null;

  const wrapper = raw && typeof raw.version === "number" && Array.isArray(raw.defects) ? raw : null;

  const candidate = (maybeStore ?? wrapper) as unknown;

  const validated = StoreSchema.safeParse(candidate);
  if (!validated.success) return null;
  return validated.data;
}

// PUBLIC_INTERFACE
export function importStoreJsonString(jsonText: string, opts?: { overwrite?: boolean }): { ok: boolean; error?: string } {
  /**
   * Import defects from a JSON string.
   * - Validates shape with Zod.
   * - By default, overwrites the existing store (overwrite=true).
   */
  if (typeof window === "undefined") return { ok: false, error: "Import is only available in the browser." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { ok: false, error: "Invalid JSON." };
  }

  const store = coerceStoreFromUnknown(parsed);
  if (!store) {
    return { ok: false, error: "JSON does not match the expected store format." };
  }

  const overwrite = opts?.overwrite ?? true;

  if (!overwrite) {
    // Merge mode: append defects, but avoid duplicate ids by re-uid'ing conflicts.
    const existing = readOrInitStore();
    const existingIds = new Set(existing.defects.map((d) => d.id));
    const mergedDefects: Defect[] = [...existing.defects];

    for (const d of store.defects) {
      if (!existingIds.has(d.id)) {
        mergedDefects.push(d);
        existingIds.add(d.id);
        continue;
      }
      // If there's an id clash, clone with new ids (defect + action ids) to keep referential safety.
      const newDefectId = uid("def");
      mergedDefects.push({
        ...d,
        id: newDefectId,
        actions: d.actions.map((a) => ({ ...a, id: uid("act") })),
        updatedAt: nowIso()
      });
    }

    const next: Store = { version: STORAGE_VERSION, defects: mergedDefects };
    writeStore(next);
    return { ok: true };
  }

  // Overwrite mode: normalize to current version.
  const normalized: Store = { version: STORAGE_VERSION, defects: store.defects };
  writeStore(normalized);
  return { ok: true };
}

// PUBLIC_INTERFACE
export async function importStoreJsonFile(file: File, opts?: { overwrite?: boolean }): Promise<{ ok: boolean; error?: string }> {
  /** Import defects from a user-selected JSON file. */
  if (typeof window === "undefined") return { ok: false, error: "Import is only available in the browser." };
  try {
    const text = await readFileAsText(file);
    return importStoreJsonString(text, opts);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to import file." };
  }
}

// PUBLIC_INTERFACE
export function resetToSampleData(): void {
  /** Reset localStorage store to the built-in sample dataset. */
  if (typeof window === "undefined") return;
  writeStore(defaultSeed());
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
