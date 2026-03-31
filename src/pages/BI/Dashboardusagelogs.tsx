/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState } from "react";
import API from "../../api";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { Monitor, Smartphone, Tablet, Clock, BarChart2, Users, Eye } from "lucide-react";

/* =======================
   TYPES
======================= */
interface Department {
  department_id: string;
  department_name: string;
  status: string;
}

interface User {
  user_id: string;
  username: string;
  email: string;
  role: string;
  department: Department | null;
}

interface Dashboard {
  dashboard_id: string;
  dashboard_name: string;
  category: string;
  status: string;
}

interface UsageLog {
  log_id: string;
  dashboard: Dashboard;
  user: User;
  viewed_at: string;
  duration: number; // seconds
  device_type: string;
}

const PAGE_SIZE = 12;

/* =======================
   HELPERS
======================= */
function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "< 1s";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
}

function DeviceIcon({ type }: { type: string }) {
  const t = type?.toLowerCase() ?? "";
  if (t === "mobile") return <Smartphone className="size-3.5" />;
  if (t === "tablet") return <Tablet className="size-3.5" />;
  return <Monitor className="size-3.5" />;
}

const CATEGORY_STYLE: Record<string, string> = {
  OVERVIEW: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  ANALYTICS: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  SALES: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
  MARKETING: "bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400",
  SUPPORT: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
};

