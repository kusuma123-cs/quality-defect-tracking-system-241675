"use client";

import React from "react";
import { api } from "@/lib/api/client";
import { BarChart, DonutChart } from "@/components/charts";
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
        const a = await api.analytics();
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
        <p className="mt-1 text-sm text-slate-600">Charts for severity, workflow status, and overdue action distribution.</p>
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
          <DonutChart title="Defects by severity" data={data.defectsBySeverity} />
          <DonutChart title="Defects by status" data={data.defectsByStatus} />
          <BarChart title="Overdue actions by owner" data={data.actionsOverdueByOwner} />
        </div>
      ) : null}
    </div>
  );
}
