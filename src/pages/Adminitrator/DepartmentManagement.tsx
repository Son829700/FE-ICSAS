import { useEffect, useState } from "react";
import API from "../../api";
import { Plus, Pencil } from "lucide-react";
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
  const [editingdepartment, setEditingdepartment] = useState<Department | null>(
    null,
  );
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setdepartment] = useState<Department[]>([]);

  const [formData, setFormData] = useState({
    department_name: "",
    managerId: "",
  });
  const handleAddClick = () => {
    setEditingdepartment(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (department: Department) => {
    setEditingdepartment(department);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingdepartment(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await API.get("/departments");
        setdepartment(response.data.data);
        console.log("API response:", response.data);
      } catch (error) {
        console.error("Fetch error in departmentManagement:", error);
      }
    };

    fetchData();
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await API.get("/users");
        setUsers(response.data.data);
        console.log("API response:", response.data);
      } catch (error) {
        console.error("Fetch error in UserManagement:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (editingdepartment) {
      setFormData({
        department_name: editingdepartment.department_name,
        managerId: editingdepartment.manager?.user_id || "",
      });
    } else {
      setFormData({
        department_name: "",
        managerId: "",
      });
    }
  }, [editingdepartment]);

  const handleSubmit = async () => {
    try {
      if (editingdepartment) {
        // UPDATE
        await API.put(`/departments/${editingdepartment.department_id}`, {
          department_name: formData.department_name,
          managerId: formData.managerId,
        });
      } else {
        // CREATE
        await API.post("/departments", {
          department_name: formData.department_name,
          managerId: formData.managerId,
        });
      }

      // reload list
      const response = await API.get("/departments");
      setFormData({
        department_name: "",
        managerId: "",
      });
      setdepartment(response.data.data);

      handleCloseModal();
    } catch (error) {
      console.error("Submit error:", error);
    }
  };
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
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs text-gray-500"
                >
                  Department Name
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs text-gray-500"
                >
                  Manager
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs text-gray-500"
                >
                  Email
                </TableCell>

                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs text-gray-500"
                >
                  Status
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
              {departments.map((department) => (
                <TableRow key={department.department_id}>
                  <TableCell className="px-5 py-4 font-medium text-gray-800 dark:text-white/90">
                    {department.department_name}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-600 dark:text-gray-400">
                    {department.manager.username}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-600 dark:text-gray-400">
                    {department.manager.email}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-gray-600 dark:text-gray-400">
                    {department.status}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(department)}
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
        className="max-w-lg p-6"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {editingdepartment ? "Edit department" : "Configure New department"}
          </h3>
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
              Department Name
            </label>
            <input
              type="text"
              name="department_name"
              value={formData.department_name}
              onChange={handleChange}
              placeholder="e.g. Marketing"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

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
              {users.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.username}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary">
              {editingdepartment ? "Update department" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
