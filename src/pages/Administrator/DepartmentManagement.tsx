import { useEffect, useRef, useState } from "react";
import API from "../../api";
import { Plus, Pencil, MoreHorizontal, Building2, Users, CheckCircle } from "lucide-react";
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

/* =======================
   TYPES
======================= */
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

const PAGE_SIZE = 8;

/* =======================
   ACTION DROPDOWN
======================= */
function ActionDropdown({
  department,
  onEdit,
}: {
  department: Department;
  onEdit: (d: Department) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative flex justify-end" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition dark:hover:bg-gray-800 dark:hover:text-gray-200"
      >
        <MoreHorizontal className="size-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-8 w-40 rounded-xl border border-gray-100 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <button
            onClick={() => { onEdit(department); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.04] transition"
          >
            <Pencil className="size-4 text-gray-400" />
            Edit
          </button>
        </div>
      )}
    </div>
  );
}

/* =======================
   MAIN PAGE
======================= */
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

  // Filter / search / pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [page, setPage] = useState(1);

  /* =====================
     FETCH
  ===================== */
  const fetchDepartments = async () => {
    try {
      const res = await API.get("/departments");
      setDepartments(res.data.data ?? []);
    } catch (err) {
      console.error("Fetch departments error:", err);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get("/users");
        setUsers(res.data.data ?? []);
      } catch (err) {
        console.error("Fetch users error:", err);
      }
    })();
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
      managerId: department.manager?.user_id ?? "",
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
      if (editingDepartment) {
        await API.put(`/departments/${editingDepartment.department_id}`, {
          department_name: formData.department_name,
          managerId: formData.managerId,
        });

        if (editingDepartment.status !== formData.status) {
          if (formData.status === "INACTIVE") {
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
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("Failed to save department.");
    }
  };

  /* =====================
     FILTER + PAGINATE
  ===================== */
  const processed = departments.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      d.department_name.toLowerCase().includes(q) ||
      d.manager?.username?.toLowerCase().includes(q) ||
      d.manager?.email?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "ALL" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const paginated = processed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats
  const total = departments.length;
  const active = departments.filter((d) => d.status === "ACTIVE").length;
  const inactive = departments.filter((d) => d.status === "INACTIVE").length;
  const withManager = departments.filter((d) => !!d.manager).length;

  /* =====================
     RENDER
  ===================== */
  return (
    <div>
      <PageMeta title="Department Management | Admin" description="Manage system departments" />
      <PageBreadcrumb pageTitle="Department Management" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        {[
          { label: "Total", value: total, color: "text-gray-800 dark:text-white", icon: <Building2 className="size-4" /> },
          { label: "Active", value: active, color: "text-emerald-600", icon: <CheckCircle className="size-4" /> },
          { label: "Inactive", value: inactive, color: "text-red-500", icon: <Building2 className="size-4" /> },
          { label: "Has Manager", value: withManager, color: "text-brand-600", icon: <Users className="size-4" /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              <span className="text-gray-300 dark:text-gray-600">{icon}</span>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <ComponentCard
        title="Departments"
        desc="Manage all departments in the system"
        headerAction={
          <Button
            size="md"
            variant="primary"
            startIcon={<Plus className="size-4 text-white" />}
            onClick={handleAddClick}
          >
            Create Department
          </Button>
        }
      >
        {/* Search + Filter */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 fill-gray-400"
              width="15"
              height="15"
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
              placeholder="Search department, manager..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-4 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 sm:w-[240px]"
            />
          </div>

          {/* Status tabs */}
          <div className="flex h-10 items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
            {(["ALL", "ACTIVE", "INACTIVE"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`h-9 rounded-md px-3 text-xs font-medium transition ${
                  statusFilter === s
                    ? "bg-white shadow-sm text-gray-900 dark:bg-gray-800 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                }`}
              >
                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
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
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell className="px-5 py-12 text-center text-sm text-gray-400">
                    {search || statusFilter !== "ALL"
                      ? "No departments match your filters."
                      : "No departments found."}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((department) => (
                  <TableRow
                    key={department.department_id}
                    className={`transition hover:bg-gray-50/50 dark:hover:bg-white/[0.01] ${
                      department.status === "INACTIVE" ? "opacity-60" : ""
                    }`}
                  >
                    {/* Name */}
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10">
                          <Building2 className="size-4 text-brand-500" />
                        </div>
                        <span className="font-medium text-gray-800 dark:text-white/90">
                          {department.department_name}
                        </span>
                      </div>
                    </TableCell>

                    {/* Manager */}
                    <TableCell className="px-5 py-4">
                      {department.manager ? (
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300">
                            {department.manager.username?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {department.manager.username}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">No manager</span>
                      )}
                    </TableCell>

                    {/* Email */}
                    <TableCell className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {department.manager?.email ?? "—"}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          department.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {department.status}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="px-5 py-4">
                      <ActionDropdown department={department} onEdit={handleEditClick} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {processed.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
            </span>{" "}
            –{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {Math.min(page * PAGE_SIZE, processed.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {processed.length}
            </span>
          </p>

          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 transition"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`e${i}`} className="px-1 text-gray-400 text-sm">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${
                      page === p
                        ? "bg-brand-500 text-white"
                        : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 transition"
            >
              Next
            </button>
          </div>
        </div>
      </ComponentCard>

      {/* MODAL */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} className="max-w-lg p-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {editingDepartment ? "Edit Department" : "Create New Department"}
            </h3>
            <p className="mt-0.5 text-sm text-gray-500">
              {editingDepartment
                ? "Update department information below."
                : "Fill in the details to create a new department."}
            </p>
          </div>
        </div>

        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
        >
          {/* Department Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="department_name"
              value={formData.department_name}
              onChange={handleChange}
              placeholder="e.g. Marketing"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
              <option value="">— No manager assigned —</option>
              {users.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.username} ({user.role})
                </option>
              ))}
            </select>
          </div>

          {/* Status — edit only */}
          {editingDepartment && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(["ACTIVE", "INACTIVE"] as const).map((s) => (
                  <label
                    key={s}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                      formData.status === s
                        ? s === "ACTIVE"
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10"
                          : "border-red-400 bg-red-50 dark:bg-red-900/10"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={s}
                      checked={formData.status === s}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <div
                      className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                        formData.status === s
                          ? s === "ACTIVE" ? "border-emerald-500" : "border-red-400"
                          : "border-gray-300"
                      }`}
                    >
                      {formData.status === s && (
                        <div className={`h-2 w-2 rounded-full ${s === "ACTIVE" ? "bg-emerald-500" : "bg-red-400"}`} />
                      )}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        formData.status === s
                          ? s === "ACTIVE" ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleCloseModal} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingDepartment ? "Save Changes" : "Create Department"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}