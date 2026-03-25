"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { api } from "@/lib/api/client";
import type { CreateDefectInput, DefectStatus, Severity } from "@/lib/api/types";
import { Button, Card, CardBody, CardHeader, Input, Select, Textarea } from "@/components/ui";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export default function CreateDefectPage() {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [severity, setSeverity] = React.useState<Severity>("medium");
  const [status, setStatus] = React.useState<DefectStatus>("open");
  const [rootCause, setRootCause] = React.useState("");
  const [imageBase64, setImageBase64] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

    const input: CreateDefectInput = {
      title: title.trim(),
      description: description.trim(),
      severity,
      status,
      rootCause: rootCause.trim() ? rootCause.trim() : null,
      imageBase64,
    };

    try {
      setSaving(true);
      const created = await api.createDefect(input);
      router.push(`/defects/${created.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create defect";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader title="Create defect" subtitle="Log a new quality defect and (optionally) attach an image." />
        <CardBody>
          <form className="grid gap-4" onSubmit={onSubmit}>
            {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary…" />
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
                <option value="action_required">Action required</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </Select>
              <Input
                label="Root cause (optional)"
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                placeholder="e.g., unclear work instruction…"
                hint="Can be filled later during investigation."
              />
            </div>

            <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What happened? Where/when detected? Impact?" />

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Image (optional)</span>
              <input
                type="file"
                accept="image/*"
                className="mt-1 block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-900 hover:file:bg-slate-200"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return setImageBase64(null);
                  const b64 = await fileToBase64(file);
                  setImageBase64(b64);
                }}
              />
              <p className="mt-1 text-xs text-slate-500">Stored as base64 for preview; backend may persist it.</p>
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
                {saving ? "Creating…" : "Create defect"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => router.push("/defects")} disabled={saving}>
                Cancel
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
