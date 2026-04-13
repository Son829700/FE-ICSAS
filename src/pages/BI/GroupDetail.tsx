/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Plus,
  Trash2,
  Search,
  X,
  Check,
  ArrowLeft,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import AppLoading from "../OtherPage/AppLoading";
import PageMeta from "../../components/common/PageMeta";
import toast from "react-hot-toast";

/* =======================
   TYPES
======================= */
interface GroupDetailType {
  group_id: string;
  group_name: string;
  description: string;
  groupType: string;
  status: string;
  createdAt: string;
}

interface Member {
  user_id: string;
  username: string;
  email: string;
  role?: string;
  department: Department;
}

export interface User {
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
  createdBy: User;
  updatedBy: User | null;
  status: string;
  createdAt: string | null;
}

export interface Department {
  department_id: string;
  department_name: string;
  manager: User;
  status: string;
  department_type: "INTERNAL" | "EXTERNAL";
}

const CATEGORY_STYLE: Record<string, string> = {
  OVERVIEW: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  ANALYTICS:
    "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  SALES: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
  MARKETING: "bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400",
  SUPPORT:
    "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
};

/* =======================
   ADD MEMBER MODAL
======================= */
function AddMemberModal({
  isOpen,
  onClose,
  members,
  users,
  departments,
  groupId,
  onAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  users: User[];
  departments: Department[];
  groupId: string;
  onAdded: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);

  const available = users
    .filter((u) => !members.some((m) => m.user_id === u.user_id))
    .filter((u) => {
      const q = search.toLowerCase();
      const matchSearch =
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      const matchDept =
        !filterDept || u.department?.department_id === filterDept;
      return matchSearch && matchDept;
    });

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleAdd = async () => {
    if (!selectedIds.length) return;
    setAdding(true);

    let successCount = 0;
    const failedUsers: string[] = [];

    for (const userId of selectedIds) {
      try {
        await API.post(`/groups/add-member/${groupId}/user/${userId}`);
        successCount++;
      } catch (err: any) {
        if (err.response?.status === 400) {
          try {
            await API.put(`/groups/restore-member/${groupId}/user/${userId}`);
            successCount++;
          } catch {
            failedUsers.push(userId);
          }
        } else {
          failedUsers.push(userId);
        }
      }
    }

    if (successCount > 0) {
      toast.success(`Added ${successCount} member(s) successfully!`);
      onAdded();
    }
    if (failedUsers.length > 0) {
      toast.error(`Failed to add ${failedUsers.length} member(s).`);
    }

    setAdding(false);
    handleClose();
  };

  const handleClose = () => {
    setSearch("");
    setFilterDept("");
    setSelectedIds([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-2xl p-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Add Members
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Select one or more users to add
          </p>
        </div>
        {selectedIds.length > 0 && (
          <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            {selectedIds.length} selected
          </span>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.department_id} value={d.department_id}>
                {d.department_name}
              </option>
            ))}
          </select>
        </div>

        <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          {available.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              No users available.
            </p>
          ) : (
            available.map((u) => {
              const isSelected = selectedIds.includes(u.user_id);
              return (
                <div
                  key={u.user_id}
                  onClick={() => toggleSelect(u.user_id)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isSelected ? "bg-brand-50 dark:bg-brand-500/10" : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"}`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                      {u.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-gray-400">
                      {u.department?.department_name ?? "—"}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800">
                      {u.role}
                    </span>
                  </div>
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${isSelected ? "border-brand-500 bg-brand-500" : "border-gray-300 dark:border-gray-600"}`}
                  >
                    {isSelected && <Check className="size-3 text-white" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {selectedIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedIds.map((id) => {
              const u = users.find((x) => x.user_id === id);
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                >
                  {u?.username}
                  <X
                    className="size-3 cursor-pointer"
                    onClick={() => toggleSelect(id)}
                  />
                </span>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={adding}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!selectedIds.length || adding}
            onClick={handleAdd}
          >
            {adding
              ? "Adding..."
              : `Add ${selectedIds.length || ""} Member${selectedIds.length !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* =======================
   ADD DASHBOARD MODAL
======================= */
function AddDashboardModal({
  isOpen,
  onClose,
  dashboards,
  allDashboards,
  groupId,
  onAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  dashboards: Dashboard[];
  allDashboards: Dashboard[];
  groupId: string;
  onAdded: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);

  const categories = [...new Set(allDashboards.map((d) => d.category))];
  const available = allDashboards
    .filter((d) => !dashboards.some((gd) => gd.dashboard_id === d.dashboard_id))
    .filter((d) => d.status === "ACTIVE")
    .filter((d) => {
      const matchSearch = d.dashboard_name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchCat = !filterCategory || d.category === filterCategory;
      return matchSearch && matchCat;
    });

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleAdd = async () => {
    if (!selectedIds.length) return;
    setAdding(true);

    let successCount = 0;
    const failedDashboards: string[] = [];

    for (const dashboardId of selectedIds) {
      try {
        await API.post(
          `/dashboard/grant-access/group/${groupId}/dashboard/${dashboardId}`,
        );
        successCount++;
      } catch (err: any) {
        if (err.response?.status === 400) {
          try {
            await API.put(
              `/dashboard/restore-access/group/${groupId}/dashboard/${dashboardId}`,
            );
            successCount++;
          } catch {
            failedDashboards.push(dashboardId);
          }
        } else {
          failedDashboards.push(dashboardId);
        }
      }
    }

    if (successCount > 0) {
      toast.success(`Granted access to ${successCount} dashboard(s)!`);
      onAdded();
    }
    if (failedDashboards.length > 0) {
      toast.error(`Failed to grant ${failedDashboards.length} dashboard(s).`);
    }

    setAdding(false);
    handleClose();
  };

  const handleClose = () => {
    setSearch("");
    setFilterCategory("");
    setSelectedIds([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-2xl p-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Grant Dashboard Access
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Select dashboards to grant to this group
          </p>
        </div>
        {selectedIds.length > 0 && (
          <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            {selectedIds.length} selected
          </span>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search dashboard..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          {available.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              No dashboards available.
            </p>
          ) : (
            available.map((d) => {
              const isSelected = selectedIds.includes(d.dashboard_id);
              return (
                <div
                  key={d.dashboard_id}
                  onClick={() => toggleSelect(d.dashboard_id)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isSelected ? "bg-brand-50 dark:bg-brand-500/10" : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"}`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 text-xs font-bold">
                    {d.dashboard_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                      {d.dashboard_name}
                    </p>
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 ${CATEGORY_STYLE[d.category] ?? "bg-gray-100 text-gray-500"}`}
                    >
                      {d.category}
                    </span>
                  </div>
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${isSelected ? "border-brand-500 bg-brand-500" : "border-gray-300 dark:border-gray-600"}`}
                  >
                    {isSelected && <Check className="size-3 text-white" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {selectedIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedIds.map((id) => {
              const d = allDashboards.find((x) => x.dashboard_id === id);
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                >
                  {d?.dashboard_name}
                  <X
                    className="size-3 cursor-pointer"
                    onClick={() => toggleSelect(id)}
                  />
                </span>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={adding}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!selectedIds.length || adding}
            onClick={handleAdd}
          >
            {adding
              ? "Granting..."
              : `Grant ${selectedIds.length || ""} Dashboard${selectedIds.length !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* =======================
   STAT CARD
======================= */
function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.02] p-4 flex items-center gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-500">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-lg font-semibold text-gray-800 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

/* =======================
   MAIN PAGE
======================= */
export default function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState<GroupDetailType | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allDashboards, setAllDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddDashboardOpen, setIsAddDashboardOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<"member" | "dashboard" | null>(
    null,
  );
  const [targetId, setTargetId] = useState<string | null>(null);

  const fetchMembers = async () => {
    const res = await API.get(`/groups/user-by-group/${groupId}`);
    setMembers(res.data.data ?? []);
  };

  const fetchDashboards = async () => {
    const res = await API.get(`/dashboard/group-access/group/${groupId}`);
    setDashboards(res.data.data ?? []);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!groupId) return;
        setLoading(true);
        const [groupRes, memberRes, dashboardRes] = await Promise.all([
          API.get(`/groups/${groupId}`),
          API.get(`/groups/user-by-group/${groupId}`),
          API.get(`/dashboard/group-access/group/${groupId}`),
        ]);
        setGroup(groupRes.data.data);
        setMembers(memberRes.data.data ?? []);
        setDashboards(dashboardRes.data.data ?? []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [groupId]);

  const handleRemoveMember = async (userId: string) => {
    if (!groupId) return;
    try {
      await API.put(`/groups/soft-remove-member/${groupId}/user/${userId}`);
      toast.success("Member removed.");
      await fetchMembers();
    } catch {
      toast.error("Failed to remove member.");
    }
  };

  const handleRemoveDashboard = async (dashboardId: string) => {
    if (!groupId) return;
    try {
      await API.put(
        `/dashboard/revoke-access/group/${groupId}/dashboard/${dashboardId}`,
      );
      toast.success("Dashboard access revoked.");
      await fetchDashboards();
    } catch {
      toast.error("Failed to revoke access.");
    }
  };

  if (loading) return <AppLoading />;
  if (!group) return <div className="p-6 text-gray-400">Group not found.</div>;

  return (
    <div className="space-y-6">
      <PageMeta
        title={`${group.group_name} | Group Detail`}
        description="Group detail"
      />

      {/* Back button */}
      <button
        onClick={() => navigate("/group")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition"
      >
        <ArrowLeft className="size-4" />
        Back to Group Management
      </button>

      {/* Modals */}
      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        members={members}
        users={users}
        departments={departments}
        groupId={groupId!}
        onAdded={fetchMembers}
      />
      <AddDashboardModal
        isOpen={isAddDashboardOpen}
        onClose={() => setIsAddDashboardOpen(false)}
        dashboards={dashboards}
        allDashboards={allDashboards}
        groupId={groupId!}
        onAdded={fetchDashboards}
      />

      {/* Confirm remove modal */}
      <Modal
        isOpen={confirmType !== null}
        onClose={() => {
          setConfirmType(null);
          setTargetId(null);
        }}
        className="max-w-md p-6"
      >
        <div className="space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
            <Trash2 className="size-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white">
              Confirm Remove
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {confirmType === "member"
                ? "Are you sure you want to remove this member from the group?"
                : "Are you sure you want to revoke this dashboard's access from the group?"}
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmType(null);
                setTargetId(null);
              }}
            >
              Cancel
            </Button>
            <button
              onClick={async () => {
                if (!targetId) return;
                if (confirmType === "member")
                  await handleRemoveMember(targetId);
                if (confirmType === "dashboard")
                  await handleRemoveDashboard(targetId);
                setConfirmType(null);
                setTargetId(null);
              }}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition"
            >
              Remove
            </button>
          </div>
        </div>
      </Modal>

      {/* Group Overview */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
                <Users className="size-5 text-brand-500" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {group.group_name}
                </h1>
                <div className="mt-0.5 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${group.groupType === "TRADITIONAL"
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                      : "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
                      }`}
                  >
                    {group.groupType === "TRADITIONAL"
                      ? "Traditional"
                      : "Adhoc"}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${group.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-red-100 text-red-600"
                      }`}
                  >
                    {group.status}
                  </span>
                </div>
              </div>
            </div>
            {group.description && (
              <p className="mt-4 max-w-xl text-sm text-gray-500 dark:text-gray-400">
                {group.description}
              </p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Members"
            value={members.length}
            icon={<Users className="size-4" />}
          />
          <StatCard
            label="Dashboards Granted"
            value={dashboards.length}
            icon={<LayoutDashboard className="size-4" />}
          />
          <StatCard
            label="Created"
            value={new Date(group.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
            icon={
              <svg
                className="size-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                />
              </svg>
            }
          />
        </div>
      </div>

      {/* Members + Dashboards */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Members — wider */}
        <div className="lg:col-span-3 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-gray-800 dark:text-white">
                Members
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {members.length} member{members.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={async () => {
                const [usersRes, deptsRes] = await Promise.all([
                  API.get("/users"),
                  API.get("/departments"),
                ]);
                setUsers(usersRes.data.data ?? []);
                setDepartments(deptsRes.data.data ?? []);
                setIsAddMemberOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 transition"
            >
              <Plus className="size-3.5" />
              Add Member
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                    Role
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {members.length > 0 ? (
                  members.map((m) => (
                    <tr
                      key={m.user_id}
                      className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-300">
                            {m.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 dark:text-white">
                              {m.username}
                            </p>
                            <p className="text-xs text-gray-400">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {m.department?.department_name ?? "—"}
                      </td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          {m.role || "Member"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => {
                            setConfirmType("member");
                            setTargetId(m.user_id);
                          }}
                          className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 transition dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-10 text-center text-sm text-gray-400"
                    >
                      No members yet. Add one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dashboards — narrower */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-gray-800 dark:text-white">
                Dashboards
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {dashboards.length} granted
              </p>
            </div>
            <button
              onClick={async () => {
                const res = await API.get("/dashboard");
                setAllDashboards(res.data.data ?? []);
                setIsAddDashboardOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.04] transition"
            >
              <Plus className="size-3.5" />
              Grant Access
            </button>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {dashboards.length > 0 ? (
              dashboards.map((d) => (
                <div
                  key={d.dashboard_id}
                  className={`flex items-center gap-3 px-6 py-3.5 ${d.status === "INACTIVE" ? "opacity-50" : ""}`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 text-xs font-bold">
                    {d.dashboard_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {d.dashboard_name}
                    </p>
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 ${CATEGORY_STYLE[d.category] ?? "bg-gray-100 text-gray-500"}`}
                    >
                      {d.category}
                    </span>
                  </div>
                  {d.status === "ACTIVE" ? (
                    <button
                      onClick={() => {
                        setConfirmType("dashboard");
                        setTargetId(d.dashboard_id);
                      }}
                      className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 transition dark:hover:bg-red-900/20 shrink-0"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  ) : (
                    <span className="text-xs rounded-full bg-red-100 text-red-500 px-2 py-0.5 shrink-0">
                      Inactive
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="px-6 py-10 text-center">
                <LayoutDashboard className="size-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  No dashboards granted yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
