import { useEffect, useRef, useState } from "react";
import API from "../../api";
import { Filter, PlusIcon } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { useNavigate } from "react-router-dom";
import ComponentCard from "../../components/common/ComponentCard";
import { useAuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";
import CreateTicketModal from "./../AddTicketCard";

/* =======================
   CONSTANTS
======================= */
const TICKET_TYPE_MAP: Record<string, string> = {
  TYPE1: "Dashboard Access Request",
  TYPE2: "User Account Management",
  TYPE3: "Dashboard Development Request",
};

const statusColorMap: Record<string, "success" | "warning" | "error" | "info"> =
  {
    DONE: "success",
    RESOLVED: "success",
    APPROVED: "info",
    IN_PROGRESS: "info",
    CREATED: "warning",
    REJECTED: "error",
    CANCELLED: "error",
  };

const PAGE_SIZE = 10;

/* =======================
   TYPES
======================= */
interface Department {
  department_id: string;
  department_name: string;
  status: string;
}

interface User {
  user_id: string;
  username: string;
  email: string;
  role: string;
  department: Department;
  createdAt: string;
  status: string;
}

interface Ticket {
  ticket_id: string;
  requester: User;
  type: string;
  description: string;
  status:
    | "CREATED"
    | "APPROVED"
    | "IN_PROGRESS"
    | "RESOLVED"
    | "REJECTED"
    | "CANCELLED"
    | "DONE";
  assigned_staff: User | null;
  approver: User | null;
  createdAt: string;
  updatedAt: string;
}

interface FilterValue {
  type: string;
  status: string;
}

/* =======================
   MAIN PAGE
======================= */
export default function TicketListManager() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<FilterValue>({ type: "", status: "" });
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* Close filter on outside click */
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

  /* Fetch tickets từ cả 2 API: approver + requester */
  const fetchTickets = async () => {
    if (!user?.user_id) return;
    try {
      const [approverRes, requesterRes] = await Promise.all([
        API.get(`/tickets/approver/${user.user_id}`),
        API.get(`/tickets/requester/${user.user_id}`),
      ]);

      const approverTickets: Ticket[] = approverRes.data.data ?? [];
      const requesterTickets: Ticket[] = requesterRes.data.data ?? [];

      // Merge + dedup theo ticket_id
      const merged = [...approverTickets, ...requesterTickets].reduce(
        (acc, ticket) => {
          if (!acc.find((t) => t.ticket_id === ticket.ticket_id)) {
            acc.push(ticket);
          }
          return acc;
        },
        [] as Ticket[],
      );

      setTickets(
        merged.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [user?.user_id]);

  const handleSuccess = () => {
    fetchTickets();
    toast.success("Ticket created successfully!", {
      duration: 3000,
      position: "top-right",
    });
  };

  const handleFilterChange = (updated: Partial<FilterValue>) => {
    setFilter((prev) => ({ ...prev, ...updated }));
    setPage(1);
  };

  /* Filter + Pagination */
  const filteredTickets = tickets.filter((t) => {
    const typeMatch = !filter.type || t.type === filter.type;
    const statusMatch = !filter.status || t.status === filter.status;
    return typeMatch && statusMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const paginatedTickets = filteredTickets.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  /* Stats */
  const totalTickets = tickets.length;
  const activeTickets = tickets.filter((t) =>
    ["CREATED", "APPROVED", "IN_PROGRESS"].includes(t.status),
  ).length;
  const resolvedTickets = tickets.filter((t) =>
    ["RESOLVED", "DONE"].includes(t.status),
  ).length;
  const closedTickets = tickets.filter((t) =>
    ["REJECTED", "CANCELLED"].includes(t.status),
  ).length;

  return (
    <div>
      <PageMeta
        title="Ticket Management | Manager"
        description="Review and approve tickets"
      />

      <CreateTicketModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
        allowedTypes={["TYPE2"]}
      />

      {/* STATS */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
        <ComponentCard title="Total Tickets">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            {totalTickets.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            All tickets
          </p>
        </ComponentCard>

        <ComponentCard title="In Progress">
          <h3 className="text-2xl font-bold text-brand-500">
            {activeTickets.toLocaleString()}
          </h3>
          <div className="mt-1 flex flex-wrap gap-1">
            {(["CREATED", "APPROVED", "IN_PROGRESS"] as const).map((s) => (
              <span
                key={s}
                className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
              >
                {s.replace("_", " ")}
                <span className="ml-1 font-bold">
                  {tickets.filter((t) => t.status === s).length}
                </span>
              </span>
            ))}
          </div>
        </ComponentCard>

        <ComponentCard title="Completed">
          <h3 className="text-2xl font-bold text-success-500">
            {resolvedTickets.toLocaleString()}
          </h3>
          <div className="mt-1 flex flex-wrap gap-1">
            {(["RESOLVED", "DONE"] as const).map((s) => (
              <span
                key={s}
                className="inline-flex items-center rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-600 dark:bg-success-500/10 dark:text-success-400"
              >
                {s}
                <span className="ml-1 font-bold">
                  {tickets.filter((t) => t.status === s).length}
                </span>
              </span>
            ))}
          </div>
        </ComponentCard>

        <ComponentCard title="Closed">
          <h3 className="text-2xl font-bold text-error-500">
            {closedTickets.toLocaleString()}
          </h3>
          <div className="mt-1 flex flex-wrap gap-1">
            {(["REJECTED", "CANCELLED"] as const).map((s) => (
              <span
                key={s}
                className="inline-flex items-center rounded-full bg-error-50 px-2 py-0.5 text-xs font-medium text-error-600 dark:bg-error-500/10 dark:text-error-400"
              >
                {s}
                <span className="ml-1 font-bold">
                  {tickets.filter((t) => t.status === s).length}
                </span>
              </span>
            ))}
          </div>
        </ComponentCard>
      </div>

      {/* TABLE CARD */}
      <div className="rounded-2xl border border-gray-200 bg-white pt-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
        {/* HEADER */}
        <div className="mb-4 flex flex-col gap-3 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              My Tickets
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tickets you submitted or need to review
            </p>
          </div>

          <div className="flex gap-3">
            {/* Filter */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/[0.03]"
              >
                <Filter size={18} />
                Filter
                {(filter.type || filter.status) && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-xs text-white">
                    {[filter.type, filter.status].filter(Boolean).length}
                  </span>
                )}
              </button>

              {filterOpen && (
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  <div className="mb-4">
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Ticket Type
                    </label>
                    <select
                      value={filter.type}
                      onChange={(e) =>
                        handleFilterChange({ type: e.target.value })
                      }
                      className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    >
                      <option value="">All</option>
                      <option value="TYPE1">Dashboard Access Request</option>
                      <option value="TYPE2">User Account Management</option>
                      <option value="TYPE3">
                        Dashboard Development Request
                      </option>
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
                      <option value="CREATED">Created</option>
                      <option value="APPROVED">Approved</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="DONE">Done</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleFilterChange({ type: "", status: "" });
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

            {/* Create Ticket — chỉ TYPE2 */}
            <Button
              size="md"
              variant="primary"
              startIcon={<PlusIcon className="size-5 text-white" />}
              onClick={() => setIsOpen(true)}
            >
              Create Ticket
            </Button>
          </div>
        </div>

        {/* TABLE */}
        <div className="max-w-full overflow-x-auto px-5 sm:px-6">
          <Table>
            <TableHeader className="border-y border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-start text-theme-xs text-gray-500"
                >
                  Requested By
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-start text-theme-xs text-gray-500"
                >
                  Type
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-start text-theme-xs text-gray-500"
                >
                  Description
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-start text-theme-xs text-gray-500"
                >
                  Department
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-start text-theme-xs text-gray-500"
                >
                  Created
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-start text-theme-xs text-gray-500"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-right text-theme-xs text-gray-500"
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {paginatedTickets.length === 0 ? (
                <TableRow>
                  <TableCell className="px-4 py-10 text-center text-sm text-gray-400">
                    No tickets found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTickets.map((ticket) => {
                  const isOwnTicket =
                    ticket.requester?.user_id === user?.user_id;
                  const needsReview =
                    !isOwnTicket && ticket.status === "CREATED";

                  return (
                    <TableRow
                      key={ticket.ticket_id}
                      className={
                        needsReview
                          ? "bg-warning-50/40 dark:bg-warning-500/5"
                          : ""
                      }
                    >
                      <TableCell className="px-4 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-gray-800 dark:text-white">
                              {ticket.requester?.username}
                            </span>
                            {isOwnTicket && (
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {ticket.requester?.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {TICKET_TYPE_MAP[ticket.type] ?? ticket.type}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm text-gray-500 max-w-[180px] truncate">
                        {ticket.description}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {ticket.requester?.department?.department_name ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm text-gray-500">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Badge
                            size="sm"
                            color={statusColorMap[ticket.status] ?? "info"}
                          >
                            {ticket.status.replace("_", " ")}
                          </Badge>
                          {needsReview && (
                            <span className="flex h-2 w-2 rounded-full bg-warning-500 animate-pulse" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right">
                        <Button
                          size="sm"
                          variant={needsReview ? "primary" : "outline"}
                          onClick={() => {
                            if (isOwnTicket) {
                              // Ticket do mình tạo → xem tiến trình như staff
                              navigate(`/ticket/${ticket.ticket_id}`);
                            } else {
                              // Ticket cần review → trang approve của manager
                              navigate(`/manager/ticket/${ticket.ticket_id}`);
                            }
                          }}
                        >
                          {needsReview ? "Review" : "View"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* PAGINATION */}
        <div className="border-t border-gray-200 px-6 py-4 dark:border-white/[0.05]">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {filteredTickets.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
              </span>{" "}
              –{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {Math.min(page * PAGE_SIZE, filteredTickets.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {filteredTickets.length}
              </span>{" "}
              tickets
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
    </div>
  );
}
