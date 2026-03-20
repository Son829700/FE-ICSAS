import { Plus, Trash2, Search, X, Check, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../api";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import AppLoading from "../OtherPage/AppLoading";
import PageMeta from "../../components/common/PageMeta";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

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
}

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
      const matchSearch =
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchDept =
        !filterDept || u.department?.department_id === filterDept;
      return matchSearch && matchDept;
    });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleAdd = async () => {
    if (!selectedIds.length) return;
    setAdding(true);
    try {
      await Promise.all(
        selectedIds.map(async (userId) => {
          try {
            await API.post(`/groups/add-member/${groupId}/user/${userId}`);
          } catch (err: any) {
            if (err.response?.status === 400) {
              await API.put(`/groups/restore-member/${groupId}/user/${userId}`);
            }
          }
        }),
      );
      toast.success(`Added ${selectedIds.length} member(s) successfully!`);
      onAdded();
      handleClose();
    } catch (err) {
      toast.error("Failed to add members.");
    } finally {
      setAdding(false);
    }
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
            Select one or more users to add to this group
          </p>
        </div>
        {selectedIds.length > 0 && (
          <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            {selectedIds.length} selected
          </span>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {/* Search + Filter */}
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

        {/* User List */}
        <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
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
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-brand-50 dark:bg-brand-500/10"
                      : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                  }`}
                >
                  {/* Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {u.username.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                      {u.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>

                  {/* Dept + Role */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-gray-500">
                      {u.department?.department_name ?? "—"}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      {u.role}
                    </span>
                  </div>

                  {/* Checkbox */}
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                      isSelected
                        ? "border-brand-500 bg-brand-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {isSelected && <Check className="size-3 text-white" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected preview */}
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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleAdd = async () => {
    if (!selectedIds.length) return;
    setAdding(true);
    try {
      await Promise.all(
        selectedIds.map(async (dashboardId) => {
          try {
            await API.post(
              `/dashboard/grant-access/group/${groupId}/dashboard/${dashboardId}`,
            );
          } catch (err: any) {
            if (err.response?.status === 400) {
              await API.put(
                `/dashboard/restore-access/group/${groupId}/dashboard/${dashboardId}`,
              );
            }
          }
        }),
      );
      toast.success(`Granted access to ${selectedIds.length} dashboard(s)!`);
      onAdded();
      handleClose();
    } catch (err) {
      toast.error("Failed to grant access.");
    } finally {
      setAdding(false);
    }
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
            Select one or more dashboards to grant to this group
          </p>
        </div>
        {selectedIds.length > 0 && (
          <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            {selectedIds.length} selected
          </span>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {/* Search + Filter */}
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

        {/* Dashboard List */}
        <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
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
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-brand-50 dark:bg-brand-500/10"
                      : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                  }`}
                >
                  {/* Icon */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 text-xs font-bold">
                    {d.dashboard_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                      {d.dashboard_name}
                    </p>
                    <p className="text-xs text-gray-500">{d.category}</p>
                  </div>

                  {/* Checkbox */}
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                      isSelected
                        ? "border-brand-500 bg-brand-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {isSelected && <Check className="size-3 text-white" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected preview */}
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
    setMembers(res.data.data);
  };

  const fetchDashboards = async () => {
    const res = await API.get(`/dashboard/group-access/group/${groupId}`);
    setDashboards(res.data.data);
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
        setMembers(memberRes.data.data);
        setDashboards(dashboardRes.data.data);
      } catch (error) {
        console.error("Fetch error:", error);
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
    } catch (error) {
      toast.error("Failed to remove member.");
    }
  };

  const handleRemoveDashboard = async (dashboardId: string) => {
    if (!groupId) return;
    try {
      await API.put(
        `/dashboard/revoke-access/group/${groupId}/dashboard/${dashboardId}`,
      );
      toast.success("Dashboard removed.");
      await fetchDashboards();
    } catch (error) {
      toast.error("Failed to remove dashboard.");
    }
  };

  if (loading) return <AppLoading />;
  if (!group) return <div className="p-6">Group not found.</div>;

  return (
    <div className="space-y-6">
      <PageMeta
        title="Group Management | BI"
        description="Manage system group"
      />
      <button
        onClick={() => navigate("/group")}
        className="flex w-fit items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition"
      >
        <ArrowLeft className="size-4" />
        Back to Group Management
      </button>

      {/* ADD MEMBER MODAL */}
      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        members={members}
        users={users}
        departments={departments}
        groupId={groupId!}
        onAdded={fetchMembers}
      />

      {/* ADD DASHBOARD MODAL */}
      <AddDashboardModal
        isOpen={isAddDashboardOpen}
        onClose={() => setIsAddDashboardOpen(false)}
        dashboards={dashboards}
        allDashboards={allDashboards}
        groupId={groupId!}
        onAdded={fetchDashboards}
      />

      {/* CONFIRM MODAL */}
      <Modal
        isOpen={confirmType !== null}
        onClose={() => {
          setConfirmType(null);
          setTargetId(null);
        }}
        className="max-w-md p-6"
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Confirm Remove
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {confirmType === "member"
              ? "Are you sure you want to remove this user from the group?"
              : "Are you sure you want to revoke this dashboard from the group?"}
          </p>
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
            <Button
              variant="primary"
              onClick={async () => {
                if (!targetId) return;
                if (confirmType === "member")
                  await handleRemoveMember(targetId);
                if (confirmType === "dashboard")
                  await handleRemoveDashboard(targetId);
                setConfirmType(null);
                setTargetId(null);
              }}
            >
              Confirm Remove
            </Button>
          </div>
        </div>
      </Modal>

      {/* GROUP OVERVIEW */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Overview
        </h2>
        <div className="mt-4 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">Group Name</p>
            <p className="text-base font-medium text-gray-800 dark:text-white">
              {group.group_name}
            </p>
            <p className="mt-3 text-sm text-gray-500">Description</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {group.description || "No description"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <OverviewStat label="Members" value={members.length} />
            <OverviewStat label="Dashboards" value={dashboards.length} />
            <OverviewStat
              label="Created at"
              value={new Date(group.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            />
            <OverviewStat
              label="Group type"
              value={
                group.groupType === "TRADITIONAL"
                  ? "Traditional"
                  : group.groupType === "ADHOC"
                    ? "Adhoc"
                    : group.groupType
              }
            />
          </div>
        </div>
      </div>

      {/* MEMBERS + DASHBOARDS */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* MEMBERS */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Group Members
            </h2>
            <button
              onClick={async () => {
                const [usersRes, deptsRes] = await Promise.all([
                  API.get("/users"),
                  API.get("/departments"),
                ]);
                setUsers(usersRes.data.data);
                setDepartments(deptsRes.data.data);
                setIsAddMemberOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition"
            >
              <Plus className="size-4" />
              Add member
            </button>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 text-left">
                <th className="pb-3 font-medium text-gray-500">Name</th>
                <th className="pb-3 font-medium text-gray-500">Email</th>
                <th className="pb-3 font-medium text-gray-500">Department</th>
                <th className="pb-3 font-medium text-gray-500">Role</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {members.length > 0 ? (
                members.map((m) => (
                  <tr key={m.user_id}>
                    <td className="py-3 font-medium text-gray-800 dark:text-white">
                      {m.username}
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">
                      {m.email}
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">
                      {m.department?.department_name ?? "—"}
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">
                      {m.role || "Member"}
                    </td>
                    <td className="py-3 text-right">
                      <Trash2
                        className="size-4 text-red-500 cursor-pointer hover:text-red-700"
                        onClick={() => {
                          setConfirmType("member");
                          setTargetId(m.user_id);
                        }}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* DASHBOARDS */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Granted Dashboards
            </h2>
            <button
              onClick={async () => {
                const res = await API.get("/dashboard");
                setAllDashboards(res.data.data);
                setIsAddDashboardOpen(true);
              }}
              className="flex items-center justify-center rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.03] transition"
            >
              <Plus className="size-4 text-gray-500" />
            </button>
          </div>

          <ul className="space-y-2">
            {dashboards.length > 0 ? (
              dashboards.map((d) => (
                <li
                  key={d.dashboard_id}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm ${
                    d.status === "INACTIVE"
                      ? "border-gray-100 bg-gray-50 opacity-60 dark:border-gray-800 dark:bg-gray-800/40"
                      : "border-gray-100 dark:border-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-500 text-xs font-bold">
                      {d.dashboard_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-700 dark:text-gray-300 truncate">
                        {d.dashboard_name}
                      </p>
                      <p className="text-xs text-gray-400">{d.category}</p>
                    </div>
                  </div>
                  {d.status === "ACTIVE" ? (
                    <Trash2
                      className="size-4 shrink-0 text-red-400 cursor-pointer hover:text-red-600 ml-2"
                      onClick={() => {
                        setConfirmType("dashboard");
                        setTargetId(d.dashboard_id);
                      }}
                    />
                  ) : (
                    <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full ml-2 shrink-0">
                      Inactive
                    </span>
                  )}
                </li>
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">
                No dashboards assigned.
              </p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function OverviewStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-800 dark:text-white">
        {value}
      </p>
    </div>
  );
}
