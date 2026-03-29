import { useEffect, useState } from "react";
import API from "../../api";
import {
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Eye,
  X,
} from "lucide-react";
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
import DashboardViewer from "../Dashboard/DashboardViewer";


/* =======================
   TYPES
======================= */
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

/* =======================
   STATUS + CATEGORY STYLES
======================= */
const STATUS_STYLE: Record<string, string> = {
  ACTIVE:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  DRAFT:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  INACTIVE:
    "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

const CATEGORY_STYLE: Record<string, string> = {
  OVERVIEW:
    "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  ANALYTICS:
    "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  SALES:
    "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
  MARKETING:
    "bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400",
  SUPPORT:
    "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
};

/* =======================
   VIEW MODAL (ACTIVE — read-only)
======================= */
function DashboardViewModal({
  dashboard,
  onClose,
}: {
  dashboard: Dashboard;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {dashboard.dashboard_name}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[dashboard.status]}`}
              >
                {dashboard.status}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_STYLE[dashboard.category] ?? "bg-gray-100 text-gray-500"}`}
              >
                {dashboard.category}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
          
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <ul className="flex flex-wrap gap-x-8 gap-y-2">
            <li className="text-sm">
              <span className="text-gray-400">Created by </span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {dashboard.createdBy?.username}
              </span>
            </li>
            {dashboard.updatedBy && (
              <li className="text-sm">
                <span className="text-gray-400">Last updated by </span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {dashboard.updatedBy.username}
                </span>
              </li>
            )}
            {dashboard.createdAt && (
              <li className="text-sm">
                <span className="text-gray-400">Created </span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {new Date(dashboard.createdAt).toLocaleDateString()}
                </span>
              </li>
            )}
          </ul>
        </div>

        {/* Preview */}
        <div className="overflow-hidden" style={{ height: "520px" }}>
          <DashboardViewer
            url={dashboard.url_path}
            category={dashboard.category}
          />
        </div>
      </div>
    </div>
  );
}

