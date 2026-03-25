"use client";

import { useMemo } from "react";
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { useDefectsStore } from "@/lib/useLocalStore";

const COLORS = ["#3b82f6", "#06b6d4", "#f59e0b", "#ef4444", "#64748b", "#8b5cf6", "#10b981"];

export default function AnalyticsPage() {
  const { defects } = useDefectsStore();

  const byType = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of defects) map.set(d.defectType || "Unknown", (map.get(d.defectType || "Unknown") ?? 0) + d.quantity);
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [defects]);

  const trend = useMemo(() => {
    // Aggregate by occurredAt date
    const map = new Map<string, number>();
    for (const d of defects) map.set(d.occurredAt, (map.get(d.occurredAt) ?? 0) + d.quantity);
    return [...map.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [defects]);

  return (
    <div className="grid">
      <section className="card">
        <div className="cardHeader">
          <div>
            <h1 className="h1">Analytics</h1>
            <p className="subtle">Charts are computed in-browser from localStorage. No API calls.</p>
          </div>
        </div>

        <div className="hr" />

        {byType.length === 0 ? (
          <div className="callout">
            <p style={{ margin: 0 }}>No data yet. Log some defects to see analytics.</p>
          </div>
        ) : (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byType} dataKey="value" nameKey="name" innerRadius={60} outerRadius={110} paddingAngle={2}>
                  {byType.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="card">
        <div className="cardHeader">
          <div>
            <h2 className="h1">Trend over time</h2>
            <p className="subtle">Total quantity by day.</p>
          </div>
        </div>

        <div className="hr" />

        {trend.length === 0 ? (
          <div className="callout">
            <p style={{ margin: 0 }}>No data yet.</p>
          </div>
        ) : (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={trend} margin={{ top: 10, right: 18, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(17,24,39,0.12)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}
