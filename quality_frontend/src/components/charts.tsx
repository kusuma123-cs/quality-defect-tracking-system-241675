"use client";

import React from "react";
import { Card, CardBody } from "./ui";
import type { AnalyticsSeriesPoint } from "@/lib/api/types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// PUBLIC_INTERFACE
export function BarChart({
  title,
  data,
}: {
  title: string;
  data: AnalyticsSeriesPoint[];
}) {
  /** Simple responsive bar chart implemented in SVG (no external deps). */
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-xs text-slate-500">Counts by category</p>
      </div>
      <CardBody className="pt-2">
        <div className="grid gap-3">
          {data.map((d) => {
            const pct = (d.value / max) * 100;
            return (
              <div key={d.label} className="grid grid-cols-[120px_1fr_40px] items-center gap-3">
                <div className="truncate text-xs font-medium text-slate-700">{d.label}</div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"
                    style={{ width: `${clamp(pct, 0, 100)}%` }}
                  />
                </div>
                <div className="text-right text-xs text-slate-600">{d.value}</div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

// PUBLIC_INTERFACE
export function DonutChart({
  title,
  data,
}: {
  title: string;
  data: AnalyticsSeriesPoint[];
}) {
  /** Minimal donut chart: segments are rendered via stroke-dasharray on circles. */
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = 36;
  const c = 2 * Math.PI * r;

  // color palette aligned with #3b82f6 primary, #06b6d4 accent
  const colors = ["#3b82f6", "#06b6d4", "#64748b", "#f59e0b", "#ef4444", "#22c55e"];

  let offset = 0;
  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-xs text-slate-500">Share by category</p>
      </div>
      <CardBody className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <svg width="110" height="110" viewBox="0 0 110 110" role="img" aria-label={title}>
          <circle cx="55" cy="55" r={r} fill="none" stroke="#e2e8f0" strokeWidth="12" />
          {data.map((d, idx) => {
            const seg = (d.value / total) * c;
            const dasharray = `${seg} ${c - seg}`;
            const el = (
              <circle
                key={d.label}
                cx="55"
                cy="55"
                r={r}
                fill="none"
                stroke={colors[idx % colors.length]}
                strokeWidth="12"
                strokeDasharray={dasharray}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                transform="rotate(-90 55 55)"
              />
            );
            offset += seg;
            return el;
          })}
          <text x="55" y="58" textAnchor="middle" className="fill-slate-900" style={{ fontSize: 14, fontWeight: 700 }}>
            {total}
          </text>
          <text x="55" y="74" textAnchor="middle" className="fill-slate-500" style={{ fontSize: 10 }}>
            total
          </text>
        </svg>

        <div className="grid flex-1 gap-2">
          {data.map((d, idx) => (
            <div key={d.label} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors[idx % colors.length] }} />
                <span className="text-slate-700">{d.label}</span>
              </div>
              <span className="font-medium text-slate-900">{d.value}</span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
