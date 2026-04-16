/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import API from "../../api";
import { PlusIcon, Filter } from "lucide-react";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import toast from "react-hot-toast";
import { useAuthContext } from "../../context/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import CreateTicketModal from "./../AddTicketCard";
import ReviewTicketModal from "../Manager/ReviewTicketModal";
import { useNavigate } from "react-router-dom";
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
  VERIFIED: "success",
  APPROVED: "success",
  IN_PROGRESS: "info",
  WAITING_FOR_VERIFICATION: "warning",
  CREATED: "warning",
  REJECTED: "error",
  CANCELLED: "error",
};

const ACTIVE_STATUSES = ["CREATED", "APPROVED", "IN_PROGRESS", "WAITING_FOR_VERIFICATION", "VERIFIED"] as const;
const COMPLETED_STATUSES = ["RESOLVED", "DONE"] as const;
const CLOSED_STATUSES = ["REJECTED", "CANCELLED"] as const;

const PAGE_SIZE = 10;

/* =======================
   TYPES
======================= */
interface Department {
  department_id: string;
  department_name: string;
  status: "ACTIVE" | "INACTIVE";
}

interface User {
  user_id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  department: Department;
  status: "ACTIVE" | "INACTIVE";
}

interface Ticket {
  ticket_id: string;
  requester: User;
  type: string;
  description: string;
  dashboard_id: string;
  status:
  | "CREATED"
  | "APPROVED"
  | "IN_PROGRESS"
  | "WAITING_FOR_VERIFICATION"
  | "VERIFIED"
  | "RESOLVED"
  | "REJECTED"
  | "CANCELLED"
  | "DONE";
  assigned_staff: User;
  approver: User;
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
export default function SupportTicketPage() {
  const { user, isManager } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [reviewTicketId, setReviewTicketId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<FilterValue>({ type: "", status: "" });
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const fetchTickets = async () => {
    if (!user?.user_id) return;
    try {
      // Luôn fetch requester
      const requesterRes = await API.get(`/tickets/requester/${user.user_id}`);
      let allTickets: Ticket[] = requesterRes.data.data ?? [];
      // Nếu là manager → fetch thêm approver và merge
      if (isManager) {
        const approverRes = await API.get(`/tickets/approver/${user.user_id}`);
        const approverTickets: Ticket[] = approverRes.data.data ?? [];

        // Merge + dedup
        const map = new Map<string, Ticket>();
        [...allTickets, ...approverTickets].forEach((t) => {
          map.set(t.ticket_id, t);
        });
        allTickets = Array.from(map.values());
      }

      setTickets(
        allTickets.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  // Thêm isManager vào dependency
  useEffect(() => {
    fetchTickets();
  }, [user?.user_id, isManager]);

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
    ACTIVE_STATUSES.includes(t.status as any),
  ).length;
  const resolvedTickets = tickets.filter((t) =>
    COMPLETED_STATUSES.includes(t.status as any),
  ).length;
  const closedCount = tickets.filter((t) =>
    CLOSED_STATUSES.includes(t.status as any),
  ).length;

  let allowedTypes: string[] | undefined = undefined;
  if (!user?.department) {
    allowedTypes = ["TYPE2"];
  } else if (isManager) {
    allowedTypes = ["TYPE2"];
  }

  return (
    <div>
      <CreateTicketModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
        allowedTypes={allowedTypes}
      />
      <ReviewTicketModal
        isOpen={!!reviewTicketId}
        onClose={() => setReviewTicketId(null)}
        ticketId={reviewTicketId}
        onSuccess={() => {
          fetchTickets();
          setReviewTicketId(null);
        }}
      />

      <PageMeta
        title="Support Ticket"
        description="Manage and track customer support tickets"
      />
      {/* STATS */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
        <ComponentCard title="Total Tickets">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            {totalTickets.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            All your tickets
          </p>
        </ComponentCard>

        <ComponentCard title="In Progress">
          <h3 className="text-2xl font-bold text-brand-500">
            {activeTickets.toLocaleString()}
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ACTIVE_STATUSES.map((s) => (
              <span
                key={s}
                className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
              >
                {s.replace(/_/g, " ")}
                <span className="ml-1.5 font-bold opacity-80 border-l border-brand-200 dark:border-brand-800 pl-1.5">
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
          <div className="mt-2 flex flex-wrap gap-1.5">
            {COMPLETED_STATUSES.map((s) => (
              <span
                key={s}
                className="inline-flex items-center rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-600 dark:bg-success-500/10 dark:text-success-400"
              >
                {s}
                <span className="ml-1.5 font-bold opacity-80 border-l border-success-200 dark:border-success-800 pl-1.5">
                  {tickets.filter((t) => t.status === s).length}
                </span>
              </span>
            ))}
          </div>
        </ComponentCard>

        <ComponentCard title="Closed">
          <h3 className="text-2xl font-bold text-error-500">
            {closedCount.toLocaleString()}
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {CLOSED_STATUSES.map((s) => (
              <span
                key={s}
                className="inline-flex items-center rounded-full bg-error-50 px-2 py-0.5 text-xs font-medium text-error-600 dark:bg-error-500/10 dark:text-error-400"
              >
                {s}
                <span className="ml-1.5 font-bold opacity-80 border-l border-error-200 dark:border-error-800 pl-1.5">
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
              Support Tickets
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your most recent support tickets list
            </p>
          </div>

          <div className="flex gap-3">
            {/* Search */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 fill-gray-400"
                width="16"
                height="16"
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
                placeholder="Search requester, description..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-11 w-[220px] rounded-lg border border-gray-300 bg-white pl-9 pr-4 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
              />
            </div>
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
                      className="h-10 flex-1 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-white/[0.03] transition"
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

            {/* Create Button */}
            <Button
              size="md"
              variant="primary"
              startIcon={<PlusIcon className="size-5 text-white" />}
              onClick={() => {
                const unresolvedOwnTickets = tickets.filter(
                  (t) =>
                    t.requester?.user_id === user?.user_id &&
                    !["DONE", "REJECTED", "CANCELLED"].includes(t.status)
                ).length;

                if (unresolvedOwnTickets >= 3) {
                  toast.error("You have 3 or more active tickets. Please mark resolved tickets as DONE or wait for processing to create new ones.");
                  return;
                }
                setIsOpen(true);
              }}
            >
              Create Ticket
            </Button>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden">
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
                    Assigned Staff
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
                      isManager && !isOwnTicket && ticket.status === "CREATED";
                    return (
                      <TableRow key={ticket.ticket_id}>
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
                        <TableCell className="px-4 py-4 text-sm text-gray-500 max-w-[200px] truncate">
                          {ticket.description}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-800 dark:text-white">
                              {ticket.assigned_staff?.username ?? "—"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {ticket.assigned_staff?.email}
                            </span>
                          </div>
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
                              {ticket.status.replace(/_/g, " ")}
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
                              if (isManager && !isOwnTicket) {
                                setReviewTicketId(ticket.ticket_id);
                              } else {
                                navigate(`/ticket/${ticket.ticket_id}`); // trang timeline
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
                        className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition ${page === p
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
