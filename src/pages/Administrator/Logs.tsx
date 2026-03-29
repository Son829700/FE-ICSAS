import { useEffect, useState, useRef } from "react";
import PageMeta from "../../components/common/PageMeta";
import API from "../../api";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { Eye, X, ArrowUpDown } from "lucide-react";

/* =======================
   TYPES
======================= */
interface ApiLog {
  log_id: string;
  user: {
    user_id: string;
    username: string;
    email: string;
    role: string;
  };
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

/* =======================
   CONSTANTS
======================= */
const PAGE_SIZE = 10;

type ActionFilter = "ALL" | "CREATE" | "UPDATE" | "DELETE";
type EntityFilter = "ALL" | "USER" | "GROUP" | "DEPARTMENT" | "DASHBOARD" | "TICKET";
type SortDir = "desc" | "asc";

const getActionType = (action: string): "CREATE" | "UPDATE" | "DELETE" => {
  if (!action) return "UPDATE";
  if (
    action.includes("CREATED") ||
    action.includes("ADDED") ||
    action.includes("GRANTED")
  )
    return "CREATE";
  if (
    action.includes("DELETED") ||
    action.includes("REVOKED") ||
    action.includes("REMOVED")
  )
    return "DELETE";
  return "UPDATE";
};

const ACTION_STYLE: Record<"CREATE" | "UPDATE" | "DELETE", string> = {
  CREATE:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  UPDATE:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DELETE:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const ENTITY_STYLE: Record<string, string> = {
  USER: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  GROUP: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  DEPARTMENT: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  DASHBOARD: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  TICKET: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

/* =======================
   DETAIL MODAL
======================= */
function LogDetailModal({
  log,
  onClose,
}: {
  log: ApiLog;
  onClose: () => void;
}) {
  const [details, setDetails] = useState<LogDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/logs/${log.log_id}/details`);
        setDetails(res.data.data ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [log.log_id]);

  const actionType = getActionType(log.action);
  const isUpdate = actionType === "UPDATE";
  const hasChanges = details.some((d) => d.column_name || d.old_value || d.new_value);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Log Detail
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ACTION_STYLE[actionType]}`}
              >
                {log.action.replace(/_/g, " ")}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ENTITY_STYLE[log.target_entity] ?? ""}`}
              >
                {log.target_entity}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Meta info */}
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {[
              { label: "Log ID", value: log.log_id },
              {
                label: "Performed by",
                value: (
                  <div className="flex flex-col">
                    <span className="font-medium">{log.user?.username}</span>
                    <span className="text-xs text-gray-500">{log.user?.email}</span>
                    <span className="text-xs text-gray-400">{log.user?.role}</span>
                  </div>
                ),
              },
              { label: "Target entity", value: log.target_entity },
              { label: "Target ID", value: log.target_id || "—" },
              {
                label: "Time",
                value: new Date(log.created_at).toLocaleString(),
              },
            ].map(({ label, value }) => (
              <li key={label} className="flex gap-4 py-2.5">
                <span className="w-1/3 shrink-0 text-sm text-gray-500 dark:text-gray-400">
                  {label}
                </span>
                <span className="w-2/3 text-sm text-gray-700 dark:text-gray-300">
                  {value}
                </span>
              </li>
            ))}
          </ul>

          {/* Changes section — chỉ hiện khi là UPDATE và có data */}
          {loading ? (
            <div className="flex items-center justify-center py-6 text-sm text-gray-400">
              <svg className="animate-spin mr-2 size-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Loading details...
            </div>
          ) : isUpdate && hasChanges ? (
            <div>
              <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Changes
              </h4>
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="w-full table-auto text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/60">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                        Field
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                        Before
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                        After
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {details.map((d) => (
                      <tr key={d.id}>
                        <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {d.column_name?.replace(/_/g, " ") || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block rounded bg-red-50 px-2 py-0.5 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400 line-through">
                            {d.old_value || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                            {d.new_value || "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : !loading && !isUpdate ? (
            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-5 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-400">
                No field-level change data for{" "}
                <span className="font-medium">{actionType}</span> actions.
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

  // Close filter dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await API.get("/logs");
      setLogs(res.data.data ?? []);
    } catch (error) {
      console.error("Fetch logs error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter + search + sort
  const processed = logs
    .filter((log) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        log.user?.username?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q) ||
        log.target_entity?.toLowerCase().includes(q) ||
        log.target_id?.toLowerCase().includes(q);

      const matchAction =
        actionFilter === "ALL" || getActionType(log.action) === actionFilter;

      const matchEntity =
        entityFilter === "ALL" || log.target_entity === entityFilter;

      return matchSearch && matchAction && matchEntity;
    })
    .sort((a, b) => {
      const diff =
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return sortDir === "desc" ? diff : -diff;
    });

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const paginated = processed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats
  const total = logs.length;
  const creates = logs.filter((l) => getActionType(l.action) === "CREATE").length;
  const updates = logs.filter((l) => getActionType(l.action) === "UPDATE").length;
  const deletes = logs.filter((l) => getActionType(l.action) === "DELETE").length;

  const hasActiveFilters = actionFilter !== "ALL" || entityFilter !== "ALL";

  return (
    <>
      {selectedLog && (
        <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}

      <PageMeta
        title="Logs"
        description="View application logs with search, filters and status."
      />
      <PageBreadcrumb pageTitle="Logs" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        {[
          { label: "Total Logs", value: total, color: "text-gray-800 dark:text-white" },
          { label: "Created", value: creates, color: "text-emerald-600" },
          { label: "Updated", value: updates, color: "text-blue-600" },
          { label: "Deleted", value: deletes, color: "text-red-500" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              System Audit Logs
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {processed.length} of {total} logs
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
                <svg className="fill-current" width="16" height="16" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z"
                  />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search user, action, entity..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white py-2 pr-4 pl-9 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 sm:w-[220px]"
              />
            </div>

            {/* Action type tabs */}
            <div className="hidden h-10 items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 lg:inline-flex dark:bg-gray-900">
              {(["ALL", "CREATE", "UPDATE", "DELETE"] as ActionFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setActionFilter(f);
                    setPage(1);
                  }}
                  className={`h-9 rounded-md px-3 text-xs font-medium transition ${
                    actionFilter === f
                      ? "bg-white shadow-sm text-gray-900 dark:bg-gray-800 dark:text-white"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                  }`}
                >
                  {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Entity filter dropdown */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={`flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition ${
                  hasActiveFilters
                    ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M14.6537 5.90414C14.6537 4.48433 13.5027 3.33331 12.0829 3.33331C10.6631 3.33331 9.51206 4.48433 9.51204 5.90415M14.6537 5.90414C14.6537 7.32398 13.5027 8.47498 12.0829 8.47498C10.663 8.47498 9.51204 7.32398 9.51204 5.90415M14.6537 5.90414L17.7087 5.90411M9.51204 5.90415L2.29199 5.90411M5.34694 14.0958C5.34694 12.676 6.49794 11.525 7.91777 11.525C9.33761 11.525 10.4886 12.676 10.4886 14.0958M5.34694 14.0958C5.34694 15.5156 6.49794 16.6666 7.91778 16.6666C9.33761 16.6666 10.4886 15.5156 10.4886 14.0958M5.34694 14.0958L2.29199 14.0958M10.4886 14.0958L17.7087 14.0958"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Filter
                {hasActiveFilters && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] text-white">
                    {[actionFilter !== "ALL", entityFilter !== "ALL"].filter(Boolean).length}
                  </span>
                )}
              </button>

