import { useEffect, useRef, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
} from "@floating-ui/react";
import { MoreHorizontal, Search, Filter, X, AlertTriangle } from "lucide-react";
import API from "../../api";
import toast from "react-hot-toast";

/* =======================
   TYPES
======================= */
export interface Department {
  department_id: string;
  department_name: string;
  manager: User;
  status: string;
}

interface User {
  user_id: string;
  username: string;
  email: string;
  role: string;
  department: Department | null;
  createdAt: string;
  status: string;
}

interface FilterValue {
  keyword: string;
  role: string;
  department: string;
}

const PAGE_SIZE = 5;

/* =======================
   CONFIRM MODAL
======================= */
interface ConfirmModalProps {
  type: "inactive" | "active";
  username: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({
  type,
  username,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const isInactive = type === "inactive";

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        {/* Icon */}
        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
            isInactive
              ? "bg-error-50 dark:bg-error-500/10"
              : "bg-success-50 dark:bg-success-500/10"
          }`}
        >
          <AlertTriangle
            className={`size-7 ${isInactive ? "text-error-500" : "text-success-500"}`}
          />
        </div>

        {/* Content */}
        <h3 className="mb-2 text-center text-base font-semibold text-gray-800 dark:text-white/90">
          {isInactive ? "Deactivate User?" : "Restore User?"}
        </h3>
        <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
          {isInactive ? (
            <>
              Are you sure you want to deactivate{" "}
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {username}
              </span>
              ? They will lose access to the system.
            </>
          ) : (
            <>
              Are you sure you want to restore{" "}
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {username}
              </span>
              ? They will regain access to the system.
            </>
          )}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.03] transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium text-white transition ${
              isInactive
                ? "bg-error-500 hover:bg-error-600"
                : "bg-success-500 hover:bg-success-600"
            }`}
          >
            {isInactive ? "Deactivate" : "Restore"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =======================
   ACTION MENU
======================= */
interface ActionMenuProps {
  open: boolean;
  isActive: boolean;
  onToggle: () => void;
  onClose: () => void;
  onView: () => void;
  onToggleStatus: () => void;
}

function ActionMenu({
  open,
  isActive,
  onToggle,
  onClose,
  onView,
  onToggleStatus,
}: ActionMenuProps) {
  const { refs, floatingStyles } = useFloating({
    placement: "bottom-end",
    middleware: [offset(6), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  return (
    <div className="relative inline-block">
      <button
        ref={refs.setReference}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
      >
        <MoreHorizontal />
      </button>

      {open && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className="z-50 w-40 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-800 dark:bg-gray-900"
        >
          <button
            onClick={() => {
              onView();
              onClose();
            }}
            className="flex w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
          >
            View Detail
          </button>
          <button
            onClick={() => {
              onToggleStatus();
              onClose();
            }}
            className={`flex w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition ${
              isActive
                ? "text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10"
                : "text-success-600 hover:bg-success-50 dark:hover:bg-success-500/10"
            }`}
          >
            {isActive ? "Inactive" : "Active"}
          </button>
        </div>
      )}
    </div>
  );
}

/* =======================
   EDIT USER MODAL
======================= */
interface EditUserModalProps {
  user: User;
  departments: Department[];
  onClose: () => void;
  onSaved: () => void;
}

function EditUserModal({
  user,
  departments,
  onClose,
  onSaved,
}: EditUserModalProps) {
  const [role, setRole] = useState(user.role === "BI" ? "BI" : "STAFF");
  const [departmentId, setDepartmentId] = useState(
    user.department?.department_id ?? "",
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);

      // Chạy tuần tự thay vì Promise.all
      if (role !== user.role) {
        await API.put(`/users/role/${user.user_id}/${role}`);
      }
      if (departmentId && departmentId !== user.department?.department_id) {
        await API.put(`/users/${user.user_id}/department/${departmentId}`);
      }

      toast.success("User updated successfully!");
      onSaved();
      onClose();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update user.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Edit User
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mb-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Username
            </label>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              {user.username}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Email
            </label>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              {user.email}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="STAFF">Staff</option>
            <option value="BI">BI</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
            Department
          </label>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="">-- Select department --</option>
            {departments.map((d) => (
              <option key={d.department_id} value={d.department_id}>
                {d.department_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =======================
   MAIN PAGE
======================= */
export default function UserManagement() {
  const [page, setPage] = useState(1);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filter, setFilter] = useState<FilterValue>({
    keyword: "",
    role: "",
    department: "",
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [confirmUser, setConfirmUser] = useState<User | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUsers = async () => {
    try {
      const response = await API.get("/users");
      setUsers(response.data.data);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await API.get("/departments");
        setDepartments(res.data.data);
      } catch (error) {
        console.error("Fetch departments error:", error);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleToggleStatus = async (user: User) => {
    const isActive = user.status === "ACTIVE";
    try {
      if (isActive) {
        await API.put(`/users/soft-delete/${user.user_id}`);
        toast.success(`${user.username} has been deactivated.`);
      } else {
        await API.put(`/users/restore/${user.user_id}`);
        toast.success(`${user.username} has been restored.`);
      }
      fetchUsers();
    } catch (error) {
      console.error("Toggle status error:", error);
      toast.error("Failed to update user status.");
    } finally {
      setConfirmUser(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const keywordMatch =
      u.username.toLowerCase().includes(filter.keyword.toLowerCase()) ||
      u.email.toLowerCase().includes(filter.keyword.toLowerCase());
    const roleMatch = !filter.role || u.role === filter.role;
    const deptMatch =
      !filter.department || u.department?.department_id === filter.department;
    return keywordMatch && roleMatch && deptMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const handleFilterChange = (updated: Partial<FilterValue>) => {
    setFilter((prev) => ({ ...prev, ...updated }));
    setPage(1);
  };

  return (
    <>
      <PageMeta title="User Management" description="User management page" />

      {/* CONFIRM MODAL */}
      {confirmUser && (
        <ConfirmModal
          type={confirmUser.status === "ACTIVE" ? "inactive" : "active"}
          username={confirmUser.username}
          onConfirm={() => handleToggleStatus(confirmUser)}
          onCancel={() => setConfirmUser(null)}
        />
      )}

      {/* EDIT MODAL */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          departments={departments}
          onClose={() => setEditingUser(null)}
          onSaved={fetchUsers}
        />
      )}

      <div
        className="rounded-2xl border border-gray-200 bg-white pt-4 dark:border-white/[0.05] dark:bg-white/[0.03]"
        onClick={() => setActiveMenuId(null)}
      >
        {/* HEADER */}
        <div className="mb-4 flex flex-col gap-3 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Users
          </h3>
          <div className="flex gap-3">
            <div className="relative">
              <span className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                <Search size={20} />
              </span>
              <input
                type="text"
                placeholder="Search name or email..."
                value={filter.keyword}
                onChange={(e) =>
                  handleFilterChange({ keyword: e.target.value })
                }
                className="h-11 w-[260px] rounded-lg border border-gray-300 bg-transparent pl-11 pr-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
              >
                <Filter size={20} />
                Filter
                {(filter.role || filter.department) && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs text-white">
                    {[filter.role, filter.department].filter(Boolean).length}
                  </span>
                )}
              </button>

              {filterOpen && (
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  <div className="mb-4">
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Role
                    </label>
                    <select
                      value={filter.role}
                      onChange={(e) =>
                        handleFilterChange({ role: e.target.value })
                      }
                      className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    >
                      <option value="">All</option>
                      <option value="ADMINISTRATOR">Administrator</option>
                      <option value="BI">BI</option>
                      <option value="STAFF">Staff</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Department
                    </label>
                    <select
                      value={filter.department}
                      onChange={(e) =>
                        handleFilterChange({ department: e.target.value })
                      }
                      className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    >
                      <option value="">All</option>
                      {departments.map((dept) => (
                        <option
                          key={dept.department_id}
                          value={dept.department_id}
                        >
                          {dept.department_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleFilterChange({ role: "", department: "" });
                        setFilterOpen(false);
                      }}
                      className="h-10 flex-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 transition"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setFilterOpen(false)}
                      className="h-10 flex-1 rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 transition"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden">
          <div className="max-w-full overflow-x-auto px-5 sm:px-6">
            <table className="min-w-full">
              <thead className="border-y border-gray-100 dark:border-white/[0.05]">
                <tr>
                  {[
                    "User Name",
                    "Email",
                    "Role",
                    "Department",
                    "Created At",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="py-3 px-4 text-start text-theme-sm font-normal text-gray-500 dark:text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-gray-400"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => (
                    <tr key={u.user_id}>
                      <td className="px-4 py-4 font-medium text-theme-sm text-gray-700 dark:text-gray-400">
                        {u.username}
                      </td>
                      <td className="px-4 py-4 text-theme-sm text-gray-700 dark:text-gray-400">
                        {u.email}
                      </td>
                      <td className="px-4 py-4 text-theme-sm text-gray-700 dark:text-gray-400">
                        {u.role}
                      </td>
                      <td className="px-4 py-4 text-theme-sm text-gray-700 dark:text-gray-400">
                        {u.department?.department_name ?? "—"}
                      </td>
                      <td className="px-4 py-4 text-theme-sm text-gray-700 dark:text-gray-400">
                        {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-theme-xs font-medium ${
                            u.status === "ACTIVE"
                              ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
                              : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <ActionMenu
                          open={activeMenuId === u.user_id}
                          isActive={u.status === "ACTIVE"}
                          onToggle={() =>
                            setActiveMenuId(
                              activeMenuId === u.user_id ? null : u.user_id,
                            )
                          }
                          onClose={() => setActiveMenuId(null)}
                          onView={() => setEditingUser(u)}
                          onToggleStatus={() => setConfirmUser(u)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINATION */}
        <div className="border-t border-gray-200 px-6 py-4 dark:border-white/[0.05]">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg bg-white px-4 py-3 text-sm ring-1 ring-gray-300 disabled:opacity-40 dark:bg-gray-800 dark:ring-gray-700"
            >
              Previous
            </button>
            <span className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg bg-white px-4 py-3 text-sm ring-1 ring-gray-300 disabled:opacity-40 dark:bg-gray-800 dark:ring-gray-700"
            >
              Next
            </button>
          </div>

          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {filteredUsers.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
              </span>{" "}
              –{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {Math.min(page * PAGE_SIZE, filteredUsers.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {filteredUsers.length}
              </span>{" "}
              users
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg bg-white px-4 py-2.5 text-sm ring-1 ring-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:bg-gray-800 dark:ring-gray-700"
              >
                Previous
              </button>
              <ul className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <li key={p}>
                      <button
                        onClick={() => setPage(p)}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition ${
                          page === p
                            ? "bg-brand-500 text-white"
                            : "text-gray-700 hover:bg-brand-500/10 dark:text-gray-400"
                        }`}
                      >
                        {p}
                      </button>
                    </li>
                  ),
                )}
              </ul>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg bg-white px-4 py-2.5 text-sm ring-1 ring-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:bg-gray-800 dark:ring-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
