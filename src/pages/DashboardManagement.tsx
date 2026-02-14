import React, { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import ComponentCard from "../components/common/ComponentCard";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import { Modal } from "../components/ui/modal"; // Giả sử bạn lưu Modal ở đường dẫn này
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";

export interface Dashboard {
  dashboard_id: string;
  dashboard_name: string;
  url_path: string;
  category: string;
  created_by: string;
  created_at: string;
}

const dashboards: Dashboard[] = [
  {
    dashboard_id: "dsh-001",
    dashboard_name: "Sales Overview",
    url_path: "/dashboard/sales",
    category: "Business",
    created_by: "admin-uuid",
    created_at: "10 Jan, 2026",
  },
  {
    dashboard_id: "dsh-002",
    dashboard_name: "Customer Analytics",
    url_path: "/dashboard/customer",
    category: "Analytics",
    created_by: "admin-uuid",
    created_at: "18 Jan, 2026",
  },
];

export default function DashboardManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(null);

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
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs text-gray-500">
                  Name
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs text-gray-500">
                  URL Path
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs text-gray-500">
                  Category
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs text-gray-500">
                  Created At
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-right text-theme-xs text-gray-500">
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
                  <TableCell className="px-5 py-4 text-gray-600 dark:text-gray-400">
                    {dashboard.url_path}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-600 dark:text-gray-400">
                    {dashboard.category}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-500">
                    {dashboard.created_at}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(dashboard)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </div>
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
        <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Dashboard Name
            </label>
            <input
              type="text"
              defaultValue={editingDashboard?.dashboard_name || ""}
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
              defaultValue={editingDashboard?.url_path || ""}
              placeholder="/dashboard/example"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category
            </label>
            <select
              defaultValue={editingDashboard?.category || ""}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select Category</option>
              <option value="Business">Business</option>
              <option value="Analytics">Analytics</option>
              <option value="Operation">Operation</option>
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