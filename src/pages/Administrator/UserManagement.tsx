/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import {
  Search,
  Filter,
  X,
  AlertTriangle,
  Mail,
  CheckCircle,
  Users,
  Pencil,
  Trash2,
} from "lucide-react";
import API from "../../api";
import toast from "react-hot-toast";
import {
  buildActivationEmailBody,
  buildSignupNotificationEmailBody,
} from "../../utils/Emailtemplates";

/* =======================
   TYPES
======================= */
export interface Department {
  department_id: string;
  department_name: string;
  manager: User;
  status: string;
  department_type: "INTERNAL" | "EXTERNAL";
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
  status: string;
}

type TabType = "INTERNAL" | "CUSTOMER";
const PAGE_SIZE = 10;

/* =======================
   HELPERS
======================= */
async function sendEmail(to: string, subject: string, body: string) {
  try {
    await API.post("/email/send", {
      to: [to],
      subject,
      body,
    });
  } catch (err: any) {
    console.error("Send email error:", err?.response?.data || err.message);
    throw err;
  }
}

/* =======================
   CONFIRM MODAL
======================= */
function ConfirmModal({
  type,
  username,
  onConfirm,
  onCancel,
}: {
  type: "inactive" | "active";
  username: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isInactive = type === "inactive";
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${isInactive ? "bg-error-50 dark:bg-error-500/10" : "bg-success-50 dark:bg-success-500/10"}`}
        >
          <AlertTriangle
            className={`size-7 ${isInactive ? "text-error-500" : "text-success-500"}`}
          />
        </div>
        <h3 className="mb-2 text-center text-base font-semibold text-gray-800 dark:text-white/90">
          {isInactive ? "Deactivate User?" : "Activate User?"}
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
              Are you sure you want to activate{" "}
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {username}
              </span>
              ? They will gain access and receive a notification email.
            </>
          )}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium text-white transition ${isInactive ? "bg-error-500 hover:bg-error-600" : "bg-success-500 hover:bg-success-600"}`}
          >
            {isInactive ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =======================
   CREATE CUSTOMER MODAL
======================= */
function CreateCustomerModal({
  departments,
  onClose,
  onCreated,
}: {
  departments: Department[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    user_name: "",
    email: "",
    password: "",
    departmentId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.user_name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("All fields except department are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await API.post("/users/custom", {
        user_name: form.user_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      const newUser = res.data?.data;

      // 2. Assign department nếu có
      if (form.departmentId && newUser?.user_id) {
        await API.put(
          `/users/${newUser.user_id}/department/${form.departmentId}`,
        );
      }

      // 3. Gửi email thông báo
      await sendEmail(
        form.email.trim().toLowerCase(),
        "ICSAS — Registration Received, Pending Review",
        buildSignupNotificationEmailBody({
          username: form.user_name.trim(),
          email: form.email.trim().toLowerCase(),
        }),
      );

      toast.success("Customer account created! Email notification sent.");
      onCreated();
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ?? "Failed to create customer account.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Create Customer Account
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Account will be inactive until manually activated.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Username *
              </label>
              <input
                type="text"
                value={form.user_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, user_name: e.target.value }))
                }
                placeholder="e.g. business_owner_abc"
                required
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Email *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="customer@email.com"
                required
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Initial Password *
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
                placeholder="Min. 8 characters"
                required
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Assign to Business (Department)
              </label>
              <select
                value={form.departmentId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, departmentId: e.target.value }))
                }
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                <option value="">— Not assigned yet —</option>
                {departments.map((d) => (
                  <option key={d.department_id} value={d.department_id}>
                    {d.department_name}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-xs text-error-500">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin size-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    Creating...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}


/* =======================
   EDIT USER MODAL
======================= */
function EditUserModal({
  user,
  departments,
  onClose,
  onSaved,
}: {
  user: User;
  departments: Department[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [role, setRole] = useState(
    user.role === "BI" ? "BI" : user.role === "CUSTOMER" ? "CUSTOMER" : "STAFF",
  );
  const [departmentId, setDepartmentId] = useState(
    user.department?.department_id ?? "",
  );
  const [saving, setSaving] = useState(false);
  const isCustomer = user.role === "CUSTOMER";

  const handleSave = async () => {
    try {
      setSaving(true);
      if (role !== user.role && !isCustomer) {
        await API.put(`/users/role/${user.user_id}/${role}`);
      }
      if (departmentId && departmentId !== user.department?.department_id) {
        await API.put(`/users/${user.user_id}/department/${departmentId}`);
      }
      toast.success("User updated successfully!");
      onSaved();
      onClose();
    } catch {
      toast.error("Failed to update user.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
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
          {[
            ["Username", user.username],
            ["Email", user.email],
          ].map(([label, val]) => (
            <div key={label}>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                {label}
              </label>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                {val}
              </div>
            </div>
          ))}
        </div>
        {!isCustomer && (
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
        )}
        <div className="mb-6">
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
            {isCustomer ? "Business (Department)" : "Department"}
          </label>
          <select
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="">
              — {isCustomer ? "No business assigned" : "Select department"} —
            </option>
            {departments
              .filter((d) =>
                isCustomer
                  ? d.department_type === "EXTERNAL"
                  : d.department_type === "INTERNAL",
              )
              .map((d) => (
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
  const [tab, setTab] = useState<TabType>("INTERNAL");
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filter, setFilter] = useState<FilterValue>({
    keyword: "",
    role: "",
    department: "",
    status: "",
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [confirmUser, setConfirmUser] = useState<User | null>(null);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUsers = async () => {
    try {
      const res = await API.get("/users");
      setUsers(res.data.data ?? []);
    } catch {
      console.error("Fetch users error");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await API.get("/departments");
        setDepartments(r.data.data ?? []);
      } catch {
        console.error("Fetch dept error");
      }
    })();
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setFilterOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleToggleStatus = async (user: User) => {
    const isActive = user.status === "ACTIVE";

    try {
      if (isActive) {
        await API.put(`/users/soft-delete/${user.user_id}`);
        toast.success(`${user.username} has been deactivated.`);
      } else {
        await API.put(`/users/restore/${user.user_id}`);

        if (user.role === "CUSTOMER") {
          try {
            await sendEmail(
              user.email,
              "ICSAS — Your Account Has Been Activated!",
              buildActivationEmailBody({
                username: user.username,
                email: user.email,
                businessName: user.department?.department_name,
              }),
            );
            toast.success(`${user.username} activated + email sent.`);
          } catch {
            toast.error("Activated but failed to send email!");
          }
        } else {
          toast.success(`${user.username} has been activated.`);
        }
      }

      fetchUsers();
    } catch {
      toast.error("Failed to update user status.");
    } finally {
      setConfirmUser(null);
    }
  };

  // Split users by tab
  const internalUsers = users.filter((u) => u.role !== "CUSTOMER");
  const customerUsers = users.filter((u) => u.role === "CUSTOMER");
  const baseUsers = tab === "INTERNAL" ? internalUsers : customerUsers;

  const filteredUsers = baseUsers.filter((u) => {
    const q = filter.keyword.toLowerCase();
    const matchKeyword =
      !q ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchRole = !filter.role || u.role === filter.role;
    const matchDept =
      !filter.department || u.department?.department_id === filter.department;
    const matchStatus = !filter.status || u.status === filter.status;
    return matchKeyword && matchRole && matchDept && matchStatus;
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

  // Stats
  const activeCount = baseUsers.filter((u) => u.status === "ACTIVE").length;
  const inactiveCount = baseUsers.filter((u) => u.status === "INACTIVE").length;
  const pendingCustomers = customerUsers.filter(
    (u) => u.status === "INACTIVE",
  ).length;

  const ROLE_BADGE: Record<string, string> = {
    ADMINISTRATOR:
      "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
    BI: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
    STAFF: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    CUSTOMER: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400",
  };

  return (
    <>
      <PageMeta title="Administrator | User Management" description="User management page" />

      {confirmUser && (
        <ConfirmModal
          type={confirmUser.status === "ACTIVE" ? "inactive" : "active"}
          username={confirmUser.username}
          onConfirm={() => handleToggleStatus(confirmUser)}
          onCancel={() => setConfirmUser(null)}
        />
      )}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          departments={departments}
          onClose={() => setEditingUser(null)}
          onSaved={fetchUsers}
        />
      )}
      {showCreateCustomer && (
        <CreateCustomerModal
          departments={departments}
          onClose={() => setShowCreateCustomer(false)}
          onCreated={fetchUsers}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        {[
          {
            label: "Internal Users",
            value: internalUsers.length,
            color: "text-gray-800 dark:text-white",
          },
          {
            label: "Customers",
            value: customerUsers.length,
            color: "text-teal-600",
          },
          {
            label: "Active",
            value: users.filter((u) => u.status === "ACTIVE").length,
            color: "text-emerald-600",
          },
          {
            label: "Pending Activation",
            value: pendingCustomers,
            color: "text-amber-600",
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

      <div
        className="rounded-2xl border border-gray-200 bg-white pt-4 dark:border-white/[0.05] dark:bg-white/[0.03]"
      >
        {/* Tabs */}
        <div className="mb-4 flex flex-col gap-3 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-900 w-fit">
            {(
              [
                ["INTERNAL", "Internal Users"],
                ["CUSTOMER", "Customers"],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                onClick={() => {
                  setTab(val);
                  setPage(1);
                  setFilter({
                    keyword: "",
                    role: "",
                    department: "",
                    status: "",
                  });
                }}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${tab === val ? "bg-white shadow-sm text-gray-900 dark:bg-gray-800 dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}
              >
                {label}
                {val === "CUSTOMER" && pendingCustomers > 0 && (
                  <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] text-white font-bold">
                    {pendingCustomers}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search name or email..."
                value={filter.keyword}
                onChange={(e) =>
                  handleFilterChange({ keyword: e.target.value })
                }
                className="h-10 w-[220px] rounded-lg border border-gray-300 bg-transparent pl-9 pr-4 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Filter */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex h-10 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                <Filter size={16} />
                Filter
                {(filter.role || filter.department || filter.status) && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs text-white">
                    {
                      [filter.role, filter.department, filter.status].filter(
                        Boolean,
                      ).length
                    }
                  </span>
                )}
              </button>

              {filterOpen && (
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  {tab === "INTERNAL" && (
                    <div className="mb-3">
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
                  )}
                  <div className="mb-3">
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                      {tab === "CUSTOMER" ? "Business" : "Department"}
                    </label>
                    <select
                      value={filter.department}
                      onChange={(e) =>
                        handleFilterChange({ department: e.target.value })
                      }
                      className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    >
                      <option value="">All</option>
                      {departments.map((d) => (
                        <option key={d.department_id} value={d.department_id}>
                          {d.department_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </label>
                    <select
                      value={filter.status}
                      onChange={(e) =>
                        handleFilterChange({ status: e.target.value })
                      }
                      className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    >
                      <option value="">All</option>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleFilterChange({
                          role: "",
                          department: "",
                          status: "",
                        });
                        setFilterOpen(false);
                      }}
                      className="h-9 flex-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 transition"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setFilterOpen(false)}
                      className="h-9 flex-1 rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 transition"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="max-w-full overflow-x-auto px-5 sm:px-6">
          <table className="min-w-full">
            <thead className="border-y border-gray-100 dark:border-white/[0.05]">
              <tr>
                {[
                  "User",
                  "Email",
                  "Role",
                  tab === "CUSTOMER" ? "Business" : "Department",
                  "Created",
                  "Status",
                ].map((h) => (
                  <th
                    key={h}
                    className="py-3 px-4 text-start text-xs font-medium text-gray-500 dark:text-gray-400"
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
                  <tr
                    key={u.user_id}
                    className={`transition hover:bg-gray-50/50 ${u.status === "INACTIVE"
                      ? "bg-gray-50 dark:bg-white/[0.02]"
                      : ""
                      }`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300">
                          {u.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {u.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                      {u.email}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE[u.role] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                      {u.department?.department_name ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${u.status === "ACTIVE" ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500" : "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"}`}
                      >
                        {u.status === "INACTIVE" && u.role === "CUSTOMER"
                          ? "Pending"
                          : u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingUser(u)}
                          title="Edit user"
                          className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition dark:hover:bg-amber-900/20"
                        >
                          <Pencil className="size-4" />
                        </button>
                        {u.status === "ACTIVE" ? (
                          <button
                            onClick={() => setConfirmUser(u)}
                            title="Deactivate"
                            className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmUser(u)}
                            title="Activate"
                            className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition dark:hover:bg-emerald-900/20"
                          >
                            <CheckCircle className="size-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-gray-200 px-6 py-4 dark:border-white/[0.05]">
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
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3.5 text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 transition"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                )
                .reduce<(number | "…")[]>((acc, p, i, arr) => {
                  if (i > 0 && (p as number) - (arr[i - 1] as number) > 1)
                    acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "…" ? (
                    <span key={`e${i}`} className="px-1 text-gray-400 text-sm">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${page === p ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"}`}
                    >
                      {p}
                    </button>
                  ),
                )}
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3.5 text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 transition"
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
