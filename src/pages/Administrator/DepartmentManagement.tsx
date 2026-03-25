import { useEffect, useState } from "react";
import API from "../../api";
import { Plus, Pencil } from "lucide-react";
import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import toast from "react-hot-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

export interface User {
  user_id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  department: string | null;
  status: string;
}

export interface Department {
  department_id: string;
  department_name: string;
  manager: User;
  status: string;
}

export default function DepartmentManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    department_name: "",
    managerId: "",
    status: "ACTIVE",
  });

  /* =====================
     FETCH
  ===================== */
  const fetchDepartments = async () => {
    try {
      const response = await API.get("/departments");
      setDepartments(response.data.data);
    } catch (error) {
      console.error("Fetch departments error:", error);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await API.get("/users");
        setUsers(response.data.data);
      } catch (error) {
        console.error("Fetch users error:", error);
      }
    };
    fetchUsers();
  }, []);

  /* =====================
     MODAL HANDLERS
  ===================== */
  const handleAddClick = () => {
    setEditingDepartment(null);
    setFormData({ department_name: "", managerId: "", status: "ACTIVE" });
    setIsModalOpen(true);
  };

  const handleEditClick = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      department_name: department.department_name,
      managerId: department.manager?.user_id || "",
      status: department.status,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDepartment(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* =====================
     SUBMIT
  ===================== */
  const handleSubmit = async () => {
    try {
      const prevStatus = editingDepartment?.status;
      const newStatus = formData.status;

      if (editingDepartment) {
        // Update name & manager
        await API.put(`/departments/${editingDepartment.department_id}`, {
          department_name: formData.department_name,
          managerId: formData.managerId,
        });

        // Handle status change separately
        if (prevStatus !== newStatus) {
          if (newStatus === "INACTIVE") {
            await API.put(`/departments/soft-delete/${editingDepartment.department_id}`);
          } else {
            await API.put(`/departments/restore/${editingDepartment.department_id}`);
          }
        }

        toast.success("Department updated successfully!");
      } else {
        await API.post("/departments", {
          department_name: formData.department_name,
          managerId: formData.managerId,
        });
        toast.success("Department created successfully!");
      }

      await fetchDepartments();
      handleCloseModal();
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to save department.");
    }
  };

  /* =====================
     RENDER
  ===================== */
  return (
    <div>
      <PageMeta
        title="Department Management | Admin"
        description="Manage system departments"
      />
      <PageBreadcrumb pageTitle="Department Management" />

      <ComponentCard
        title="Departments"
        desc="Manage all departments in the system"
        headerAction={
          <Button
            size="md"
            variant="primary"
            startIcon={<Plus className="size-5 text-white" />}
            onClick={handleAddClick}
          >
            Create Department
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs text-gray-500">
                  Department Name
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs text-gray-500">
                  Manager
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs text-gray-500">
                  Email
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs text-gray-500">
                  Status
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-right text-theme-xs text-gray-500">
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {departments.map((department) => (
                <TableRow key={department.department_id}>
                  <TableCell className="px-5 py-4 font-medium text-gray-800 dark:text-white/90">
                    {department.department_name}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-600 dark:text-gray-400">
                    {department.manager?.username ?? "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-600 dark:text-gray-400">
                    {department.manager?.email ?? "—"}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      department.status === "ACTIVE"
                        ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
                        : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400"
                    }`}>
                      {department.status}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditClick(department)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ComponentCard>

      {/* MODAL */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} className="max-w-lg p-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {editingDepartment ? "Edit Department" : "Create New Department"}
          </h3>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
        >
          {/* Department Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Department Name
            </label>
            <input
              type="text"
              name="department_name"
              value={formData.department_name}
              onChange={handleChange}
              placeholder="e.g. Marketing"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Manager */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Manager
            </label>
            <select
              name="managerId"
              value={formData.managerId}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select Manager</option>
              {users
                
                .map((user) => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.username}
                  </option>
                ))}
            </select>
          </div>

          {/* Status — chỉ hiện khi edit */}
          {editingDepartment && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>

              {/* Preview badge */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-400">Preview:</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  formData.status === "ACTIVE"
                    ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
                    : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400"
                }`}>
                  {formData.status}
                </span>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseModal} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingDepartment ? "Update Department" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}