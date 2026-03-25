"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { api } from "@/lib/api/client";
import type { Defect, DefectListQuery, DefectStatus, Severity } from "@/lib/api/types";
import { Button, Card, CardBody, CardHeader, InlineSpinner, SeverityBadge, StatusBadge, Input, Select } from "@/components/ui";
import { formatDate } from "@/lib/date";

function parseQuery(sp: ReturnType<typeof useSearchParams>): DefectListQuery {
  const q = sp.get("q") || "";
  const severity = (sp.get("severity") as Severity | "all" | null) || "all";
  const status = (sp.get("status") as DefectStatus | "all" | null) || "all";

  const sortParam = sp.get("sort");
  const dirParam = sp.get("dir");

  const sort: NonNullable<DefectListQuery["sort"]> =
    sortParam === "createdAt" || sortParam === "updatedAt" || sortParam === "severity" || sortParam === "status"
      ? sortParam
      : "updatedAt";

  const dir: NonNullable<DefectListQuery["dir"]> = dirParam === "asc" || dirParam === "desc" ? dirParam : "desc";

  return { q, severity, status, sort, dir };
}

function toSearch(query: DefectListQuery) {
  const sp = new URLSearchParams();
  if (query.q) sp.set("q", query.q);
  if (query.severity && query.severity !== "all") sp.set("severity", query.severity);
  if (query.status && query.status !== "all") sp.set("status", query.status);
  if (query.sort) sp.set("sort", query.sort);
  if (query.dir) sp.set("dir", query.dir);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export default function DefectsClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<Defect[]>([]);

  const query = React.useMemo(() => parseQuery(searchParams), [searchParams]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.listDefects(query);
        if (!alive) return;
        setItems(data);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load defects";
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [query]);

  function setQuery(next: DefectListQuery) {
    router.push(`/defects${toSearch(next)}`);
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader
          title="Defects"
          subtitle="Search, filter, and manage defect records."
          right={
            <Link href="/defects/new">
              <Button>Create defect</Button>
            </Link>
          }
        />
        <CardBody>
          <div className="grid gap-3 md:grid-cols-4">
            <Input
              label="Search"
              placeholder="Title or description…"
              value={query.q || ""}
              onChange={(e) => setQuery({ ...query, q: e.target.value })}
            />
            <Select
              label="Severity"
              value={query.severity || "all"}
              onChange={(e) => setQuery({ ...query, severity: e.target.value as Severity | "all" })}
            >
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
            <Select
              label="Status"
              value={query.status || "all"}
              onChange={(e) => setQuery({ ...query, status: e.target.value as DefectStatus | "all" })}
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="action_required">Action required</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Sort"
                value={query.sort || "updatedAt"}
                onChange={(e) =>
                  setQuery({
                    ...query,
                    sort: e.target.value as NonNullable<DefectListQuery["sort"]>,
                  })
                }
              >
                <option value="updatedAt">Last updated</option>
                <option value="createdAt">Created</option>
                <option value="severity">Severity</option>
                <option value="status">Status</option>
              </Select>
              <Select
                label="Dir"
                value={query.dir || "desc"}
                onChange={(e) =>
                  setQuery({
                    ...query,
                    dir: e.target.value as NonNullable<DefectListQuery["dir"]>,
                  })
                }
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            {loading ? (
              <InlineSpinner label="Loading defects…" />
            ) : error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-slate-600">No defects match your filters.</p>
            ) : (
              <>
                <div className="hidden md:block">
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Title</th>
                          <th className="px-4 py-3">Severity</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Updated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {items.map((d) => (
                          <tr key={d.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <Link href={`/defects/${d.id}`} className="font-medium text-slate-900 hover:text-blue-700">
                                {d.title}
                              </Link>
                              <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">{d.description}</div>
                            </td>
                            <td className="px-4 py-3">
                              <SeverityBadge severity={d.severity} />
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={d.status} />
                            </td>
                            <td className="px-4 py-3 text-slate-600">{formatDate(d.updatedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid gap-3 md:hidden">
                  {items.map((d) => (
                    <Link key={d.id} href={`/defects/${d.id}`}>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:bg-slate-50">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-900">{d.title}</div>
                            <div className="mt-1 line-clamp-2 text-sm text-slate-600">{d.description}</div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <SeverityBadge severity={d.severity} />
                            <StatusBadge status={d.status} />
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-slate-500">Updated {formatDate(d.updatedAt)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
