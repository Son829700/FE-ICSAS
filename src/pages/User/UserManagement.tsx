import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { PlusIcon } from "../../icons";
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
} from "@floating-ui/react";
import { MoreHorizontal } from "lucide-react";
import AddUserCard from "./AddUserCard";

/* =======================
   TYPES
======================= */
type UserRole = "ADMIN" | "DEVELOPER" | "EMPLOYEE";
type UserStatus = "ACTIVE" | "INACTIVE";
interface User {
  user_id: string;
  user_name: string;
  email: string;
  system_role: UserRole;
  department: string;
  created_at: string;
  status: UserStatus;
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
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  /* MOCK DATA – 3 PAGES */
  const users: User[] = [
    {
      user_id: "1",
      user_name: "Nguyen Van A",
      email: "a@company.com",
      system_role: "ADMIN",
      department: "Marketing",
      created_at: "2024-01-10",
      status: "ACTIVE",
    },
    {
      user_id: "2",
      user_name: "Tran Thi B",
      email: "b@company.com",
      system_role: "DEVELOPER",
      department: "IT",
      created_at: "2024-01-12",
      status: "ACTIVE",
    },
    {
      user_id: "3",
      user_name: "Le Van C",
      email: "c@company.com",
      system_role: "EMPLOYEE",
      department: "Finance",
      created_at: "2024-01-15",
      status: "INACTIVE",
    },
    {
      user_id: "4",
      user_name: "Pham Thi D",
      email: "d@company.com",
      system_role: "EMPLOYEE",
      department: "HR",
      created_at: "2024-01-18",
      status: "ACTIVE",
    },
    {
      user_id: "5",
      user_name: "Hoang Van E",
      email: "e@company.com",
      system_role: "DEVELOPER",
      department: "IT",
      created_at: "2024-01-20",
      status: "ACTIVE",
    },
  ];

  return (
    <>
      <PageMeta title="User Management" description="User management page" />

      <div
        className="rounded-2xl border border-gray-200 bg-white pt-4 dark:border-white/[0.05] dark:bg-white/[0.03]"
        onClick={() => setActiveMenuId(null)}
      >
        {/* HEADER */}
        <div className="mb-4 flex flex-col gap-2 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Users
          </h3>

          <Button
            size="md"
            variant="primary"
            startIcon={<PlusIcon className="size-5 text-white" />}
            onClick={() => setIsOpen(true)}
          >
            Create User
          </Button>
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
                {users.map((u) => (
                  <tr key={u.user_id}>
                    <td className="px-4 py-4 font-medium text-theme-sm text-gray-700 dark:text-gray-400">
                      {u.user_name}
                    </td>
                    <td className="px-4 py-4 text-theme-sm text-gray-700 dark:text-gray-400">
                      {u.email}
                    </td>
                    <td className="px-4 py-4 text-theme-sm  text-gray-700 dark:text-gray-400">
                      {u.system_role}
                    </td>
                    <td className="px-4 py-4 text-theme-sm  text-gray-700 dark:text-gray-400">
                      {u.department}
                    </td>
                    <td className="px-4 py-4 text-theme-sm  text-gray-700 dark:text-gray-400">
                      {u.created_at}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-theme-xs font-medium ${
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

      {/* MODAL */}
      <AddUserCard isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
