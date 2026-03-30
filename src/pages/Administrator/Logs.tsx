import { useEffect, useState, useRef } from "react";
import PageMeta from "../../components/common/PageMeta";
import API from "../../api";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { Eye, X, ArrowUpDown } from "lucide-react";

interface ApiLog {
  log_id: string;
  user: { user_id: string; username: string; email: string; role: string };
  action: string;
  target_entity: string;
  target_id: string;
  created_at: string;
}

interface LogDetail {
  id: string;
  systemAuditLogs: ApiLog;
  column_name: string;
  old_value: string;
  new_value: string;
}

const PAGE_SIZE = 10;
type ActionFilter = "ALL" | "CREATE" | "UPDATE" | "DELETE";
type EntityFilter = "ALL" | "USER" | "GROUP" | "DEPARTMENT" | "DASHBOARD" | "TICKET";
type SortDir = "desc" | "asc";

const getActionType = (action: string): "CREATE" | "UPDATE" | "DELETE" => {
  if (!action) return "UPDATE";
  if (action.includes("CREATED") || action.includes("ADDED") || action.includes("GRANTED")) return "CREATE";
  if (action.includes("DELETED") || action.includes("REVOKED") || action.includes("REMOVED")) return "DELETE";
  return "UPDATE";
};

const ACTION_STYLE: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  UPDATE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const ENTITY_STYLE: Record<string, string> = {
  USER: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  GROUP: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  DEPARTMENT: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  DASHBOARD: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  TICKET: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

const ENTITY_DOT: Record<string, string> = {
  USER: "bg-violet-400", GROUP: "bg-amber-400", DEPARTMENT: "bg-cyan-400",
  DASHBOARD: "bg-pink-400", TICKET: "bg-orange-400",
};

/* =======================
   JAVA TOSTRING PARSER
   Parses: "User(user_id=..., username=..., ...)"
======================= */
function parseJavaToString(value: string): Record<string, string> | null {
  if (!value) return null;
  const match = value.match(/^(\w+)\((.+)\)$/s);
  if (!match) return null;
  const fields: Record<string, string> = { _type: match[1] };
  const regex = /(\w+)=([^,=]+(?:\([^)]*\))?)/g;
  let m;
  while ((m = regex.exec(match[2])) !== null) {
    fields[m[1].trim()] = m[2].trim();
  }
  return fields;
}

