import { LayoutDashboard, Plus, Trash2 } from "lucide-react";

export default function GroupDetail() {
  const group = {
    name: "Admin Group",
    description: "Group for system administrators",
    createdAt: "12 Jan 2026",
    membersCount: 12,
    dashboardsCount: 5,
  };

  const members = [
    { id: "1", name: "Nguyen Hong Son", email: "son@fpt.vn", role: "Admin" },
    { id: "2", name: "Tran Minh Anh", email: "anh@fpt.vn", role: "Member" },
  ];

  const dashboards = [
    { id: "d1", name: "Sales Dashboard" },
    { id: "d2", name: "Marketing Overview" },
  ];

  return (
    <div className="space-y-6">
      {/* ===================== */}
      {/* ① GROUP OVERVIEW */}
      {/* ===================== */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Group Overview
        </h2>

        <div className="mt-4 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Group Name
            </p>
            <p className="text-base font-medium text-gray-800 dark:text-gray-200">
              {group.name}
            </p>

            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Description
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {group.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <OverviewStat label="Members" value={group.membersCount} />
            <OverviewStat label="Dashboards" value={group.dashboardsCount} />
            <OverviewStat label="Created At" value={group.createdAt} />
          </div>
        </div>
      </div>

      {/* ===================== */}
      {/* ② USERS + ③ DASHBOARDS */}
      {/* ===================== */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* ===== USERS (2/3) ===== */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Group Members
            </h2>

            <button className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm text-white">
              <Plus className="size-4" />
              Add member
            </button>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left dark:border-gray-800">
                <th className="pb-3 font-medium text-gray-500">Name</th>
                <th className="pb-3 font-medium text-gray-500">Email</th>
                <th className="pb-3 font-medium text-gray-500">Role</th>
                <th />
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="py-3 font-medium text-gray-800 dark:text-gray-200">
                    {m.name}
                  </td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">
                    {m.email}
                  </td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">
                    {m.role}
                  </td>
                  <td className="py-3 text-right">
                    <Trash2 className="size-4 text-red-500 cursor-pointer" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ===== DASHBOARDS (1/3) ===== */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Granted Dashboards
            </h2>

            <LayoutDashboard className="size-5 text-gray-400" />
          </div>

          <ul className="space-y-3">
            {dashboards.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-2 text-sm dark:border-gray-800"
              >
                <span className="text-gray-700 dark:text-gray-300">
                  {d.name}
                </span>
                <Trash2 className="size-4 text-red-500 cursor-pointer" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ===================== */
/* SMALL COMPONENTS */
/* ===================== */

function OverviewStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-800 dark:text-gray-200">
        {value}
      </p>
    </div>
  );
}