/* =======================
   MAIN PAGE
======================= */
export default function DashboardManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(null);
  const [viewingDashboard, setViewingDashboard] = useState<Dashboard | null>(null);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
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
      setFormData({ dashboard_name: "", url_path: "", category: "" });
    }
  }, [editingDashboard]);

  const fetchDashboards = async () => {
    try {
      const res = await API.get("/dashboard");
      setDashboards(res.data.data ?? []);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    fetchDashboards();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        await API.put(`/dashboard/${editingDashboard.dashboard_id}`, {
          dashboard_name: formData.dashboard_name,
          url_path: formData.url_path,
          category: formData.category,
        });
        toast.success("Dashboard updated successfully!");
      } else {
        await API.post("/dashboard", {
          dashboard_name: formData.dashboard_name,
          url_path: formData.url_path,
          category: formData.category,
        });
        toast.success("Dashboard created! Awaiting Admin approval.");
      }
      await fetchDashboards();
      handleCloseModal();
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to save dashboard.");
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
      await fetchDashboards();
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Failed to update dashboard status");
    }
  };

  // Stats
  const active = dashboards.filter((d) => d.status === "ACTIVE").length;
  const draft = dashboards.filter((d) => d.status === "DRAFT").length;
  const inactive = dashboards.filter((d) => d.status === "INACTIVE").length;

  return (
    <div>
      {viewingDashboard && (
        <DashboardViewModal
          dashboard={viewingDashboard}
          onClose={() => setViewingDashboard(null)}
        />
      )}

      <PageMeta
        title="Dashboard Management"
        description="Manage system dashboards"
      />
      <PageBreadcrumb pageTitle="Dashboard Management" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Active", value: active, color: "text-emerald-600" },
          { label: "Draft", value: draft, color: "text-amber-600" },
          { label: "Inactive", value: inactive, color: "text-red-500" },
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

      <ComponentCard
        title="Dashboards"
        desc="Manage all dashboards in the system"
        headerAction={
          <Button
            size="md"
            variant="primary"
            startIcon={<Plus className="size-4 text-white" />}
            onClick={handleAddClick}
          >
            New Dashboard
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs text-gray-500">
                  Name
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs text-gray-500">
                  Category
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs text-gray-500">
                  Status
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs text-gray-500">
                  URL
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs text-gray-500">
                  Created By
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-right text-theme-xs text-gray-500">
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {dashboards.length === 0 ? (
                <TableRow>
                  <TableCell className="px-5 py-10 text-center text-sm text-gray-400">
                    No dashboards found.
                  </TableCell>
                </TableRow>
              ) : (
                dashboards.map((dashboard) => (
                  <TableRow
                    key={dashboard.dashboard_id}
                    className={
                      dashboard.status === "DRAFT"
                        ? "bg-amber-50/30 dark:bg-amber-500/5"
                        : dashboard.status === "INACTIVE"
                          ? "opacity-60"
                          : ""
                    }
                  >
                    {/* Name */}
                    <TableCell className="px-5 py-4">
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {dashboard.dashboard_name}
                      </span>
                    </TableCell>

                    {/* Category */}
                    <TableCell className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_STYLE[dashboard.category] ?? "bg-gray-100 text-gray-500"}`}
                      >
                        {dashboard.category}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[dashboard.status]}`}
                      >
                        {dashboard.status}
                      </span>
                    </TableCell>

                    {/* URL */}
                    <TableCell className="px-5 py-4">
                      <span
                        title={dashboard.url_path}
                        className="inline-block max-w-[200px] truncate rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      >
                        {dashboard.url_path}
                      </span>
                    </TableCell>

                    {/* Created By */}
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {dashboard.createdBy?.username}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* ACTIVE: view only + soft delete */}
                        {dashboard.status === "ACTIVE" && (
                          <>
                            <button
                              onClick={() => setViewingDashboard(dashboard)}
                              title="View dashboard"
                              className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition dark:hover:bg-gray-800 dark:hover:text-gray-200"
                            >
                              <Eye className="size-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleToggleStatus(
                                  dashboard.dashboard_id,
                                  dashboard.status,
                                )
                              }
                              title="Deactivate"
                              className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </>
                        )}

                        {/* DRAFT: edit + awaiting badge */}
                        {dashboard.status === "DRAFT" && (
                          <>
                            <button
                              onClick={() => handleEditClick(dashboard)}
                              title="Edit draft"
                              className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition dark:hover:bg-amber-900/20"
                            >
                              <Pencil className="size-4" />
                            </button>
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
                              Awaiting Review
                            </span>
                          </>
                        )}

                        {/* INACTIVE: restore only */}
                        {dashboard.status === "INACTIVE" && (
                          <button
                            onClick={() =>
                              handleToggleStatus(
                                dashboard.dashboard_id,
                                dashboard.status,
                              )
                            }
                            title="Restore"
                            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition dark:hover:bg-emerald-900/20"
                          >
                            <RotateCcw className="size-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </ComponentCard>

      {/* Create / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} className="max-w-lg p-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {editingDashboard ? "Edit Dashboard" : "New Dashboard"}
            </h3>
            <p className="mt-0.5 text-sm text-gray-500">
              {editingDashboard
                ? "Update this draft dashboard before submitting for review."
                : "Created dashboards start as DRAFT and require Admin approval."}
            </p>
          </div>
        </div>

        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Dashboard Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="dashboard_name"
              value={formData.dashboard_name}
              onChange={handleChange}
              placeholder="e.g. Sales Overview"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              URL Path <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="url_path"
              value={formData.url_path}
              onChange={handleChange}
              placeholder="https://..."
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select Category</option>
              <option value="OVERVIEW">Overview</option>
              <option value="ANALYTICS">Analytics</option>
              <option value="SALES">Sales</option>
              <option value="MARKETING">Marketing</option>
              <option value="SUPPORT">Support</option>
            </select>
          </div>

          {/* Info banner for new dashboard */}
          {!editingDashboard && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/10">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                New dashboards will be saved as <strong>DRAFT</strong> and
                require Admin review before going live.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleCloseModal} >
              Cancel
            </Button>
            <Button variant="primary">
              {editingDashboard ? "Save Changes" : "Create Dashboard"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}