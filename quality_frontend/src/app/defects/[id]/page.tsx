"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import { api } from "@/lib/api/client";
import type { CorrectiveAction, Defect, ID } from "@/lib/api/types";
import { formatDate, isOverdue } from "@/lib/date";
import { Badge, Button, Card, CardBody, CardHeader, Divider, InlineSpinner, Input, SeverityBadge, StatusBadge } from "@/components/ui";

function asId(v: string | string[]): ID {
  return Number(Array.isArray(v) ? v[0] : v);
}

/**
 * PUBLIC_INTERFACE
 * Allow client-side navigation to dynamic params without pre-generating them.
 * (Static export will rely on client-side rendering for unknown IDs.)
 */
export const dynamicParams = true;

export default function DefectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = asId(params.id);

  const [loading, setLoading] = React.useState(true);
  const [savingAction, setSavingAction] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [defect, setDefect] = React.useState<Defect | null>(null);
  const [actions, setActions] = React.useState<CorrectiveAction[]>([]);

  // new action form
  const [actionTitle, setActionTitle] = React.useState("");
  const [actionOwner, setActionOwner] = React.useState("");
  const [actionDue, setActionDue] = React.useState("");

  async function refresh() {
    const [d, a] = await Promise.all([api.getDefect(id), api.listActions(id)]);
    setDefect(d);
    setActions(a);
  }

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await refresh();
        if (!alive) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onDelete() {
    if (!confirm("Delete this defect and all associated actions?")) return;
    try {
      await api.deleteDefect(id);
      router.push("/defects");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to delete";
      alert(message);
    }
  }

  async function onCreateAction(e: React.FormEvent) {
    e.preventDefault();
    if (!actionTitle.trim() || !actionOwner.trim() || !actionDue.trim()) return;

    try {
      setSavingAction(true);
      await api.createAction({
        defectId: id,
        title: actionTitle.trim(),
        owner: actionOwner.trim(),
        dueDate: actionDue.trim(),
      });
      setActionTitle("");
      setActionOwner("");
      setActionDue("");
      await refresh();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to create action";
      alert(message);
    } finally {
      setSavingAction(false);
    }
  }

  async function toggleDone(a: CorrectiveAction) {
    try {
      await api.updateAction(a.id, { status: a.status === "done" ? "open" : "done" });
      await refresh();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to update action";
      alert(message);
    }
  }

  return (
    <div className="grid gap-6">
      {loading ? (
        <Card>
          <CardBody>
            <InlineSpinner label="Loading defect…" />
          </CardBody>
        </Card>
      ) : error ? (
        <Card>
          <CardBody>
            <p className="text-sm text-red-600">{error}</p>
            <div className="mt-3">
              <Link href="/defects">
                <Button variant="secondary">Back to defects</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : defect ? (
        <>
          <Card>
            <CardHeader
              title={defect.title}
              subtitle={`Created ${formatDate(defect.createdAt)} • Updated ${formatDate(defect.updatedAt)}`}
              right={
                <div className="flex flex-wrap gap-2">
                  <Link href={`/defects/${defect.id}/edit`}>
                    <Button variant="secondary">Edit</Button>
                  </Link>
                  <Button variant="danger" onClick={onDelete}>
                    Delete
                  </Button>
                </div>
              }
            />
            <CardBody>
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge severity={defect.severity} />
                <StatusBadge status={defect.status} />
                {defect.rootCause ? <Badge tone="cyan">Root cause captured</Badge> : <Badge tone="amber">Root cause pending</Badge>}
              </div>

              <Divider />

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <h3 className="text-sm font-semibold text-slate-900">Description</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{defect.description}</p>

                  {defect.rootCause ? (
                    <>
                      <Divider />
                      <h3 className="text-sm font-semibold text-slate-900">Root cause</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{defect.rootCause}</p>
                    </>
                  ) : null}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Image</h3>
                  <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    {defect.imageBase64 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="Defect image" src={defect.imageBase64} className="max-h-80 w-full rounded-xl object-contain bg-white" />
                    ) : (
                      <p className="text-sm text-slate-600">No image attached.</p>
                    )}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Corrective actions"
              subtitle="Track action owners, due dates, and completion. Overdue actions are highlighted."
            />
            <CardBody>
              <form onSubmit={onCreateAction} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <Input label="Action title" value={actionTitle} onChange={(e) => setActionTitle(e.target.value)} placeholder="What needs to be done?" />
                  <Input label="Owner" value={actionOwner} onChange={(e) => setActionOwner(e.target.value)} placeholder="Team or person" />
                  <Input label="Due date" type="date" value={actionDue} onChange={(e) => setActionDue(e.target.value)} />
                </div>
                <div>
                  <Button type="submit" disabled={savingAction || !actionTitle.trim() || !actionOwner.trim() || !actionDue.trim()}>
                    {savingAction ? "Adding…" : "Add action"}
                  </Button>
                </div>
              </form>

              <div className="mt-4 grid gap-3">
                {actions.length === 0 ? (
                  <p className="text-sm text-slate-600">No corrective actions yet.</p>
                ) : (
                  actions.map((a) => {
                    const overdue = isOverdue(a);
                    return (
                      <div
                        key={a.id}
                        className={[
                          "rounded-2xl border p-4 shadow-sm",
                          overdue ? "border-red-200 bg-red-50" : "border-slate-200 bg-white",
                        ].join(" ")}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-900">{a.title}</div>
                            <div className="mt-1 text-sm text-slate-600">
                              Owner: <span className="font-medium text-slate-800">{a.owner}</span>
                            </div>
                            <div className="mt-1 text-sm text-slate-600">
                              Due: <span className={overdue ? "font-semibold text-red-700" : "text-slate-800"}>{formatDate(a.dueDate)}</span>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {a.status === "done" ? <Badge tone="green">Done</Badge> : overdue ? <Badge tone="red">Overdue</Badge> : <Badge tone="blue">Active</Badge>}
                            <Button variant={a.status === "done" ? "secondary" : "primary"} onClick={() => toggleDone(a)}>
                              {a.status === "done" ? "Reopen" : "Mark done"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardBody>
          </Card>
        </>
      ) : null}
    </div>
  );
}
