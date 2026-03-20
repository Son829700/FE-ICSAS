import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import API from "../../api";
import DashboardViewer from "../Dashboard/DashboardViewer";
import { useAuthContext } from "../../context/AuthContext";

interface Dashboard {
  dashboard_id: string;
  dashboard_name: string;
  url_path: string;
  category: string;
  status: string;
}

export interface Group {
  group_id: string;
  group_name: string;
  description: string;
  member: number;
  groupType: string;
  status: string;
  createdAt: string;
  department_name?: string;
}

export default function StaffHome() {
  const { id } = useParams();
  const { user } = useAuthContext();
  const role = user?.role;

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [hasDashboard, setHasDashboard] = useState<boolean | null>(null);

  useEffect(() => {
    const checkDashboards = async () => {
      try {
        // ADMIN và BI luôn có quyền — không cần check group
        if (role === "ADMINISTRATOR" || role === "BI" || role === "MANAGER") {
          setHasDashboard(true);
          return;
        }

        // Chỉ STAFF mới check qua group
        const groupRes = await API.get(
          `/groups/groups-by-user/${user?.user_id}`,
        );
        const groups: Group[] = groupRes.data.data;

        if (!groups.length) {
          setHasDashboard(false);
          return;
        }

        const responses = await Promise.all(
          groups.map((g) =>
            API.get(`/dashboard/group-access/group/${g.group_id}`),
          ),
        );

        const dashboards = responses
          .flatMap((res) => res.data.data)
          .filter((d: Dashboard) => d.status === "ACTIVE");

        setHasDashboard(dashboards.length > 0);
      } catch (err) {
        console.error(err);
        setHasDashboard(false);
      }
    };

    if (user?.user_id && role) checkDashboards();
  }, [user, role]); // thêm role vào dependency

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await API.get(`/dashboard/${id}`);
        setDashboard(res.data.data);
      } catch (error) {
        console.error(error);
        setDashboard(null);
      }
    };

    if (id) fetchDashboard();
    else setDashboard(null);
  }, [id]);

  return (
    <>
      <PageMeta title="Dashboard" description="Embedded dashboard" />

      {/* Không có quyền */}
      {hasDashboard === false && (
        <div className="flex items-center justify-center h-[60vh] text-gray-500">
          You don't have access to any dashboards.
        </div>
      )}

      {/* Có quyền nhưng chưa chọn dashboard */}
      {hasDashboard && !id && (
        <div className="flex items-center justify-center h-[60vh] text-gray-500">
          Please select a dashboard from the sidebar to view.
        </div>
      )}

      {/* Đã chọn dashboard */}
      {dashboard && (
        <div className="relative w-full h-[calc(100vh-120px)] overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
          <DashboardViewer
            url={dashboard.url_path}
            category={dashboard.category}
          />
        </div>
      )}
    </>
  );
}
