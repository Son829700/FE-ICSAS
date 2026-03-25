import { useEffect, useState } from "react";
import API from "../../api";
import { Plus, Eye, Users, ChevronUp, ChevronDown, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
// UI Components
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

// Cập nhật Type Definition thêm field description
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

export default function GroupManagement() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [sortKey, setSortKey] = useState<keyof Group>("group_id");
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [groups, setGroup] = useState<Group[]>([]);
  const [formData, setFormData] = useState({
    group_name: "",
    description: "",
    groupType: "TRADITIONAL",
  });
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    if (editingGroup) {
      setFormData({
        group_name: editingGroup.group_name,
        description: editingGroup.description,
        groupType: editingGroup.groupType ?? "TRADITIONAL",
      });
    } else {
      setFormData({
        group_name: "",
        description: "",
        groupType: "TRADITIONAL", // ← default, không để ""
      });
    }
  }, [editingGroup]);
  const handleSubmit = async () => {
    try {
      if (editingGroup) {
        // PUT dùng groupType (camelCase)
        await API.put(`/groups/${editingGroup.group_id}`, {
          group_name: formData.group_name,
          description: formData.description,
          groupType: formData.groupType,
        });
      } else {
        // POST dùng group_type (snake_case)
        await API.post("/groups", {
          group_name: formData.group_name,
          description: formData.description,
          group_type: formData.groupType,
        });
      }

      const response = await API.get("/groups");
      setGroup(response.data.data);
      handleCloseModal();
    } catch (error) {
      console.error("Submit error:", error);
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await API.get("/groups");
        setGroup(response.data.data);
      } catch (error) {
        console.error("Fetch error in GroupManagement:", error);
      }
    };

    fetchData();
  }, []);
  // Logic: Filter & Sort
  const filteredData = groups
    .filter((g) => g.group_name.toLowerCase())
    .sort((a, b) => {
      const valA = a[sortKey] ?? "";
      const valB = b[sortKey] ?? "";
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  // Logic: Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const pagedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const toggleSort = (key: keyof Group) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const handleAddClick = () => {
    setEditingGroup(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (group: Group) => {
    setEditingGroup(group);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGroup(null);
  };

  return (
    <div>
      <PageMeta
        title="Group Management | Admin"
        description="Manage user groups"
      />
      <PageBreadcrumb pageTitle="Group Management" />

      <ComponentCard
        title="All Groups"
        desc="Manage and organize your team groups"
        headerAction={
          <Button
            size="md"
            variant="primary"
            startIcon={<Plus className="size-5 text-white" />}
            onClick={handleAddClick}
          >
            Create Group
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {[
                  { key: "name", label: "Group Name" },
                  { key: "type", label: "Type" },
                  { key: "status", label: "Status" },
                  { key: "members", label: "Members" },
                ].map((col) => (
                  <TableCell
                    key={col.key}
                    isHeader
                    className="px-5 py-3 text-start text-theme-xs text-gray-500"
                  >
                    <div
                      className="flex items-center gap-1 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                      onClick={() => toggleSort(col.key as keyof Group)}
                    >
                      {col.label}
                      <div className="flex flex-col">
                        <ChevronUp
                          size={10}
                          className={
                            sortKey === col.key && sortAsc
                              ? "text-brand-500"
                              : "text-gray-300"
                          }
                        />
                        <ChevronDown
                          size={10}
                          className={
                            sortKey === col.key && !sortAsc
                              ? "text-brand-500"
                              : "text-gray-300"
                          }
                        />
                      </div>
                    </div>
                  </TableCell>
                ))}
                <TableCell
                  isHeader
                  className="px-5 py-3 text-left text-theme-xs text-gray-500"
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {pagedData.length > 0 ? (
                pagedData.map((group) => (
                  <TableRow
                    key={group.group_id}
                    className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]"
                  >
                    <TableCell className="px-5 py-4 font-medium text-gray-800 dark:text-white/90">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800">
                          <Users size={16} className="text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium">{group.group_name}</p>
                          {/* Hiển thị description nhỏ dưới tên group nếu muốn */}
                          <p className="text-[11px] text-gray-400 font-normal line-clamp-1">
                            {group.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-600 dark:text-gray-400">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          group.groupType === "TRADITIONAL"
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-500"
                            : group.groupType === "ADHOC"
                              ? "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-500"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {group.groupType === "TRADITIONAL"
                          ? "Traditional"
                          : group.groupType === "ADHOC"
                            ? "Adhoc"
                            : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      {group.status}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      {group.member} members
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(group)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/groups/${group.group_id}`)}
                      >
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="px-5 py-10 text-center text-gray-400">
                    No groups found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-5 dark:border-gray-800">
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages || 1}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </ComponentCard>

      {/* --- MODAL --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        className="max-w-lg p-6"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {editingGroup ? "Edit Group" : "Create New Group"}
          </h3>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          {/* Group Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Group Name
            </label>
            <input
              type="text"
              name="group_name"
              value={formData.group_name}
              onChange={handleChange}
              placeholder="e.g. Marketing Team"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            {/* Type Selection */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Type
              </label>
              <select
                name="groupType"
                value={formData.groupType}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="TRADITIONAL">Traditional</option>
                <option value="ADHOC">Adhoc</option>
              </select>
            </div>

            {/* Department Selection - Thay đổi từ input sang select */}
            {/* <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Department
              </label>
              <select
                defaultValue={editingGroup?.status || ""}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="" disabled>
                  Select Department
                </option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div> */}
          </div>

          {/* Description - Field mới thêm vào */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Enter group description..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white resize-none"
            />
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary">
              {editingGroup ? "Update Group" : "Save Group"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