              {filterOpen && (
                <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  <div className="mb-3">
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Action Type
                    </label>
                    <select
                      value={actionFilter}
                      onChange={(e) => {
                        setActionFilter(e.target.value as ActionFilter);
                        setPage(1);
                      }}
                      className="h-9 w-full rounded-lg border border-gray-300 px-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    >
                      <option value="ALL">All</option>
                      <option value="CREATE">Create</option>
                      <option value="UPDATE">Update</option>
                      <option value="DELETE">Delete</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Entity
                    </label>
                    <select
                      value={entityFilter}
                      onChange={(e) => {
                        setEntityFilter(e.target.value as EntityFilter);
                        setPage(1);
                      }}
                      className="h-9 w-full rounded-lg border border-gray-300 px-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    >
                      <option value="ALL">All entities</option>
                      <option value="USER">User</option>
                      <option value="GROUP">Group</option>
                      <option value="DEPARTMENT">Department</option>
                      <option value="DASHBOARD">Dashboard</option>
                      <option value="TICKET">Ticket</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setActionFilter("ALL");
                        setEntityFilter("ALL");
                        setPage(1);
                        setFilterOpen(false);
                      }}
                      className="h-8 flex-1 rounded-lg border border-gray-300 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 transition"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setFilterOpen(false)}
                      className="h-8 flex-1 rounded-lg bg-brand-500 text-xs font-medium text-white hover:bg-brand-600 transition"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sort toggle */}
            <button
              onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
              title={sortDir === "desc" ? "Newest first" : "Oldest first"}
              className="flex h-10 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 transition"
            >
              <ArrowUpDown className="size-4" />
              {sortDir === "desc" ? "Newest" : "Oldest"}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {["User", "Action", "Entity", "Target ID", "Time", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Loading logs...
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                    No logs found.
                  </td>
                </tr>
              ) : (
                paginated.map((log) => {
                  const actionType = getActionType(log.action);
                  return (
                    <tr
                      key={log.log_id}
                      className="transition hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                    >
                      {/* User */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-800 dark:text-white">
                            {log.user?.username ?? "—"}
                          </span>
                          <span className="text-xs text-gray-400">
                            {log.user?.role}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ACTION_STYLE[actionType]}`}
                        >
                          {log.action.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ENTITY_STYLE[log.target_entity] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {log.target_entity}
                        </span>
                      </td>

                      {/* Target ID */}
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs text-gray-400 truncate max-w-[120px] block">
                          {log.target_id ? `${log.target_id.slice(0, 8)}...` : "—"}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>

                      {/* View detail */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition dark:hover:bg-gray-800 dark:hover:text-gray-200"
                          title="View detail"
                        >
                          <Eye className="size-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {processed.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
            </span>{" "}
            –{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {Math.min(page * PAGE_SIZE, processed.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {processed.length}
            </span>{" "}
            logs
          </p>

          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 transition"
            >
              Previous
            </button>

            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  // Show first, last, current ±1, and ellipsis
                  return (
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - page) <= 1
                  );
                })
                .reduce<(number | "…")[]>((acc, p, i, arr) => {
                  if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) {
                    acc.push("…");
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-sm">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${
                        page === p
                          ? "bg-brand-500 text-white"
                          : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
            </div>

            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default LogsList;