function renderParsedValue(raw: string): React.ReactNode {
  if (!raw) return <span className="text-gray-400 italic">—</span>;
  const parsed = parseJavaToString(raw);
  if (!parsed) return <span className="text-gray-700 dark:text-gray-300 break-all">{raw}</span>;

  const { _type } = parsed;

  if (_type === "User") return (
    <div>
      <p className="font-medium text-gray-800 dark:text-white">{parsed.username ?? "—"}</p>
      {parsed.email && <p className="text-xs text-gray-400">{parsed.email}</p>}
      {parsed.role && (
        <span className="mt-1 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800">{parsed.role}</span>
      )}
    </div>
  );

  if (_type === "Department") return (
    <div>
      <p className="font-medium text-gray-800 dark:text-white">{parsed.department_name ?? parsed.name ?? "—"}</p>
      {parsed.status && (
        <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${parsed.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
          {parsed.status}
        </span>
      )}
    </div>
  );

  if (_type === "Dashboard") return (
    <div>
      <p className="font-medium text-gray-800 dark:text-white">{parsed.dashboard_name ?? "—"}</p>
      {parsed.category && <p className="text-xs text-gray-400">{parsed.category}</p>}
    </div>
  );

  if (_type === "Group") return (
    <div>
      <p className="font-medium text-gray-800 dark:text-white">{parsed.group_name ?? "—"}</p>
      {parsed.groupType && <p className="text-xs text-gray-400">{parsed.groupType}</p>}
    </div>
  );

  // Fallback: show top fields
  return (
    <div className="space-y-0.5">
      {Object.entries(parsed).filter(([k]) => k !== "_type").slice(0, 3).map(([k, v]) => (
        <p key={k} className="text-xs text-gray-600 dark:text-gray-400">
          <span className="text-gray-400">{k}: </span>{v}
        </p>
      ))}
    </div>
  );
}

function getChangeSummary(d: LogDetail): string {
  const col = d.column_name?.replace(/_/g, " ") ?? "field";
  const oldP = parseJavaToString(d.old_value);
  const newP = parseJavaToString(d.new_value);

  if (oldP?._type === "User" && newP?._type === "User")
    return `Changed ${col}: "${oldP.username ?? "?"}" → "${newP.username ?? "?"}"`;
  if (oldP?._type === "Department" && newP?._type === "Department")
    return `Moved department: "${oldP.department_name ?? "?"}" → "${newP.department_name ?? "?"}"`;
  if (!d.old_value && d.new_value) return `Set ${col}`;
  if (d.old_value && !d.new_value) return `Cleared ${col}`;
  if (!oldP && !newP && d.old_value && d.new_value)
    return `Updated ${col}: "${d.old_value}" → "${d.new_value}"`;
  return `Updated ${col}`;
}

/* =======================
   DETAIL MODAL
======================= */
function LogDetailModal({ log, onClose }: { log: ApiLog; onClose: () => void }) {
  const [details, setDetails] = useState<LogDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await API.get(`/logs/${log.log_id}/details`);
        setDetails(res.data.data ?? []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [log.log_id]);

  const actionType = getActionType(log.action);
  const isUpdate = actionType === "UPDATE";
  const hasChanges = details.some((d) => d.column_name || d.old_value || d.new_value);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Log Detail</h3>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ACTION_STYLE[actionType]}`}>
                {log.action.replace(/_/g, " ")}
              </span>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ENTITY_STYLE[log.target_entity] ?? ""}`}>
                {log.target_entity}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition"><X className="size-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            <li className="flex gap-4 py-2.5">
              <span className="w-1/3 shrink-0 text-sm text-gray-500">Performed by</span>
              <div className="w-2/3 text-sm">
                <p className="font-medium text-gray-800 dark:text-white">{log.user?.username}</p>
                <p className="text-xs text-gray-500">{log.user?.email}</p>
                <p className="text-xs text-gray-400">{log.user?.role}</p>
              </div>
            </li>
            <li className="flex gap-4 py-2.5">
              <span className="w-1/3 shrink-0 text-sm text-gray-500">Target</span>
              <span className="w-2/3 text-sm font-mono text-gray-500">{log.target_id || "—"}</span>
            </li>
            <li className="flex gap-4 py-2.5">
              <span className="w-1/3 shrink-0 text-sm text-gray-500">Time</span>
              <span className="w-2/3 text-sm text-gray-700 dark:text-gray-300">{new Date(log.created_at).toLocaleString()}</span>
            </li>
          </ul>

          {loading ? (
            <div className="flex items-center justify-center py-6 text-sm text-gray-400">
              <svg className="animate-spin mr-2 size-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Loading...
            </div>
          ) : isUpdate && hasChanges ? (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Changes</h4>
              {details.map((d) => (
                <div key={d.id} className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
                  {/* Summary */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{getChangeSummary(d)}</p>
                  </div>
                  {/* Before / After side by side */}
                  <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-800">
                    <div className="px-4 py-3">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-red-400">Before</p>
                      <div className="text-sm">{renderParsedValue(d.old_value)}</div>
                    </div>
                    <div className="px-4 py-3">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">After</p>
                      <div className="text-sm">{renderParsedValue(d.new_value)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !loading ? (
            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-5 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-400">
                No field-level changes for <span className="font-medium">{actionType.toLowerCase()}</span> actions.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* =======================
   MAIN PAGE
======================= */
const LogsList: React.FC = () => {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("ALL");
  const [entityFilter, setEntityFilter] = useState<EntityFilter>("ALL");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null);
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
      try { setLoading(true); const r = await API.get("/logs"); setLogs(r.data.data ?? []); }
      catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, []);

  const processed = logs
    .filter((log) => {
      const q = search.toLowerCase();
      return (
        (!q || log.user?.username?.toLowerCase().includes(q) || log.action?.toLowerCase().includes(q) || log.target_entity?.toLowerCase().includes(q)) &&
        (actionFilter === "ALL" || getActionType(log.action) === actionFilter) &&
        (entityFilter === "ALL" || log.target_entity === entityFilter)
      );
    })
    .sort((a, b) => {
      const d = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return sortDir === "desc" ? d : -d;
    });

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const paginated = processed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const total = logs.length;
  const creates = logs.filter((l) => getActionType(l.action) === "CREATE").length;
  const updates = logs.filter((l) => getActionType(l.action) === "UPDATE").length;
  const deletes = logs.filter((l) => getActionType(l.action) === "DELETE").length;

  return (
    <>
      {selectedLog && <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
      <PageMeta title="Logs" description="System audit logs" />
      <PageBreadcrumb pageTitle="Logs" />

      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        {[
          { label: "Total", value: total, color: "text-gray-800 dark:text-white" },
          { label: "Created", value: creates, color: "text-emerald-600" },
          { label: "Updated", value: updates, color: "text-blue-600" },
          { label: "Deleted", value: deletes, color: "text-red-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">System Audit Logs</h3>
            <p className="text-sm text-gray-500">{processed.length} of {total} logs</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
                <svg className="fill-current" width="15" height="15" viewBox="0 0 20 20">
                  <path fillRule="evenodd" clipRule="evenodd" d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z"/>
                </svg>
              </span>
              <input type="text" placeholder="Search..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-4 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 sm:w-[200px]"
              />
            </div>

            {/* Action tabs */}
            <div className="hidden h-10 items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 lg:inline-flex dark:bg-gray-900">
              {(["ALL", "CREATE", "UPDATE", "DELETE"] as ActionFilter[]).map((f) => (
                <button key={f} onClick={() => { setActionFilter(f); setPage(1); }}
                  className={`h-9 rounded-md px-3 text-xs font-medium transition ${actionFilter === f ? "bg-white shadow-sm text-gray-900 dark:bg-gray-800 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}>
                  {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Entity filter */}
            <div className="relative" ref={filterRef}>
              <button onClick={() => setFilterOpen(!filterOpen)}
                className={`flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition ${entityFilter !== "ALL" ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}>
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                  <path d="M14.6537 5.90414C14.6537 4.48433 13.5027 3.33331 12.0829 3.33331C10.6631 3.33331 9.51206 4.48433 9.51204 5.90415M14.6537 5.90414C14.6537 7.32398 13.5027 8.47498 12.0829 8.47498C10.663 8.47498 9.51204 7.32398 9.51204 5.90415M14.6537 5.90414L17.7087 5.90411M9.51204 5.90415L2.29199 5.90411M5.34694 14.0958C5.34694 12.676 6.49794 11.525 7.91777 11.525C9.33761 11.525 10.4886 12.676 10.4886 14.0958M5.34694 14.0958C5.34694 15.5156 6.49794 16.6666 7.91778 16.6666C9.33761 16.6666 10.4886 15.5156 10.4886 14.0958M5.34694 14.0958L2.29199 14.0958M10.4886 14.0958L17.7087 14.0958" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {entityFilter === "ALL" ? "Entity" : entityFilter.charAt(0) + entityFilter.slice(1).toLowerCase()}
                {entityFilter !== "ALL" && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] text-white">1</span>}
              </button>

              {filterOpen && (
                <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  {(["ALL", "USER", "GROUP", "DEPARTMENT", "DASHBOARD", "TICKET"] as EntityFilter[]).map((e) => (
                    <button key={e} onClick={() => { setEntityFilter(e); setPage(1); setFilterOpen(false); }}
                      className={`flex w-full items-center gap-2.5 px-4 py-2 text-sm transition ${entityFilter === e ? "text-brand-600 bg-brand-50 dark:bg-brand-900/20 dark:text-brand-400" : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.04]"}`}>
                      {e !== "ALL" && <span className={`h-2 w-2 rounded-full ${ENTITY_DOT[e] ?? "bg-gray-400"}`} />}
                      {e === "ALL" ? "All Entities" : e.charAt(0) + e.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => setSortDir((d) => d === "desc" ? "asc" : "desc")}
              className="flex h-10 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 transition">
              <ArrowUpDown className="size-4" />
              {sortDir === "desc" ? "Newest" : "Oldest"}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {["User", "Action", "Entity", "Target ID", "Time", ""].map((h) => (
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
                <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">No logs found.</td></tr>
              ) : paginated.map((log) => {
                const at = getActionType(log.action);
                return (
                  <tr key={log.log_id} className="transition hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{log.user?.username ?? "—"}</p>
                      <p className="text-xs text-gray-400">{log.user?.role}</p>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ACTION_STYLE[at]}`}>
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ENTITY_STYLE[log.target_entity] ?? "bg-gray-100 text-gray-600"}`}>
                        {log.target_entity}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-gray-400">{log.target_id ? `${log.target_id.slice(0, 8)}...` : "—"}</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition dark:hover:bg-gray-800 dark:hover:text-gray-200">
                        <Eye className="size-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4 dark:border-gray-800">
          <p className="text-sm text-gray-500">{processed.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, processed.length)} of {processed.length}</p>
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
};

export default LogsList;