import { useEffect, useState } from "react";
import API from "../../api";
import {
  Plus,
  Eye,
  Users,
  ChevronUp,
  ChevronDown,
  Pencil,
  Layers,
  Trash2,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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


/* =======================
   CONFIRM MODAL
======================= */
function ConfirmModal({
  group,
  onConfirm,
  onCancel,
}: {
  group: Group;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isActive = group.status === "ACTIVE";
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              isActive
                ? "bg-red-100 dark:bg-red-900/30"
                : "bg-emerald-100 dark:bg-emerald-900/30"
            }`}
          >
            {isActive ? (
              <AlertTriangle className="size-6 text-red-500" />
            ) : (
              <RotateCcw className="size-6 text-emerald-600" />
            )}
          </div>

          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white">
              {isActive ? "Deactivate Group" : "Restore Group"}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {isActive ? (
                <>
                  Are you sure you want to deactivate{" "}
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {group.group_name}
                  </span>
                  ? Members will lose access to its dashboards.
                </>
              ) : (
                <>
                  Restore{" "}
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {group.group_name}
                  </span>
                  ? This will re-activate the group.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition ${
              isActive
                ? "bg-red-500 hover:bg-red-600"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {isActive ? "Yes, Deactivate" : "Yes, Restore"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =======================
   MAIN PAGE
======================= */
export default function GroupManagement() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [confirmGroup, setConfirmGroup] = useState<Group | null>(null);
  const [sortKey, setSortKey] = useState<keyof Group>("group_name");
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const pageSize = 8;
  const [groups, setGroups] = useState<Group[]>([]);
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
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        groupType: "TRADITIONAL",
      });
    }
  }, [editingGroup]);

  const fetchGroups = async () => {
    try {
      const res = await API.get("/groups");
      setGroups(res.data.data ?? []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleSubmit = async () => {
    try {
      if (editingGroup) {
        await API.put(`/groups/${editingGroup.group_id}`, {
          group_name: formData.group_name,
          description: formData.description,
          groupType: formData.groupType,
        });
        toast.success("Group updated!");
      } else {
        await API.post("/groups", {
          group_name: formData.group_name,
          description: formData.description,
          group_type: formData.groupType,
        });
        toast.success("Group created!");
      }
      await fetchGroups();
      setFormData({
        group_name: "",
        description: "",
        groupType: "TRADITIONAL",
      });
      handleCloseModal();
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Failed to save group.");
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

  const handleToggleStatus = async () => {
    if (!confirmGroup) return;
    try {
      if (confirmGroup.status === "ACTIVE") {
        await API.put(`/groups/soft-delete/${confirmGroup.group_id}`);
        toast.success("Group deactivated successfully.");
      } else {
        await API.put(`/groups/restore/${confirmGroup.group_id}`);
        toast.success("Group restored successfully.");
      }
      await fetchGroups();
    } catch (err) {
      console.error("Status toggle error:", err);
      toast.error("Failed to update group status.");
    } finally {
      setConfirmGroup(null);
    }
  };

  // Filter + sort
  const processed = groups
    .filter(
      (g) =>
        g.group_name.toLowerCase().includes(search.toLowerCase()) ||
        g.description?.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      const valA = a[sortKey] ?? "";
      const valB = b[sortKey] ?? "";
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  const pagedData = processed.slice(
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

  // Stats
  const total = groups.length;
  const traditional = groups.filter(
    (g) => g.groupType === "TRADITIONAL",
  ).length;
  const adhoc = groups.filter((g) => g.groupType === "ADHOC").length;
  const totalMembers = groups.reduce((sum, g) => sum + (g.member ?? 0), 0);

  const SortIcon = ({ col }: { col: keyof Group }) => (
    <div className="flex flex-col ml-1">
      <ChevronUp
        size={10}
        className={
          sortKey === col && sortAsc ? "text-brand-500" : "text-gray-300"
        }
      />
      <ChevronDown
        size={10}
        className={
          sortKey === col && !sortAsc ? "text-brand-500" : "text-gray-300"
        }
      />
    </div>
  );

  return (
    <div>
      {/* Confirm deactivate / restore modal */}
      {confirmGroup && (
        <ConfirmModal
          group={confirmGroup}
          onConfirm={handleToggleStatus}
          onCancel={() => setConfirmGroup(null)}
        />
      )}

      <PageMeta title="Group Management" description="Manage user groups" />
      <PageBreadcrumb pageTitle="Group Management" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        {[
          {
            label: "Total Groups",
            value: total,
            color: "text-gray-800 dark:text-white",
          },
          { label: "Traditional", value: traditional, color: "text-blue-600" },
          { label: "Adhoc", value: adhoc, color: "text-purple-600" },
          {
            label: "Total Members",
            value: totalMembers,
            color: "text-emerald-600",
          },
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
        title="All Groups"
        desc="Manage and organize your team groups"
        headerAction={
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden sm:block">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 fill-gray-400"
                width="16"
                height="16"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search groups..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 w-[200px] rounded-lg border border-gray-300 bg-white pl-9 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
            <Button
              size="md"
              variant="primary"
              startIcon={<Plus className="size-4 text-white" />}
              onClick={handleAddClick}
            >
              Create Group
            </Button>
          </div>
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
                  <div
                    className="flex items-center cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => toggleSort("group_name")}
                  >
                    Group Name <SortIcon col="group_name" />
                  </div>
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs text-gray-500"
                >
                  Type
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
                  <div
                    className="flex items-center cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => toggleSort("member")}
                  >
                    Members <SortIcon col="member" />
                  </div>
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs text-gray-500"
                >
                  Created
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-right text-theme-xs text-gray-500"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {pagedData.length > 0 ? (
                pagedData.map((group) => (
                  <TableRow
                    key={group.group_id}
                    className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition"
                  >
                    {/* Name */}
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10">
                          <Layers className="size-4 text-brand-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white/90">
                            {group.group_name}
                          </p>
                          <p className="text-xs text-gray-400 line-clamp-1 max-w-[220px]">
                            {group.description || "—"}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Type */}
                    <TableCell className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          group.groupType === "TRADITIONAL"
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                            : group.groupType === "ADHOC"
                              ? "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
                              : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {group.groupType === "TRADITIONAL"
                          ? "Traditional"
                          : group.groupType === "ADHOC"
                            ? "Adhoc"
                            : "—"}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          group.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {group.status}
                      </span>
                    </TableCell>

                    {/* Members */}
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <Users className="size-3.5 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {group.member ?? 0}
                        </span>
                      </div>
                    </TableCell>

                    {/* Created */}
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(group.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/groups/${group.group_id}`)}
                          title="View detail"
                          className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition dark:hover:bg-gray-800 dark:hover:text-gray-200"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          onClick={() => handleEditClick(group)}
                          title="Edit group"
                          className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition dark:hover:bg-amber-900/20"
                        >
                          <Pencil className="size-4" />
                        </button>
                        {group.status === "ACTIVE" ? (
                          <button
                            onClick={() => setConfirmGroup(group)}
                            title="Deactivate"
                            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmGroup(group)}
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
              ) : (
                <TableRow>
                  <TableCell className="px-5 py-12 text-center text-sm text-gray-400">
                    {search
                      ? `No groups matching "${search}".`
                      : "No groups found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {processed.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{" "}
            –{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {Math.min(currentPage * pageSize, processed.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {processed.length}
            </span>
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 transition"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${
                  currentPage === p
                    ? "bg-brand-500 text-white"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 transition"
            >
              Next
            </button>
          </div>
        </div>
      </ComponentCard>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        className="max-w-lg p-6"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {editingGroup ? "Edit Group" : "Create New Group"}
            </h3>
            <p className="mt-0.5 text-sm text-gray-500">
              {editingGroup
                ? "Update group information below."
                : "Fill in the details to create a new group."}
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
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="group_name"
              value={formData.group_name}
              onChange={handleChange}
              placeholder="e.g. Marketing Team"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["TRADITIONAL", "ADHOC"] as const).map((type) => (
                <label
                  key={type}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                    formData.groupType === type
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="groupType"
                    value={type}
                    checked={formData.groupType === type}
                    onChange={handleChange}
                    className="hidden"
                  />
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                      formData.groupType === type
                        ? "border-brand-500"
                        : "border-gray-300"
                    }`}
                  >
                    {formData.groupType === type && (
                      <div className="h-2 w-2 rounded-full bg-brand-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {type === "TRADITIONAL" ? "Traditional" : "Adhoc"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {type === "TRADITIONAL"
                        ? "Permanent team group"
                        : "Temporary project group"}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Describe the purpose of this group..."
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary">
              {editingGroup ? "Save Changes" : "Create Group"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
