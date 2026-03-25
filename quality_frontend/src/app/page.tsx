"use client";

import Link from "next/link";
import React from "react";
import { api } from "@/lib/api/client";
import { BarChart, DonutChart } from "@/components/charts";
import { Badge, Button, Card, CardBody, CardHeader, InlineSpinner } from "@/components/ui";

export default function DashboardPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<Awaited<ReturnType<typeof api.dashboard>> | null>(null);
  const [analytics, setAnalytics] = React.useState<Awaited<ReturnType<typeof api.analytics>> | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [s, a] = await Promise.all([api.dashboard(), api.analytics()]);
        if (!alive) return;
        setSummary(s);
        setAnalytics(a);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load dashboard";
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Overview of defects, workflow status, and corrective actions.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/defects/new">
            <Button>Create defect</Button>
          </Link>
          <Link href="/defects">
            <Button variant="secondary">View defects</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardBody>
            <InlineSpinner label="Loading dashboard…" />
          </CardBody>
        </Card>
      ) : error ? (
        <Card>
          <CardBody>
            <p className="text-sm text-red-600">{error}</p>
            <p className="mt-2 text-xs text-slate-500">
              The UI can still operate using mock data if CRUD endpoints are not yet available.
            </p>
          </CardBody>
        </Card>
      ) : summary && analytics ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardBody>
                <div className="text-xs font-medium text-slate-500">Total defects</div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">{summary.totalDefects}</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-xs font-medium text-slate-500">Open / active</div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">{summary.openDefects}</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-xs font-medium text-slate-500">Overdue actions</div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="text-2xl font-semibold text-slate-900">{summary.overdueActions}</div>
                  {summary.overdueActions > 0 ? (
                    <Badge tone="red">Needs attention</Badge>
                  ) : (
                    <Badge tone="green">On track</Badge>
                  )}
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-xs font-medium text-slate-500">Workflow</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(summary.byStatus).map(([k, v]) => (
                    <Badge
                      key={k}
                      tone={k === "open" || k === "action_required" ? "amber" : "slate"}
                    >
                      {k.replaceAll("_", " ")}: {v}
                    </Badge>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <DonutChart title="Defects by severity" data={analytics.defectsBySeverity} />
            <BarChart title="Defects by status" data={analytics.defectsByStatus} />
          </div>

          <Card>
            <CardHeader
              title="Overdue actions"
              subtitle="Owners with overdue corrective actions"
              right={
                <Link href="/defects">
                  <Button variant="secondary">Manage actions</Button>
                </Link>
              }
            />
            <CardBody>
              {analytics.actionsOverdueByOwner.length === 0 ? (
                <p className="text-sm text-slate-600">No overdue actions.</p>
              ) : (
                <div className="grid gap-2">
                  {analytics.actionsOverdueByOwner.map((p) => (
                    <div
                      key={p.label}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <div className="text-sm font-medium text-slate-800">{p.label}</div>
                      <Badge tone="red">{p.value} overdue</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </>
      ) : null}
    </div>
  );
}
