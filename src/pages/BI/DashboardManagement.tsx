import { useEffect, useState } from "react";
import API from "../../api";
import { Plus, Pencil, Trash2, RotateCcw } from "lucide-react";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import toast from "react-hot-toast";

export interface UserInfo {
  user_id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  department: Department | null;
  status: string;
}

export interface Dashboard {
  dashboard_id: string;
  dashboard_name: string;
  url_path: string;
  category: string;
  createdBy: UserInfo;
  updatedBy: UserInfo | null;
  status: string;
  createdAt: string | null;
}
export interface Department {
  department_id: string;
  department_name: string;
  status: string;
}
export default function DashboardManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(
    null,
  );
  const [dashboards, setDashboard] = useState<Dashboard[]>([]);
  const [formData, setFormData] = useState({
    dashboard_name: "",
    url_path: "",
    category: "",
  });
  useEffect(() => {
    if (editingDashboard) {
      setFormData({
        dashboard_name: editingDashboard.dashboard_name,
        url_path: editingDashboard.url_path,
        category: editingDashboard.category,
      });
    } else {
      setFormData({
        dashboard_name: "",
        url_path: "",
        category: "",
      });
    }
  }, [editingDashboard]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await API.get("/dashboard");
        setDashboard(response.data.data);
        console.log("API response:", response.data);
      } catch (error) {
        console.error("Fetch error in DashboardManagement:", error);
      }
    };

    fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleAddClick = () => {
    setEditingDashboard(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (dashboard: Dashboard) => {
    setEditingDashboard(dashboard);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDashboard(null);
  };
  const handleSubmit = async () => {
    try {
      if (editingDashboard) {
        // UPDATE
        await API.put(`/dashboard/${editingDashboard.dashboard_id}`, {
          dashboard_name: formData.dashboard_name,
          url_path: formData.url_path,
          category: formData.category,
        });
        toast.success("Dashboard updated successfully!");
      } else {
        // CREATE
        await API.post("/dashboard", {
          dashboard_name: formData.dashboard_name,
          url_path: formData.url_path,
          category: formData.category,
        });
      }
      const response = await API.get("/dashboard");
      setFormData({
        dashboard_name: "",
        url_path: "",
        category: "",
      });
      setDashboard(response.data.data);
      toast.success("Dashboard created successfully!");

      handleCloseModal();
    } catch (error) {
      console.error("Submit error:", error);
    }
  };
  const handleToggleStatus = async (dashboardId: string, status: string) => {
    try {
      if (status === "ACTIVE") {
        await API.put(`/dashboard/soft-delete/${dashboardId}`);
        toast.success("Dashboard set to inactive");
      } else {
        await API.put(`/dashboard/restore/${dashboardId}`);
        toast.success("Dashboard restored successfully");
      }

      const res = await API.get("/dashboard");
      setDashboard(res.data.data);
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Failed to update dashboard status");
    }
  };
  return (
    <div>
      <PageMeta
        title="Dashboard Management | Admin"
        description="Manage system dashboards"
      />
      <PageBreadcrumb pageTitle="Dashboard Management" />

      <ComponentCard
        title="Dashboards"
        desc="Manage all dashboards in the system"
        headerAction={
          <Button
            size="md"
            variant="primary"
            startIcon={<Plus className="size-5 text-white" />}
            onClick={handleAddClick}
          >
            Configure dashboard
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs text-gray-500"
                >
                  Name
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs text-gray-500"
                >
                  URL Path
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs text-gray-500"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs text-gray-500"
                >
                  Category
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs text-gray-500"
                >
                  Created By
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-right text-theme-xs text-gray-500"
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {dashboards.map((dashboard) => (
                <TableRow key={dashboard.dashboard_id}>
                  <TableCell className="px-5 py-4 font-medium text-gray-800 dark:text-white/90">
                    {dashboard.dashboard_name}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <span
                      title={dashboard.url_path}
                      className="inline-block max-w-[240px] truncate rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      {dashboard.url_path}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-md
      ${
        dashboard.status === "ACTIVE"
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
                    >
                      {dashboard.status}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                      {dashboard.category}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500">
                    {dashboard.createdBy.username}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right">
                    <TableCell className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {dashboard.status === "ACTIVE" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditClick(dashboard)}
                            >
                              <Pencil className="size-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleToggleStatus(
                                  dashboard.dashboard_id,
                                  dashboard.status,
                                )
                              }
                            >
                              <Trash2 className="size-4 text-red-500" />
                            </Button>
                          </>
                        )}

                        {dashboard.status === "INACTIVE" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleToggleStatus(
                                dashboard.dashboard_id,
                                dashboard.status,
                              )
                            }
                          >
                            <RotateCcw className="size-4 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ComponentCard>

      {/* --- REFACTORED MODAL --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        className="max-w-lg p-6" // Truyền class CSS trực tiếp vào Modal
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {editingDashboard ? "Edit Dashboard" : "Configure New Dashboard"}
          </h3>
          {/* Nút X đã được tích hợp sẵn trong component Modal của bạn qua prop showCloseButton */}
        </div>

        {/* Form Content */}
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Dashboard Name
            </label>
            <input
              type="text"
              name="dashboard_name"
              value={formData.dashboard_name}
              onChange={handleChange}
              placeholder="e.g. Sales Overview"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              URL Path
            </label>
            <input
              type="text"
              name="url_path"
              value={formData.url_path}
              onChange={handleChange}
              placeholder="/dashboard/example"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select Category</option>
              <option value="OVERVIEW">Overview</option>
              <option value="ANALYTICS">Analytics</option>
              <option value="OPERATION">Operation</option>
            </select>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary">
              {editingDashboard ? "Update Dashboard" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
