import { useEffect, useRef, useState } from "react";
import API from "../../api";
import { Filter, X, Loader2, Send } from "lucide-react";
import ComponentCard from "../../components/common/ComponentCard";
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
import toast from "react-hot-toast";

/* =======================
   CONSTANTS
======================= */
const TICKET_TYPE_MAP: Record<string, string> = {
  TYPE1: "Dashboard Access Request",
  TYPE2: "User Account Management",
  TYPE3: "Dashboard Development Request",
};

const statusColorMap: Record<string, "success" | "warning" | "error" | "info"> = {
  SOLVED: "success",
  APPROVED: "success",
  PENDING: "warning",
  CREATED: "info",
  REJECTED: "error",
};

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
  reason: string;
  status: "CREATED" | "PENDING" | "APPROVED" | "REJECTED" | "SOLVED";
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
   TICKET DETAIL MODAL
======================= */
interface TicketDetailModalProps {
  ticket: Ticket;
  biStaffs: User[];
  onClose: () => void;
  onAssigned: () => void;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <li className="flex gap-4 py-2.5">
      <span className="w-1/3 text-sm text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
      <span className="w-2/3 text-sm text-gray-700 dark:text-gray-300">{value}</span>
    </li>
  );
}

function TicketDetailModal({ ticket, biStaffs, onClose, onAssigned }: TicketDetailModalProps) {
  const [selectedStaff, setSelectedStaff] = useState(ticket.assigned_staff?.user_id ?? "");
  const [assigning, setAssigning] = useState(false);

  const isAlreadyAssigned = !!ticket.assigned_staff;

  const handleAssign = async () => {
    if (!selectedStaff) {
      toast.error("Please select a BI staff member.");
      return;
    }
    try {
      setAssigning(true);
      await API.post(`/tickets/${ticket.ticket_id}/assign/${selectedStaff}`);
      toast.success("Ticket assigned successfully!");
      onAssigned();
      onClose();
    } catch (error) {
      console.error("Assign error:", error);
      toast.error("Failed to assign ticket.");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Ticket Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Ticket Info */}
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            <DetailRow
              label="Ticket ID"
              value={<span className="font-mono text-xs">{ticket.ticket_id}</span>}
            />
            <DetailRow
              label="Requester"
              value={
                <div className="flex flex-col">
                  <span className="font-medium">{ticket.requester?.username}</span>
                  <span className="text-xs text-gray-500">{ticket.requester?.email}</span>
                </div>
              }
            />
            <DetailRow
              label="Department"
              value={ticket.requester?.department?.department_name ?? "—"}
            />
            <DetailRow
              label="Ticket Type"
              value={<span className="font-medium">{TICKET_TYPE_MAP[ticket.type] ?? ticket.type}</span>}
            />
            <DetailRow
              label="Description"
              value={<span className="whitespace-pre-wrap">{ticket.description}</span>}
            />
            <DetailRow
              label="Status"
              value={
                <Badge size="sm" color={statusColorMap[ticket.status] ?? "info"}>
                  {ticket.status}
                </Badge>
              }
            />
            <DetailRow
              label="Approver"
              value={
                ticket.approver ? (
                  <div className="flex flex-col">
                    <span className="font-medium">{ticket.approver.username}</span>
                    <span className="text-xs text-gray-500">{ticket.approver.email}</span>
                  </div>
                ) : (
                  <span className="text-gray-400">Not approved yet</span>
                )
              }
            />
            <DetailRow
              label="Assigned Staff"
              value={
                ticket.assigned_staff ? (
                  <div className="flex flex-col">
                    <span className="font-medium">{ticket.assigned_staff.username}</span>
                    <span className="text-xs text-gray-500">{ticket.assigned_staff.email}</span>
                  </div>
                ) : (
                  <span className="text-gray-400">Not assigned yet</span>
                )
              }
            />
          
            {ticket.reason && (
              <DetailRow
                label="Reason"
                value={<span className="text-error-500">{ticket.reason}</span>}
              />
            )}
          </ul>

          {/* Assign Section */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-white/[0.02]">
            <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
              Assign to BI Staff
            </h4>

            {ticket.status === "REJECTED" || ticket.status === "SOLVED" ? (
              <p className="text-sm text-gray-400">
                This ticket is <span className="font-medium">{ticket.status.toLowerCase()}</span> and cannot be reassigned.
              </p>
            ) : (
              <div className="flex gap-3">
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="flex-1 h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  <option value="">-- Select BI Staff --</option>
                  {biStaffs.map((s) => (
                    <option key={s.user_id} value={s.user_id}>
                      {s.username} — {s.email}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleAssign}
                  disabled={!selectedStaff || assigning}
                  className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition"
                >
                  {assigning ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  {assigning ? "Assigning..." : isAlreadyAssigned ? "Reassign" : "Assign"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =======================
   MAIN PAGE
======================= */
export default function TicketListBI() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<FilterValue>({ type: "", status: "" });
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [biStaffs, setBiStaffs] = useState<User[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await API.get("/tickets");
      setTickets(
        response.data.data.sort(
          (a: Ticket, b: Ticket) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const fetchBIStaffs = async () => {
    try {
      const response = await API.get("/users");
      const all: User[] = response.data.data;
      setBiStaffs(all.filter((u) => u.role === "BI" && u.status === "ACTIVE"));
    } catch (error) {
      console.error("Fetch BI staffs error:", error);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchBIStaffs();
  }, []);

  const handleFilterChange = (updated: Partial<FilterValue>) => {
    setFilter((prev) => ({ ...prev, ...updated }));
    setPage(1);
  };

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

  const totalTickets = tickets.length;
  const pendingTickets = tickets.filter((t) => t.status === "PENDING").length;
  const rejectedTickets = tickets.filter((t) => t.status === "REJECTED").length;
  const solvedTickets = tickets.filter((t) => t.status === "SOLVED").length;

  return (
    <div>
      {/* TICKET DETAIL MODAL */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          biStaffs={biStaffs}
          onClose={() => setSelectedTicket(null)}
          onAssigned={fetchTickets}
        />
      )}

      <PageMeta
        title="Support Ticket | BI Dashboard"
        description="Manage and track customer support tickets"
      />

      {/* STATS */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
        <ComponentCard title="Total Tickets">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            {totalTickets.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">All support tickets</p>
        </ComponentCard>
        <ComponentCard title="Pending Tickets">
          <h3 className="text-2xl font-bold text-warning-500">
            {pendingTickets.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Waiting for response</p>
        </ComponentCard>
        <ComponentCard title="Solved Tickets">
          <h3 className="text-2xl font-bold text-success-500">
            {solvedTickets.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Successfully resolved</p>
        </ComponentCard>
        <ComponentCard title="Rejected Tickets">
          <h3 className="text-2xl font-bold text-error-500">
            {rejectedTickets.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Rejected</p>
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
                      onChange={(e) => handleFilterChange({ type: e.target.value })}
                      className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    >
                      <option value="">All</option>
                      <option value="TYPE1">Dashboard Access Request</option>
                      <option value="TYPE2">User Account Management</option>
                      <option value="TYPE3">Dashboard Development Request</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </label>
                    <select
                      value={filter.status}
                      onChange={(e) => handleFilterChange({ status: e.target.value })}
                      className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    >
                      <option value="">All</option>
                      <option value="CREATED">Created</option>
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="SOLVED">Solved</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => { handleFilterChange({ type: "", status: "" }); setFilterOpen(false); }}
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
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden">
          <div className="max-w-full overflow-x-auto px-5 sm:px-6">
            <Table>
              <TableHeader className="border-y border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-4 py-3 text-start text-theme-xs text-gray-500">Requested By</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-start text-theme-xs text-gray-500">Type</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-start text-theme-xs text-gray-500">Description</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-start text-theme-xs text-gray-500">Assigned Staff</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-start text-theme-xs text-gray-500">Created</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-start text-theme-xs text-gray-500">Status</TableCell>
                  <TableCell isHeader className="px-4 py-3 text-right text-theme-xs text-gray-500">Action</TableCell>
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
                  paginatedTickets.map((ticket) => (
                    <TableRow key={ticket.ticket_id}>
                      <TableCell className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800 dark:text-white">
                            {ticket.requester?.username}
                          </span>
                          <span className="text-xs text-gray-500">{ticket.requester?.email}</span>
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
                        <Badge size="sm" color={statusColorMap[ticket.status] ?? "info"}>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* PAGINATION */}
        <div className="border-t border-gray-200 px-6 py-4 dark:border-white/[0.05]">
          <div className="flex flex-1 justify-between sm:hidden">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
              className="rounded-lg bg-white px-4 py-3 text-sm ring-1 ring-gray-300 disabled:opacity-40 dark:bg-gray-800 dark:ring-gray-700">
              Previous
            </button>
            <span className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
              className="rounded-lg bg-white px-4 py-3 text-sm ring-1 ring-gray-300 disabled:opacity-40 dark:bg-gray-800 dark:ring-gray-700">
              Next
            </button>
          </div>

          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {filteredTickets.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
              </span>{" "}–{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {Math.min(page * PAGE_SIZE, filteredTickets.length)}
              </span>{" "}of{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {filteredTickets.length}
              </span>{" "}tickets
            </p>

            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="rounded-lg bg-white px-4 py-2.5 text-sm ring-1 ring-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:bg-gray-800 dark:ring-gray-700">
                Previous
              </button>
              <ul className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <li key={p}>
                    <button onClick={() => setPage(p)}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition ${
                        page === p ? "bg-brand-500 text-white" : "text-gray-700 hover:bg-brand-500/10 dark:text-gray-400"
                      }`}>
                      {p}
                    </button>
                  </li>
                ))}
              </ul>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                className="rounded-lg bg-white px-4 py-2.5 text-sm ring-1 ring-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:bg-gray-800 dark:ring-gray-700">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}