import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import API from "../../api";
import { useAuthContext } from "../../context/AuthContext";
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Layers,
  ChevronUp,
} from "lucide-react";

/* ── Types ── */
interface Dashboard {
  dashboard_id: string;
  dashboard_name: string;
  url_path: string;
  category: string;
  status: string;
}

interface Group {
  group_id: string;
  group_name: string;
  description: string;
  member: number;
  groupType: string;
  status: string;
  createdAt: string;
  department_name?: string;
}

interface GroupWithDashboards extends Group {
  dashboards: Dashboard[];
  loading: boolean;
}

export default function DashboardDropdown() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const location = useLocation();

  // Try to grab dashboard id from the URL (e.g. /dashboard/:id)
  const pathParts = location.pathname.split("/");
  // Depending on routing, let's just look for the part after dashboard or something.
  // E.g. if pathname is "/dashboard/123", id is "123".
  // If we are at root "/" and it redirects to "/dashboard/123", it might update.
  const idIndex = pathParts.indexOf("dashboard");
  const urlId = idIndex !== -1 && pathParts.length > idIndex + 1 ? pathParts[idIndex + 1] : undefined;

  const { id: paramId } = useParams();
  const id = urlId || paramId;

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);

  // Dropdown panel state
  const [panelOpen, setPanelOpen] = useState(false);
  const [groups, setGroups] = useState<GroupWithDashboards[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [noAccess, setNoAccess] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ── Close panel on outside click ── */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setPanelOpen(false);
      }
    };
    if (panelOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [panelOpen]);

  /* ── Fetch current dashboard by id ── */
  useEffect(() => {
    const fetchDashboard = async () => {
      if (!id) return;
      try {
        const res = await API.get(`/dashboard/check-access/${id}`);
        setDashboard(res.data.data);
      } catch {
        setDashboard(null);
      }
    };
    if (id) fetchDashboard();
    else setDashboard(null);
  }, [id]);

  /* ── Fetch groups when panel opens (lazy / once) ── */
  useEffect(() => {
    if (!panelOpen || !user?.user_id) return;
    if (groups.length > 0 || noAccess) return; // already loaded

    const fetchGroups = async () => {
      setGroupsLoading(true);
      try {
        const res = await API.get(`/groups/groups-by-user/${user.user_id}`);
        const raw: Group[] = res.data.data ?? [];
        const activeGroups = raw.filter((g) => g.status === "ACTIVE");

        if (!activeGroups.length) {
          setNoAccess(true);
          return;
        }

        setGroups(
          activeGroups.map((g) => ({ ...g, dashboards: [], loading: false }))
        );
      } catch {
        setNoAccess(true);
      } finally {
        setGroupsLoading(false);
      }
    };

    fetchGroups();
  }, [panelOpen, user?.user_id, groups.length, noAccess]);

  /* ── Load dashboards for a group on expand ── */
  const loadGroupDashboards = async (groupId: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.group_id === groupId ? { ...g, loading: true } : g))
    );
    try {
      const res = await API.get(`/dashboard/group-access/group/${groupId}`);
      const dashboards: Dashboard[] = (res.data.data ?? []).filter(
        (d: Dashboard) => d.status === "ACTIVE"
      );
      setGroups((prev) =>
        prev.map((g) =>
          g.group_id === groupId ? { ...g, dashboards, loading: false } : g
        )
      );
    } catch {
      setGroups((prev) =>
        prev.map((g) =>
          g.group_id === groupId ? { ...g, loading: false } : g
        )
      );
    }
  };

  /* ── Toggle group expand ── */
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
        const group = groups.find((g) => g.group_id === groupId);
        if (group && group.dashboards.length === 0 && !group.loading) {
          loadGroupDashboards(groupId);
        }
      }
      return next;
    });
  };

  /* ── Select a dashboard ── */
  const selectDashboard = (dashboardId: string) => {
    navigate(`/dashboard/${dashboardId}`);
    setPanelOpen(false);
  };

  return (
    <div className="flex items-center gap-3" ref={dropdownRef}>
      {/* ── Dropdown trigger button ── */}
      <div className="relative">
        <button
          id="groups-panel-toggle"
          onClick={() => setPanelOpen((o) => !o)}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200 ${
            panelOpen
              ? "border-brand-400 bg-brand-50 text-brand-600 dark:border-brand-500 dark:bg-brand-900/30 dark:text-brand-400"
              : "border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-brand-600 dark:hover:text-brand-400"
          }`}
        >
          <Layers className="h-4 w-4" />
          Select Dashboard
          {panelOpen ? (
            <ChevronUp className="h-4 w-4 opacity-70" />
          ) : (
            <ChevronDown className="h-4 w-4 opacity-70" />
          )}
        </button>

        {/* ════════════════════════════════════════
            DROPDOWN  —  Groups & Dashboards list
        ════════════════════════════════════════ */}
        {panelOpen && (
          <div className="absolute left-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
            {/* Dropdown header */}
            <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                My Groups
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                Expand a group to browse dashboards
              </p>
            </div>

            {/* Dropdown body */}
            <div className="max-h-[420px] overflow-y-auto p-2">
              {/* Loading spinner */}
              {groupsLoading && (
                <div className="flex items-center justify-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                </div>
              )}

              {/* No access state */}
              {!groupsLoading && noAccess && (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Layers className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm text-gray-400">
                    You are not assigned to any active groups.
                  </p>
                </div>
              )}

              {/* Groups ── */}
              {!groupsLoading &&
                groups.map((group) => {
                  const isExpanded = expandedGroups.has(group.group_id);
                  return (
                    <div
                      key={group.group_id}
                      className="mb-0.5 overflow-hidden rounded-lg"
                    >
                      {/* Group row */}
                      <button
                        onClick={() => toggleGroup(group.group_id)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-brand-50 dark:bg-brand-900/30">
                          <Layers className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                            {group.group_name}
                          </p>
                          {group.department_name && (
                            <p className="truncate text-xs text-gray-400">
                              {group.department_name}
                            </p>
                          )}
                        </div>

                        {group.loading ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
                        ) : isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                        )}
                      </button>

                      {/* Dashboard rows ── */}
                      {isExpanded && (
                        <div className="ml-4 space-y-0.5 border-l border-gray-100 pl-3 pt-0.5 dark:border-gray-800">
                          {group.loading && (
                            <p className="py-2 text-xs text-gray-400">
                              Loading...
                            </p>
                          )}

                          {!group.loading && group.dashboards.length === 0 && (
                            <p className="py-2 text-xs text-gray-400">
                              No dashboards available.
                            </p>
                          )}

                          {!group.loading &&
                            group.dashboards.map((db) => {
                              const isActive = id === db.dashboard_id;
                              return (
                                <button
                                  key={db.dashboard_id}
                                  id={`dashboard-item-${db.dashboard_id}`}
                                  onClick={() =>
                                    selectDashboard(db.dashboard_id)
                                  }
                                  className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs transition-colors ${
                                    isActive
                                      ? "bg-brand-50 font-semibold text-brand-600 dark:bg-brand-900/30 dark:text-brand-400"
                                      : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                                  }`}
                                >
                                  <LayoutDashboard
                                    className={`h-3.5 w-3.5 flex-shrink-0 ${
                                      isActive
                                        ? "text-brand-500"
                                        : "text-gray-400"
                                    }`}
                                  />
                                  <span className="truncate">
                                    {db.dashboard_name}
                                  </span>
                                  {isActive && (
                                    <span className="ml-auto rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-600 dark:bg-brand-900/50 dark:text-brand-400">
                                      Viewing
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* ── Breadcrumb: current dashboard name ── */}
      {dashboard && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <LayoutDashboard className="h-4 w-4 text-brand-500" />
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {dashboard.dashboard_name}
          </span>
        </div>
      )}
    </div>
  );
}
