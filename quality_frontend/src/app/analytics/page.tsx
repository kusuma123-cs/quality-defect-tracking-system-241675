"use client";

import React from "react";
import { api } from "@/lib/api/client";
import { BarChart } from "@/components/charts";
import { Card, CardBody, InlineSpinner } from "@/components/ui";

export default function AnalyticsPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<Awaited<ReturnType<typeof api.analytics>> | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const a = await api.analytics(60);
        if (!alive) return;
        setData(a);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load analytics";
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-600">Created vs resolved trends and average time-to-resolve.</p>
      </div>

      {loading ? (
        <Card>
          <CardBody>
            <InlineSpinner label="Loading analytics…" />
          </CardBody>
        </Card>
      ) : error ? (
        <Card>
          <CardBody>
            <p className="text-sm text-red-600">{error}</p>
          </CardBody>
        </Card>
      ) : data ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <BarChart
            title="Defects created (last 14 days)"
            data={data.trends.slice(-14).map((p) => ({ label: p.date.slice(5), value: p.created }))}
          />
          <BarChart
            title="Defects resolved (last 14 days)"
            data={data.trends.slice(-14).map((p) => ({ label: p.date.slice(5), value: p.resolved }))}
          />
          <Card className="lg:col-span-2">
            <CardBody>
              <div className="text-xs font-medium text-slate-500">Average days to resolve</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                {data.avg_days_to_resolve == null ? "—" : data.avg_days_to_resolve.toFixed(1)}
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Computed from defects in resolved/verified/closed statuses.
              </p>
            </CardBody>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
