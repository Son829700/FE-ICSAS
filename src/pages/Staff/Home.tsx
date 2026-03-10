import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import API from "../../api";
import { useAuthContext } from "../../context/AuthContext";
import DashboardViewer from "../Dashboard/DashboardViewer";

interface Group {
  group_id: string;
  group_name: string;
}

interface Dashboard {
  dashboard_id: string;
  dashboard_name: string;
  url_path: string;
  category: string;
  status: string;
}

export default function StaffHome() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(
    null,
  );

  const { user } = useAuthContext();

  useEffect(() => {
    const fetchDashboards = async () => {
      try {
        if (!user?.user_id) return;

        setLoading(true);

        // 1️⃣ Lấy tất cả group của user
        const groupRes = await API.get(
          `/groups/groups-by-user/${user.user_id}`,
        );

        const groups: Group[] = groupRes.data.data;
        console.log(groups);
        if (!groups.length) {
          setDashboards([]);
          return;
        }

        // 2️⃣ Gọi API dashboard cho từng group
        const dashboardPromises = groups.map((g) =>
          API.get(`/dashboard/group-access/group/${g.group_id}`),
        );

        const dashboardResponses = await Promise.all(dashboardPromises);

        // 3️⃣ Gom tất cả dashboard lại thành 1 mảng
        const allDashboards: Dashboard[] = dashboardResponses
          .flatMap((res) => res.data.data)
          .filter((d) => d.status === "ACTIVE"); 
        console.log(dashboardPromises);
        // 4️⃣ Remove duplicate theo dashboard_id
        const uniqueDashboardsMap = new Map<string, Dashboard>();

        allDashboards.forEach((d) => {
          if (!uniqueDashboardsMap.has(d.dashboard_id)) {
            uniqueDashboardsMap.set(d.dashboard_id, d);
          }
        });

        const uniqueDashboards = Array.from(uniqueDashboardsMap.values());

        setDashboards(uniqueDashboards);

        // 5️⃣ Set mặc định dashboard đầu tiên
        if (uniqueDashboards.length > 0) {
          setSelectedDashboard(uniqueDashboards[0]);
        }
      } catch (error) {
        console.error("Fetch dashboards error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboards();
  }, []);

  return (
    <>
      <PageMeta
        title="Staff Home | Internal System"
        description="Embedded analytics dashboard"
      />

      <div className="space-y-4">
        {/* ================= DROPDOWN ================= */}
        {!loading && dashboards.length > 0 && (
          <div className="flex justify-end">
            <select
              value={selectedDashboard?.dashboard_id}
              onChange={(e) => {
                const selected = dashboards.find(
                  (d) => d.dashboard_id === e.target.value,
                );
                if (selected) setSelectedDashboard(selected);
              }}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              {dashboards.map((d) => (
                <option key={d.dashboard_id} value={d.dashboard_id}>
                  {d.dashboard_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ================= IFRAME ================= */}
        {selectedDashboard ? (
          <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
            <DashboardViewer
              url={selectedDashboard.url_path}
              category={selectedDashboard.category}
            />
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            No dashboard assigned to your groups.
          </div>
        )}
      </div>
    </>
  );
}
