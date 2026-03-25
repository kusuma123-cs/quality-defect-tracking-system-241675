"use client";

import { useParams, useRouter } from "next/navigation";
import React from "react";
import { api } from "@/lib/api/client";
import type { Defect, DefectStatus, ID, Severity, UpdateDefectInput } from "@/lib/api/types";
import { Button, Card, CardBody, CardHeader, InlineSpinner, Input, Select, Textarea } from "@/components/ui";

function asId(v: string | string[]): ID {
  return Number(Array.isArray(v) ? v[0] : v);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

/**
 * PUBLIC_INTERFACE
 * Allow client-side navigation to dynamic params without pre-generating them.
 * (Static export will rely on client-side rendering for unknown IDs.)
 */
export const dynamicParams = true;

export default function EditDefectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = asId(params.id);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [defect, setDefect] = React.useState<Defect | null>(null);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [severity, setSeverity] = React.useState<Severity>("medium");
  const [status, setStatus] = React.useState<DefectStatus>("open");
  const [rootCause, setRootCause] = React.useState("");
  const [imageBase64, setImageBase64] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const d = await api.getDefect(id);
        if (!alive) return;
        setDefect(d);
        setTitle(d.title);
        setDescription(d.description);
        setSeverity(d.severity);
        setStatus(d.status);
        setRootCause(d.root_cause || "");
        // If the defect has stored images, show the first image via its URL; otherwise empty.
        setImageBase64(
          d.images && d.images.length > 0
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001"}${d.images[0].url}`
            : null,
        );
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load defect";
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }

    // UI-level guard: if user sets resolved/closed without root cause, warn (backend may enforce too).
    if ((status === "resolved" || status === "closed") && !rootCause.trim()) {
      if (!confirm("Root cause is empty. Continue anyway? (Recommended: add a root cause before resolving/closing.)")) {
        return;
      }
    }

    const input: UpdateDefectInput = {
      title: title.trim(),
      description: description.trim(),
      severity,
      status,
      root_cause: rootCause.trim() ? rootCause.trim() : null,
    };

    try {
      setSaving(true);
      const updated = await api.updateDefect(id, input);
      router.push(`/defects/${updated.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update defect";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardBody>
          <InlineSpinner label="Loading defect…" />
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-red-600">{error}</p>
          <div className="mt-3">
            <Button variant="secondary" onClick={() => router.push(`/defects/${id}`)}>
              Back
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!defect) return null;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader title="Edit defect" subtitle={`Defect #${defect.id}`} />
        <CardBody>
          <form className="grid gap-4" onSubmit={onSubmit}>
            {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Select label="Severity" value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as DefectStatus)}>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="corrective_action">Corrective action</option>
                <option value="resolved">Resolved</option>
                <option value="verified">Verified</option>
                <option value="closed">Closed</option>
              </Select>
              <Input
                label="Root cause"
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                placeholder="e.g., mislabeled bin at station…"
                hint="Recommended before resolving/closing."
              />
            </div>

            <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Image</span>
              <input
                type="file"
                accept="image/*"
                className="mt-1 block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-900 hover:file:bg-slate-200"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const b64 = await fileToBase64(file);
                  const meta = await api.uploadDefectImageBase64(id, {
                    file_name: file.name,
                    content_type: file.type || "application/octet-stream",
                    data_base64: b64,
                  });
                  setImageBase64(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001"}${meta.url}`);
                }}
              />
              <p className="mt-1 text-xs text-slate-500">Uploading a new file replaces the current preview.</p>
            </label>

            {imageBase64 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-medium text-slate-600">Preview</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="Defect upload preview" src={imageBase64} className="mt-2 max-h-72 w-full rounded-xl object-contain bg-white" />
                <div className="mt-2">
                  <Button type="button" variant="ghost" onClick={() => setImageBase64(null)}>
                    Remove image
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => router.push(`/defects/${id}`)} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