/* =======================
   MAIN PAGE
======================= */
export default function DashboardUsageLogs() {
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedDashboard, setSelectedDashboard] = useState("");
  const [selectedDevice, setSelectedDevice] = useState("");
  const [sortBy, setSortBy] = useState<"viewed_at" | "duration">("viewed_at");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [logsRes, dashRes] = await Promise.all([
          API.get("/dashboard-usage-logs"),
          API.get("/dashboard"),
        ]);
        setLogs(logsRes.data.data ?? []);
        setDashboards((dashRes.data.data ?? []).filter((d: Dashboard) => d.status === "ACTIVE"));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Process logs
  const processed = logs
    .filter((log) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        log.user?.username?.toLowerCase().includes(q) ||
        log.user?.email?.toLowerCase().includes(q) ||
        log.dashboard?.dashboard_name?.toLowerCase().includes(q) ||
        log.user?.department?.department_name?.toLowerCase().includes(q);
      const matchDashboard = !selectedDashboard || log.dashboard?.dashboard_id === selectedDashboard;
      const matchDevice = !selectedDevice || log.device_type?.toLowerCase() === selectedDevice.toLowerCase();
      return matchSearch && matchDashboard && matchDevice;
    })
    .sort((a, b) => {
      if (sortBy === "duration") {
        return sortDir === "desc" ? b.duration - a.duration : a.duration - b.duration;
      }
      const d = new Date(b.viewed_at).getTime() - new Date(a.viewed_at).getTime();
      return sortDir === "desc" ? d : -d;
    });

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const paginated = processed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats
  const totalViews = logs.length;
  const uniqueUsers = new Set(logs.map((l) => l.user?.user_id)).size;
  const uniqueDashboards = new Set(logs.map((l) => l.dashboard?.dashboard_id)).size;
  const avgDuration =
    logs.length > 0
      ? Math.round(logs.reduce((s, l) => s + (l.duration ?? 0), 0) / logs.length)
      : 0;

  // Top dashboards
  const dashboardCounts = logs.reduce<Record<string, { name: string; count: number; totalDuration: number }>>((acc, l) => {
    const id = l.dashboard?.dashboard_id;
    if (!id) return acc;
    if (!acc[id]) acc[id] = { name: l.dashboard.dashboard_name, count: 0, totalDuration: 0 };
    acc[id].count++;
    acc[id].totalDuration += l.duration ?? 0;
    return acc;
  }, {});
  const topDashboards = Object.values(dashboardCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const hasFilters = search || selectedDashboard || selectedDevice;

  return (
    <>
      <PageMeta title="Dashboard Usage Logs" description="Track who viewed which dashboard" />
      <PageBreadcrumb pageTitle="Dashboard Usage Logs" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        {[
          { label: "Total Views", value: totalViews, color: "text-gray-800 dark:text-white", icon: <Eye className="size-4" /> },
          { label: "Unique Users", value: uniqueUsers, color: "text-brand-600", icon: <Users className="size-4" /> },
          { label: "Dashboards Viewed", value: uniqueDashboards, color: "text-purple-600", icon: <BarChart2 className="size-4" /> },
          { label: "Avg Duration", value: formatDuration(avgDuration), color: "text-emerald-600", icon: <Clock className="size-4" /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              <span className="text-gray-300 dark:text-gray-600">{icon}</span>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-4 mb-6">
        {/* Top Dashboards */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white">Top Viewed Dashboards</h3>
          {topDashboards.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No data yet.</p>
          ) : (
            <ul className="space-y-3">
              {topDashboards.map((d, i) => (
                <li key={d.name} className="flex items-center gap-3">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-500 dark:bg-gray-800"}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{d.name}</p>
                    <p className="text-xs text-gray-400">{d.count} views · avg {formatDuration(Math.round(d.totalDuration / d.count))}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Device breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white">By Device</h3>
          {(() => {
            const counts: Record<string, number> = {};
            logs.forEach((l) => {
              const d = l.device_type || "Unknown";
              counts[d] = (counts[d] ?? 0) + 1;
            });
            return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([device, count]) => {
              const pct = logs.length ? Math.round((count / logs.length) * 100) : 0;
              return (
                <div key={device} className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                      <DeviceIcon type={device} />
                      {device}
                    </div>
                    <span className="text-xs font-medium text-gray-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                    <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Main table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">View Logs</h3>
            <p className="text-sm text-gray-500">{processed.length} of {totalViews} records</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
                <svg className="fill-current" width="15" height="15" viewBox="0 0 20 20">
                  <path fillRule="evenodd" clipRule="evenodd" d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z"/>
                </svg>
              </span>
              <input type="text" placeholder="Search user, dashboard..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-4 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 sm:w-[200px]"
              />
            </div>

            {/* Dashboard filter */}
            <select value={selectedDashboard} onChange={(e) => { setSelectedDashboard(e.target.value); setPage(1); }}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <option value="">All Dashboards</option>
              {dashboards.map((d) => (
                <option key={d.dashboard_id} value={d.dashboard_id}>{d.dashboard_name}</option>
              ))}
            </select>

            {/* Device filter */}
            <select value={selectedDevice} onChange={(e) => { setSelectedDevice(e.target.value); setPage(1); }}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <option value="">All Devices</option>
              <option value="Desktop">Desktop</option>
              <option value="Mobile">Mobile</option>
              <option value="Tablet">Tablet</option>
            </select>

            {/* Sort */}
            <div className="hidden h-10 items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 lg:inline-flex dark:bg-gray-900">
              {([["viewed_at", "Latest"], ["duration", "Duration"]] as const).map(([val, label]) => (
                <button key={val}
                  onClick={() => {
                    if (sortBy === val) setSortDir((d) => d === "desc" ? "asc" : "desc");
                    else { setSortBy(val); setSortDir("desc"); }
                    setPage(1);
                  }}
                  className={`h-9 rounded-md px-3 text-xs font-medium transition flex items-center gap-1 ${sortBy === val ? "bg-white shadow-sm text-gray-900 dark:bg-gray-800 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}>
                  {label}
                  {sortBy === val && <span className="text-[10px]">{sortDir === "desc" ? "↓" : "↑"}</span>}
                </button>
              ))}
            </div>

            {/* Clear */}
            {hasFilters && (
              <button onClick={() => { setSearch(""); setSelectedDashboard(""); setSelectedDevice(""); setPage(1); }}
                className="text-xs text-gray-400 hover:text-gray-600 transition">
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {["Dashboard", "User", "Department", "Viewed At", "Duration", "Device"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Loading logs...
                  </div>
                </td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">No records found.</td></tr>
              ) : paginated.map((log) => (
                <tr key={log.log_id} className="transition hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  {/* Dashboard */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 text-xs font-bold">
                        {log.dashboard?.dashboard_name?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white truncate max-w-[160px]">
                          {log.dashboard?.dashboard_name ?? "—"}
                        </p>
                        <span className={`text-xs rounded-full px-2 py-0.5 ${CATEGORY_STYLE[log.dashboard?.category] ?? "bg-gray-100 text-gray-500"}`}>
                          {log.dashboard?.category ?? "—"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* User */}
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{log.user?.username ?? "—"}</p>
                    <p className="text-xs text-gray-400">{log.user?.email}</p>
                  </td>

                  {/* Department */}
                  <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                    {log.user?.department?.department_name ?? <span className="text-gray-300 italic text-xs">—</span>}
                  </td>

                  {/* Viewed at */}
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.viewed_at).toLocaleString()}
                  </td>

                  {/* Duration */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
                      <span className={`text-sm font-medium ${log.duration > 300 ? "text-emerald-600" : log.duration > 60 ? "text-blue-500" : "text-gray-500"}`}>
                        {formatDuration(log.duration)}
                      </span>
                    </div>
                  </td>

                  {/* Device */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <DeviceIcon type={log.device_type} />
                      {log.device_type || "Unknown"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4 dark:border-gray-800">
          <p className="text-sm text-gray-500">
            {processed.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, processed.length)} of {processed.length}
          </p>
          <div className="flex items-center gap-1">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3.5 text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 transition">Previous</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(p); return acc;
              }, [])
              .map((p, i) => p === "…"
                ? <span key={`e${i}`} className="px-1 text-gray-400 text-sm">…</span>
                : <button key={p} onClick={() => setPage(p as number)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${page === p ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"}`}>
                    {p}
                  </button>
              )}
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3.5 text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 transition">Next</button>
          </div>
        </div>
      </div>
    </>
  );
}