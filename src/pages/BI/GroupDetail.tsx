import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../api";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import AppLoading from "../OtherPage/AppLoading";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import toast from "react-hot-toast";

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

export default function GroupDetail() {
  const { groupId } = useParams();
  const [group, setGroup] = useState<GroupDetailType | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [departments, setdepartment] = useState<Department[]>([]);
  const [confirmType, setConfirmType] = useState<"member" | "dashboard" | null>(
    null,
  );
  const [targetId, setTargetId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddDashboardOpen, setIsAddDashboardOpen] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [allDashboards, setAllDashboards] = useState<Dashboard[]>([]);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedDashboardId, setSelectedDashboardId] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");

  const [filterCategory, setFilterCategory] = useState("");
  const [searchUser, setSearchUser] = useState("");

  const availableDashboards = allDashboards
    .filter((d) => !dashboards.some((gd) => gd.dashboard_id === d.dashboard_id))
    .filter((d) => !filterCategory || d.category === filterCategory);

  const categories = [...new Set(allDashboards.map((d) => d.category))];

  const availableUsers = users
    // loại user đã có trong group
    .filter((u) => !members.some((m) => m.user_id === u.user_id))
    // search
    .filter((u) => {
      const matchSearch =
        u.username.toLowerCase().includes(searchUser.toLowerCase()) ||
        u.email.toLowerCase().includes(searchUser.toLowerCase());

      const matchDepartment =
        !filterDepartment || u.department?.department_id === filterDepartment;

      return matchSearch && matchDepartment;
    });
  const fetchUsers = async () => {
    const res = await API.get("/users");
    setUsers(res.data.data);
  };
  const fetchDepartments = async () => {
    const res = await API.get("/departments");
    setdepartment(res.data.data);
  };

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    try {
      await API.post(`/groups/add-member/${groupId}/user/${selectedUserId}`);
      toast.success("Member added successfully");
    } catch (error: any) {
      // Nếu member đã tồn tại nhưng bị soft delete
      if (error.response?.status === 400) {
        await API.put(
          `/groups/restore-member/${groupId}/user/${selectedUserId}`,
        );
        toast.success("Member added successfully");
      } else {
        console.error("Add member error:", error);
        return;
      }
    }

    // reload
    const memberRes = await API.get(`/groups/user-by-group/${groupId}`);
    setMembers(memberRes.data.data);

    setIsAddMemberOpen(false);
    resetMemberModal();
  };

  const fetchAllDashboards = async () => {
    const res = await API.get("/dashboard");
    setAllDashboards(res.data.data);
  };

  const handleAddDashboard = async () => {
    if (!selectedDashboardId) return;

    try {
      await API.post(
        `/dashboard/grant-access/group/${groupId}/dashboard/${selectedDashboardId}`,
      );
      toast.success("Added successfully");
    } catch (error: any) {
      if (error.response?.status === 400) {
        await API.put(
          `/dashboard/restore-access/group/${groupId}/dashboard/${selectedDashboardId}`,
        );
        toast.success("Added successfully");
      } else {
        console.error("Add dashboard error:", error);
        return;
      }
    }

    const dashboardRes = await API.get(
      `/dashboard/group-access/group/${groupId}`,
    );

    setDashboards(dashboardRes.data.data);

    setIsAddDashboardOpen(false);
    resetDashboardModal();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!groupId) return;

        setLoading(true);

        // 1️⃣ Get group overview
        const groupRes = await API.get(`/groups/${groupId}`);
        setGroup(groupRes.data.data);

        // 2️⃣ Get members
        const memberRes = await API.get(`/groups/user-by-group/${groupId}`);
        setMembers(memberRes.data.data);

        // 3️⃣ Get dashboards
        const dashboardRes = await API.get(
          `/dashboard/group-access/group/${groupId}`,
        );
        setDashboards(dashboardRes.data.data);
      } catch (error) {
        console.error("Fetch Group Detail error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [groupId]);

  if (loading) {
    return <AppLoading />;
  }

  if (!group) {
    return <div className="p-6">Group not found.</div>;
  }
  const resetMemberModal = () => {
    setSelectedUserId("");
    setSearchUser("");
    setFilterDepartment("");
  };

  const resetDashboardModal = () => {
    setSelectedDashboardId("");
    setFilterCategory("");
  };
  const handleRemoveMember = async (userId: string) => {
    if (!groupId) return;

    try {
      await API.put(`/groups/soft-remove-member/${groupId}/user/${userId}`);
      toast.success("Remove member successfully!");

      // reload member list
      const memberRes = await API.get(`/groups/user-by-group/${groupId}`);
      setMembers(memberRes.data.data);
    } catch (error) {
      console.error("Remove member error:", error);
    }
  };
  const handleRemoveDashboard = async (dashboardId: string) => {
    if (!groupId) return;

    try {
      await API.put(
        `/dashboard/revoke-access/group/${groupId}/dashboard/${dashboardId}`,
      );
      toast.success("Remove dashbaord successfully!");

      // reload dashboard list
      const dashboardRes = await API.get(
        `/dashboard/group-access/group/${groupId}`,
      );
      setDashboards(dashboardRes.data.data);
    } catch (error) {
      console.error("Remove dashboard error:", error);
    }
  };
  return (
    <div className="space-y-6">
      <PageMeta
        title="Group Management | BI"
        description="Manage system group"
      />
      <PageBreadcrumb pageTitle="Group detail" />
      <Modal
        isOpen={isAddMemberOpen}
        onClose={() => {
          resetMemberModal();
          setIsAddMemberOpen(false);
        }}
        className="max-w-2xl p-6"
      >
        <div className="flex items-center justify-between border-b pb-4">
          <h3 className="text-lg font-semibold">Add Member to Group</h3>
        </div>

        <div className="mt-4 space-y-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            className="w-full rounded-lg border px-4 py-2 text-sm"
          />

          {/* Department Filter */}
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="w-full rounded-lg border px-4 py-2 text-sm"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.department_id} value={dept.department_id}>
                {dept.department_name}
              </option>
            ))}
          </select>

          {/* User List */}
          <div className="max-h-64 overflow-y-auto border rounded-lg">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full rounded-lg border px-4 py-2 text-sm"
            >
              <option value="">Select user</option>
              {availableUsers.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.username} - {u.email} (
                  {u.department?.department_name || "No Dept"})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
              Cancel
            </Button>

            <Button
              variant="primary"
              disabled={!selectedUserId}
              onClick={handleAddMember}
            >
              Add Member
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={confirmType !== null}
        onClose={() => {
          setConfirmType(null);
          setTargetId(null);
        }}
        className="max-w-md p-6"
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Confirm Remove
          </h3>

          <p className="text-sm text-gray-600">
            {confirmType === "member"
              ? "Are you sure you want to remove this user from the group?"
              : "Are you sure you want to revoke this dashboard from the group?"}
          </p>

          <div className="flex justify-end gap-3 pt-4">
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
                if (!groupId || !targetId) return;

                try {
                  if (confirmType === "member") {
                    await handleRemoveMember(targetId);
                  }

                  if (confirmType === "dashboard") {
                    await handleRemoveDashboard(targetId);
                  }
                } catch (error) {
                  console.error("Delete error:", error);
                } finally {
                  setConfirmType(null);
                  setTargetId(null);
                }
              }}
            >
              Confirm Remove
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={isAddDashboardOpen}
        onClose={() => {
          resetDashboardModal();
          setIsAddDashboardOpen(false);
        }}
        className="max-w-2xl p-6"
      >
        <div className="flex items-center justify-between border-b pb-4">
          <h3 className="text-lg font-semibold">Grant Dashboard Access</h3>
        </div>

        <div className="mt-4 space-y-4">
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full rounded-lg border px-4 py-2 text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Dashboard List */}
          <div className="max-h-64 overflow-y-auto border rounded-lg">
            <select
              value={selectedDashboardId}
              onChange={(e) => setSelectedDashboardId(e.target.value)}
              className="w-full rounded-lg border px-4 py-2 text-sm"
            >
              <option value="">Select dashboard</option>
              {availableDashboards.map((d) => (
                <option key={d.dashboard_id} value={d.dashboard_id}>
                  {d.dashboard_name} ({d.category})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsAddDashboardOpen(false)}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              disabled={!selectedDashboardId}
              onClick={handleAddDashboard}
            >
              Grant Access
            </Button>
          </div>
        </div>
      </Modal>
      {/* ===================== */}
      {/* ① GROUP OVERVIEW */}
      {/* ===================== */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Overview
        </h2>

        <div className="mt-4 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">Group Name</p>
            <p className="text-base font-medium text-gray-800">
              {group.group_name}
            </p>

            <p className="mt-3 text-sm text-gray-500">Description</p>
            <p className="text-sm text-gray-700">
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
            />{" "}
            <OverviewStat label="Group type" value={group.groupType} />
          </div>
        </div>
      </div>

      {/* ===================== */}
      {/* USERS + DASHBOARDS */}
      {/* ===================== */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ===== USERS ===== */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Group Members
            </h2>

            <button
              onClick={() => {
                fetchUsers();
                fetchDepartments();
                setIsAddMemberOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm text-white"
            >
              <Plus className="size-4" />
              Add member
            </button>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="pb-3 font-medium text-gray-500">Name</th>
                <th className="pb-3 font-medium text-gray-500">Email</th>
                <th className="pb-3 font-medium text-gray-500">Department</th>
                <th className="pb-3 font-medium text-gray-500">Role</th>
                <th />
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {members.length > 0 ? (
                members.map((m) => (
                  <tr key={m.user_id}>
                    <td className="py-3 font-medium text-gray-800">
                      {m.username}
                    </td>
                    <td className="py-3 text-gray-600">{m.email}</td>
                    <td className="py-3 text-gray-600">
                      {m.department.department_name}
                    </td>
                    <td className="py-3 text-gray-600">{m.role || "Member"}</td>
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
                  <td colSpan={4} className="py-4 text-center text-gray-400">
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ===== DASHBOARDS ===== */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Granted Dashboards
            </h2>

            <Plus
              className="size-5 text-gray-400 cursor-pointer"
              onClick={() => {
                fetchAllDashboards();
                setIsAddDashboardOpen(true);
              }}
            />
          </div>

          <ul className="space-y-3">
            {dashboards.length > 0 ? (
              dashboards.map((d) => (
                <li
                  key={d.dashboard_id}
                  className={`flex items-center justify-between rounded-lg border px-4 py-2 text-sm
    ${d.status === "INACTIVE" ? "bg-gray-100 opacity-60" : "border-gray-100"}
  `}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700">{d.dashboard_name}</span>

                    {d.status === "INACTIVE" && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                        Inactive
                      </span>
                    )}
                  </div>

                  {d.status === "ACTIVE" && (
                    <Trash2
                      className="size-4 text-red-500 cursor-pointer hover:text-red-700"
                      onClick={() => {
                        setConfirmType("dashboard");
                        setTargetId(d.dashboard_id);
                      }}
                    />
                  )}
                </li>
              ))
            ) : (
              <p className="text-sm text-gray-400">No dashboards assigned.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ===================== */
/* SMALL COMPONENT */
/* ===================== */

function OverviewStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-gray-100 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-800">{value}</p>
    </div>
  );
}
