import { useEffect, useRef, useState } from "react";
import PageMeta from "../../components/common/PageMeta";

import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
} from "@floating-ui/react";
import { MoreHorizontal, Search, Filter } from "lucide-react";
import API from "../../api";

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

/* =======================
   ACTION MENU (3 DOTS)
======================= */
interface ActionMenuProps {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onView: () => void;
  onInactive: () => void;
}

function ActionMenu({
  open,
  onToggle,
  onClose,
  onView,
  onInactive,
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
              onInactive();
              onClose();
            }}
            className="flex w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10"
          >
            Inactive
          </button>
        </div>
      )}
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

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await API.get("/users");
        setUsers(response.data.data);
        console.log("API response:", response.data);
      } catch (error) {
        console.error("Fetch error in UserManagement:", error);
      }
    };

    fetchData();
  }, []);
  const filteredUsers = users.filter((u) => {
    const keywordMatch =
      u.username.toLowerCase().includes(filter.keyword.toLowerCase()) ||
      u.email.toLowerCase().includes(filter.keyword.toLowerCase());

    const roleMatch = !filter.role || u.role === filter.role;
    const deptMatch =
      !filter.department || u.department?.department_name === filter.department;

    return keywordMatch && roleMatch && deptMatch;
  });

  /* Close filter dropdown */
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
  return (
    <>
      <PageMeta title="User Management" description="User management page" />

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
            {/* Search với Icon */}
            <div className="relative">
              <span className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                <Search size={20} />
              </span>
              <input
                type="text"
                placeholder="Search name or email..."
                value={filter.keyword}
                onChange={(e) =>
                  setFilter({ ...filter, keyword: e.target.value })
                }
                // Thêm class 'pl-11' để tạo khoảng trống cho icon bên trái
                className="h-11 w-[260px] rounded-lg border border-gray-300 bg-transparent pl-11 pr-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>

            {/* Filter với Icon */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                // Thêm 'flex items-center gap-2' để căn chỉnh icon và chữ
                className="flex h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
              >
                <Filter size={20} />
                Filter
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
                        setFilter({ ...filter, role: e.target.value })
                      }
                      className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    >
                      <option value="">All</option>
                      <option value="ADMINISTRATOR">Administrator</option>
                      <option value="BI">BI</option>
                      <option value="MANAGER">Manager</option>
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
                        setFilter({ ...filter, department: e.target.value })
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

                  <button
                    onClick={() => setFilterOpen(false)}
                    className="h-10 w-full rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 transition"
                  >
                    Apply
                  </button>
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
                {filteredUsers.map((u) => (
                  <tr key={u.user_id}>
                    <td className="px-4 py-4 font-medium text-theme-sm text-gray-700 dark:text-gray-400">
                      {u.username}
                    </td>
                    <td className="px-4 py-4 text-theme-sm text-gray-700 dark:text-gray-400">
                      {u.email}
                    </td>
                    <td className="px-4 py-4 text-theme-sm  text-gray-700 dark:text-gray-400">
                      {u.role}
                    </td>
                    <td className="px-4 py-4 text-theme-sm  text-gray-700 dark:text-gray-400">
                      {u.department?.department_name}
                    </td>
                    <td className="px-4 py-4 text-theme-sm  text-gray-700 dark:text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-S2.5 py-0.5 text-theme-xs font-medium ${
                          u.status === "ACTIVE"
                            ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
                            : "bg-error-50 text-error-600 dark:bg-error-500/15"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <ActionMenu
                        open={activeMenuId === u.user_id}
                        onToggle={() =>
                          setActiveMenuId(
                            activeMenuId === u.user_id ? null : u.user_id,
                          )
                        }
                        onClose={() => setActiveMenuId(null)}
                        onView={() => console.log("View", u.user_id)}
                        onInactive={() => console.log("Inactive", u.user_id)}
                      />
                    </td>
                  </tr>
                ))}
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
              className="rounded-lg bg-white px-4 py-3 text-sm ring-1 ring-gray-300 dark:bg-gray-800 dark:ring-gray-700"
            >
              Previous
            </button>

            {/* 👉 DÒNG BỊ THIẾU */}
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-400">
              Page {page} of {3}
            </span>

            <button
              disabled={page === 3}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg bg-white px-4 py-3 text-sm ring-1 ring-gray-300 dark:bg-gray-800 dark:ring-gray-700"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg bg-white px-4 py-3 text-sm ring-1 ring-gray-300 dark:bg-gray-800 dark:ring-gray-700"
            >
              Previous
            </button>

            <ul className="hidden items-center gap-1 sm:flex">
              {[1, 2, 3].map((p) => (
                <li key={p}>
                  <button
                    onClick={() => setPage(p)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${
                      page === p
                        ? "bg-brand-500 text-white"
                        : "text-gray-700 hover:bg-brand-500/10 dark:text-gray-400"
                    }`}
                  >
                    {p}
                  </button>
                </li>
              ))}
            </ul>

            <button
              disabled={page === 3}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg bg-white px-4 py-3 text-sm ring-1 ring-gray-300 dark:bg-gray-800 dark:ring-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
