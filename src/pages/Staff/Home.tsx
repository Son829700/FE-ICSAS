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

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [hasDashboard, setHasDashboard] = useState<boolean | null>(null);

  useEffect(() => {
    const checkDashboards = async () => {
      try {
        const groupRes = await API.get(
          `/groups/groups-by-user/${user?.user_id}`
        );

        const groups = groupRes.data.data;

        if (!groups.length) {
          setHasDashboard(false);
          return;
        }

        const dashboardPromises = groups.map((g: Group) =>
          API.get(`/dashboard/group-access/group/${g.group_id}`)
        );

        const responses = await Promise.all(dashboardPromises);

        const dashboards = responses
          .flatMap((res) => res.data.data)
          .filter((d: Dashboard) => d.status === "ACTIVE");

        setHasDashboard(dashboards.length > 0);
      } catch (err) {
        console.error(err);
      }
    };

    if (user?.user_id) checkDashboards();
  }, [user]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await API.get(`/dashboard/${id}`);
        setDashboard(res.data.data);
      } catch (error) {
        console.error(error);
      }
    };

    if (id) fetchDashboard();
  }, [id]);

  return (
    <>
      <PageMeta title="Dashboard" description="Embedded dashboard" />

      {/* Không có dashboard */}
      {hasDashboard === false && (
        <div className="flex items-center justify-center h-[60vh] text-gray-500">
          You don't have access to any dashboards.
        </div>
      )}

      {/* Có dashboard nhưng chưa chọn */}
      {hasDashboard && !id && (
        <div className="flex items-center justify-center h-[60vh] text-gray-500">
          Please select a dashboard from the sidebar to view.
        </div>
      )}

      {/* Có dashboard và đã chọn */}
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