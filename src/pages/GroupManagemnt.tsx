import React, { useState } from "react";
import { Plus, Eye, Users, ChevronUp, ChevronDown } from "lucide-react";
// UI Components
import ComponentCard from "../components/common/ComponentCard";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import { Modal } from "../components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";

// Cập nhật Type Definition thêm field description
export interface Group {
  id: number;
  name: string;
  type: string;
  department: string;
  members: number;
  description?: string; 
}

const DEPARTMENTS = ["Marketing", "Sales", "Data", "IT", "Finance", "HR", "Operation"];

const mockGroups: Group[] = [
  { id: 1, name: "Marketing", type: "Traditional", department: "Marketing", members: 12, description: "Main marketing group for core products." },
  { id: 2, name: "Sales Team A", type: "Adhoc", department: "Sales", members: 8, description: "Temporary sales task force." },
  { id: 3, name: "BI Team", type: "Traditional", department: "Data", members: 6, description: "Business Intelligence and data analysis." },
  { id: 4, name: "Project Phoenix", type: "Adhoc", department: "IT", members: 10, description: "Infrastructure migration project group." },
];

export default function GroupManagement() {
  // States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [sortKey, setSortKey] = useState<keyof Group>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Logic: Filter & Sort
  const filteredData = mockGroups
    .filter((g) => g.name.toLowerCase())
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
    currentPage * pageSize
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
      <PageMeta title="Group Management | Admin" description="Manage user groups" />
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
                  { key: "department", label: "Department" },
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
                        <ChevronUp size={10} className={sortKey === col.key && sortAsc ? "text-brand-500" : "text-gray-300"} />
                        <ChevronDown size={10} className={sortKey === col.key && !sortAsc ? "text-brand-500" : "text-gray-300"} />
                      </div>
                    </div>
                  </TableCell>
                ))}
                <TableCell isHeader className="px-5 py-3 text-right text-theme-xs text-gray-500">
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {pagedData.length > 0 ? (
                pagedData.map((group) => (
                  <TableRow key={group.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                    <TableCell className="px-5 py-4 font-medium text-gray-800 dark:text-white/90">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800">
                          <Users size={16} className="text-gray-500" />
                        </div>
                        <div>
                           <p className="font-medium">{group.name}</p>
                           {/* Hiển thị description nhỏ dưới tên group nếu muốn */}
                           <p className="text-[11px] text-gray-400 font-normal line-clamp-1">{group.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-600 dark:text-gray-400">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        group.type === "Traditional" 
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-500" 
                          : "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-500"
                      }`}>
                        {group.type}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      {group.department}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-600 dark:text-gray-400 text-sm">
                      {group.members} members
                    </TableCell>
                    <TableCell className="px-5 py-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(group)}
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
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} className="max-w-lg p-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {editingGroup ? "Edit Group" : "Create New Group"}
          </h3>
        </div>

        <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
          {/* Group Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Group Name
            </label>
            <input
              type="text"
              defaultValue={editingGroup?.name || ""}
              placeholder="e.g. Marketing Team"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Type Selection */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Type
              </label>
              <select
                defaultValue={editingGroup?.type || "Traditional"}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="Traditional">Traditional</option>
                <option value="Adhoc">Adhoc</option>
              </select>
            </div>
            
            {/* Department Selection - Thay đổi từ input sang select */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Department
              </label>
              <select
                defaultValue={editingGroup?.department || ""}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="" disabled>Select Department</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description - Field mới thêm vào */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              defaultValue={editingGroup?.description || ""}
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