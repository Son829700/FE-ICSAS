import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import API from "../../api";
import DashboardViewer from "../Dashboard/DashboardViewer";
import { useDashboardLogger } from "../../hooks/useDashboardLogger";
import { LayoutDashboard } from "lucide-react";

/* ── Types ── */
interface Dashboard {
  dashboard_id: string;
  dashboard_name: string;
  url_path: string;
  category: string;
  status: string;
}

/* ── Component ── */
export default function StaffHome() {
  const { id } = useParams();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);

  // Log usage
  useDashboardLogger(id);

  /* ── Fetch current dashboard by id ── */
  useEffect(() => {
    const fetchDashboard = async () => {
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

  /* ── Render ── */
  return (
    <>
      <PageMeta title="Dashboard" description="Embedded dashboard viewer" />

      <div className="flex h-[calc(100vh-80px)] flex-col gap-3 overflow-hidden">
        {/* ════════════════════════════════════════
            DASHBOARD VIEWER
        ════════════════════════════════════════ */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          {/* Empty: no dashboard selected */}
          {!id && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-gray-400 dark:text-gray-600">
              <LayoutDashboard className="h-16 w-16 opacity-25" />
              <div className="text-center">
                <p className="text-base font-medium text-gray-500 dark:text-gray-400">
                  No dashboard selected
                </p>
                <p className="mt-1 text-sm">
                  Click{" "}
                  <span className="font-semibold text-brand-500">
                    "Select Dashboard"
                  </span>{" "}
                  above to browse your groups.
                </p>
              </div>
            </div>
          )}

          {/* Dashboard embed */}
          {dashboard && (
            <div className="h-full w-full overflow-hidden">
              <DashboardViewer
                url={dashboard.url_path}
                category={dashboard.category}
              />
            </div>
          )}

          {/* id provided but dashboard not found / no access */}
          {id && !dashboard && (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              Unable to load the dashboard or you do not have access.
            </div>
          )}
        </div>
      </div>
    </>
  );
}