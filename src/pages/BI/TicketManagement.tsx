import { useEffect, useRef, useState } from "react";
import API from "../../api";
import { X, Loader2, Send, Search } from "lucide-react";
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
import DatePicker from "../../components/form/date-picker";

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
  APPROVED: "info",
  IN_PROGRESS: "warning",
  WAITING_FOR_VERIFICATION: "warning",
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
  status:
  | "CREATED"
  | "APPROVED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "WAITING_FOR_VERIFICATION"
  | "VERIFIED"
  | "REJECTED"
  | "CANCELLED"
  | "DONE";
  assigned_staff: User | null;
  approver: User | null;
  createdAt: string;
  updatedAt: string;
  deadline?: string;
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

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <li className="flex gap-4 py-2.5">
      <span className="w-1/3 text-sm text-gray-500 dark:text-gray-400 shrink-0">
        {label}
      </span>
      <span className="w-2/3 text-sm text-gray-700 dark:text-gray-300">
        {value}
      </span>
    </li>
  );
}

function CustomTimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Disabled manual typing
  };

  const handleSelect = (type: "hour" | "minute", val: string) => {
    const [h, m] = (inputValue || "00:00").split(":");
    let newH = h || "00";
    let newM = m || "00";
    if (type === "hour") newH = val;
    if (type === "minute") newM = val;

    const newVal = `${newH}:${newM}`;
    setInputValue(newVal);
    onChange(newVal);
  };

  return (
    <div className="relative flex-1 min-w-[130px]" ref={containerRef}>
      <div
        onClick={() => setIsOpen(true)}
        className="cursor-pointer"
      >
        <input
          type="text"
          value={inputValue}
          readOnly
          placeholder="HH:mm"
          className="h-10 w-full rounded-lg border appearance-none px-3 py-2 text-sm shadow-theme-xs outline-none focus:ring-3 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 cursor-pointer caret-transparent"
        />
      </div>

      {isOpen && (
        <div className="absolute z-[99999] bottom-full mb-2 w-[200px] rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900 p-3 flex gap-2">
          {/* Hours Column */}
          <div className="flex-1 border-r border-gray-100 dark:border-gray-800 pr-2">
            <h4 className="text-xs font-semibold mb-2 text-gray-500 dark:text-gray-400 text-center">
              Hour
            </h4>
            <ul className="max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
              {Array.from({ length: 24 }).map((_, i) => {
                const val = i.toString().padStart(2, "0");
                const isSelected = inputValue.split(":")[0] === val;
                return (
                  <li
                    key={`h-${val}`}
                    onClick={() => handleSelect("hour", val)}
                    className={`cursor-pointer rounded-lg px-2 py-1.5 text-center text-sm transition-colors ${isSelected
                        ? "bg-brand-500 text-white font-medium"
                        : "hover:bg-gray-100 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      }`}
                  >
                    {val}
                  </li>
                );
              })}
            </ul>
          </div>
          {/* Minutes Column */}
          <div className="flex-1 pl-1">
            <h4 className="text-xs font-semibold mb-2 text-gray-500 dark:text-gray-400 text-center">
              Minute
            </h4>
            <ul className="max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
              {Array.from({ length: 60 }).map((_, i) => {
                const val = i.toString().padStart(2, "0");
                const isSelected = inputValue.split(":")[1] === val;
                return (
                  <li
                    key={`m-${val}`}
                    onClick={() => handleSelect("minute", val)}
                    className={`cursor-pointer rounded-lg px-2 py-1.5 text-center text-sm transition-colors ${isSelected
                        ? "bg-brand-500 text-white font-medium"
                        : "hover:bg-gray-100 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      }`}
                  >
                    {val}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function TicketDetailModal({
  ticket,
  biStaffs,
  onClose,
  onAssigned,
}: TicketDetailModalProps) {
  const [selectedStaff, setSelectedStaff] = useState(
    ticket.assigned_staff?.user_id ?? "",
  );
  const [deadlineDate, setDeadlineDate] = useState<string>("");
  const [deadlineTime, setDeadlineTime] = useState<string>("00:00");
  const [assigning, setAssigning] = useState(false);
  const [activeCount, setActiveCount] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedStaff) {
      setActiveCount(null);
      return;
    }
    const fetchActiveCount = async () => {
      try {
        const res = await API.get(`/tickets/assigned/${selectedStaff}/status/IN_PROGRESS`);
        const count = res.data?.data?.length || 0;
        setActiveCount(count);
      } catch (err) {
        console.error("Failed to fetch active tickets count:", err);
      }
    };
    fetchActiveCount();
  }, [selectedStaff]);

  const isAlreadyAssigned = !!ticket.assigned_staff;

  const handleAssign = async () => {
    if (!selectedStaff) {
      toast.error("Please select a BI staff member.");
      return;
    }
    if (!deadlineDate) {
      toast.error("Please select a date for the deadline.");
      return;
    }
    try {
      setAssigning(true);

      const deadlineDateTime = new Date(`${deadlineDate}T${deadlineTime}:00`);
      if (deadlineDateTime <= new Date()) {
        toast.error("Please select a future date and time.");
        setAssigning(false);
        return;
      }

      // Check current assigned tickets (IN_PROGRESS)
      const res = await API.get(`/tickets/assigned/${selectedStaff}/status/IN_PROGRESS`);
      const activeTickets = res.data?.data || [];
      if (activeTickets.length >= 5) {
        toast.error("This BI staff is already handling 5 or more tickets. Please assign to someone else.");
        setAssigning(false);
        return;
      }

      await API.post(`/tickets/assign-ticket`, {
        ticketId: ticket.ticket_id,
        assigneeId: selectedStaff,
        deadline: `${deadlineDate}T${deadlineTime}:00`,
      });
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
              label="Requester"
              value={
                <div className="flex flex-col">
                  <span className="font-medium">
                    {ticket.requester?.username}
                  </span>
                  <span className="text-xs text-gray-500">
                    {ticket.requester?.email}
                  </span>
                </div>
              }
            />
            <DetailRow
              label="Department"
              value={ticket.requester?.department?.department_name ?? "—"}
            />
            <DetailRow
              label="Ticket Type"
              value={
                <span className="font-medium">
                  {TICKET_TYPE_MAP[ticket.type] ?? ticket.type}
                </span>
              }
            />
            <DetailRow
              label="Description"
              value={
                <span className="whitespace-pre-wrap">
                  {ticket.description}
                </span>
              }
            />
            <DetailRow
              label="Status"
              value={
                <Badge
                  size="sm"
                  color={statusColorMap[ticket.status] ?? "info"}
                >
                  {ticket.status}
                </Badge>
              }
            />
            <DetailRow
              label="Approver"
              value={
                ticket.approver ? (
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {ticket.approver.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {ticket.approver.email}
                    </span>
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
                    <span className="font-medium">
                      {ticket.assigned_staff.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {ticket.assigned_staff.email}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400">Not assigned yet</span>
                )
              }
            />

            {ticket.deadline && (
              <DetailRow
                label="Deadline"
                value={
                  <span className="font-semibold text-brand-600 dark:text-brand-400">
                    {new Date(ticket.deadline).toLocaleString()}
                  </span>
                }
              />
            )}
            {ticket.reason && (
              <DetailRow
                label="Reason"
                value={<span className="text-error-500">{ticket.reason}</span>}
              />
            )}
          </ul>

          {/* Assign Section */}
          {/* Assign Section */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-white/[0.02]">
            <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
              Assign to BI Staff
            </h4>

            {["VERIFIED", "RESOLVED", "DONE", "REJECTED", "CANCELLED"].includes(
              ticket.status,
            ) ? (
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This ticket is{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {ticket.status.replace("_", " ").toLowerCase()}
                  </span>{" "}
                  and cannot be reassigned.
                </p>
                {ticket.assigned_staff && (
                  <p className="mt-1 text-xs text-gray-400">
                    Final assignee:{" "}
                    <span className="font-medium">
                      {ticket.assigned_staff.username}
                    </span>{" "}
                    — {ticket.assigned_staff.email}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Hint nếu đã assign */}
                {ticket.assigned_staff && (
                  <div className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 dark:border-brand-900 dark:bg-brand-900/20">
                    <p className="text-xs text-brand-600 dark:text-brand-400">
                      Currently assigned to{" "}
                      <span className="font-semibold">
                        {ticket.assigned_staff.username}
                      </span>{" "}
                      — you can reassign to a different BI staff.
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <select
                      value={selectedStaff}
                      onChange={(e) => setSelectedStaff(e.target.value)}
                      className="h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      <option value="">-- Select BI Staff --</option>
                      {biStaffs.map((s) => (
                        <option key={s.user_id} value={s.user_id}>
                          {s.username} — {s.email}
                        </option>
                      ))}
                    </select>
                    {activeCount !== null && (
                      <p className={`text-xs ml-1 ${activeCount >= 5 ? 'text-error-500 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                        {activeCount >= 5 ? '⚠️ ' : ''}Currently assigned {activeCount} IN_PROGRESS ticket(s)
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-[2]">
                      <DatePicker
                        id={`deadline-date-${ticket.ticket_id}`}
                        placeholder="Select Date"
                        onChange={(_, dateStr) => setDeadlineDate(dateStr as string)}
                      />
                    </div>
                    <CustomTimePicker
                      value={deadlineTime}
                      onChange={(v) => setDeadlineTime(v)}
                    />

                    <button
                      onClick={handleAssign}
                      disabled={
                        !selectedStaff ||
                        !deadlineDate ||
                        assigning ||
                        selectedStaff === ticket.assigned_staff?.user_id
                      }
                      className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition"
                    >
                      {assigning ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                      {assigning
                        ? "Assigning..."
                        : isAlreadyAssigned
                          ? "Reassign"
                          : "Assign"}
                    </button>
                  </div>
                </div>

                {selectedStaff === ticket.assigned_staff?.user_id &&
                  selectedStaff && (
                    <p className="text-xs text-gray-400">
                      This staff is already assigned. Select a different one to
                      reassign.
                    </p>
                  )}
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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [biStaffs, setBiStaffs] = useState<User[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
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
    try {
      const [type1Res, type3Res] = await Promise.all([
        API.get("/tickets/type/TYPE1"),
        API.get("/tickets/type/TYPE3"),
      ]);

      const type1: Ticket[] = type1Res.data.data ?? [];
      const type3: Ticket[] = type3Res.data.data ?? [];

      // Ẩn các ticket vừa tạo (CREATED), chỉ lấy các ticket có status khác CREATED
      const merged = [...type1, ...type3]
        .filter((t) => t.status !== "CREATED")
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

      setTickets(merged);
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
    const q = search.toLowerCase();
    const searchMatch =
      !q ||
      t.requester?.username?.toLowerCase().includes(q) ||
      t.requester?.email?.toLowerCase().includes(q);
    return typeMatch && statusMatch && searchMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const paginatedTickets = filteredTickets.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const totalTickets = tickets.length;
  const approvedTickets = tickets.filter((t) => t.status === "APPROVED").length;
  const inProgressTickets = tickets.filter(
    (t) => t.status === "IN_PROGRESS",
  ).length;
  const solvedTickets = tickets.filter(
    (t) => t.status === "RESOLVED" || t.status === "DONE",
  ).length;
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
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Approved tickets
          </p>
        </ComponentCard>
        <ComponentCard title="Approved">
          <h3 className="text-2xl font-bold text-info-500">
            {approvedTickets.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Awaiting assignment
          </p>
        </ComponentCard>
        <ComponentCard title="In Progress">
          <h3 className="text-2xl font-bold text-warning-500">
            {inProgressTickets.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Being processed
          </p>
        </ComponentCard>
        <ComponentCard title="Solved">
          <h3 className="text-2xl font-bold text-success-500">
            {solvedTickets.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
        </ComponentCard>
      </div>

      {/* TABLE CARD */}
      <div className="rounded-2xl border border-gray-200 bg-white pt-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
        {/* HEADER */}
        <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Support Tickets
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your most recent support tickets list
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
                <Search size={15} />
              </span>
              <input
                type="text"
                placeholder="Search requester, email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-4 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 sm:w-[200px]"
              />
            </div>

            {/* Type tabs (Chips) - Like Logs Action */}
            <div className="hidden h-10 items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 sm:inline-flex dark:bg-gray-900">
              <button
                onClick={() => handleFilterChange({ type: "" })}
                className={`h-9 rounded-md px-3 text-xs font-medium transition ${!filter.type ? "bg-white shadow-sm text-gray-900 dark:bg-gray-800 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
              >
                All Types
              </button>
              <button
                onClick={() => handleFilterChange({ type: "TYPE1" })}
                className={`h-9 rounded-md px-3 text-xs font-medium transition ${filter.type === "TYPE1" ? "bg-white shadow-sm text-gray-900 dark:bg-gray-800 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
              >
                Access
              </button>
              <button
                onClick={() => handleFilterChange({ type: "TYPE3" })}
                className={`h-9 rounded-md px-3 text-xs font-medium transition ${filter.type === "TYPE3" ? "bg-white shadow-sm text-gray-900 dark:bg-gray-800 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
              >
                Development
              </button>
            </div>

            {/* Status Dropdown - Like Logs Entity */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={`flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition ${filter.status ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}
              >
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                  <path d="M14.6537 5.90414C14.6537 4.48433 13.5027 3.33331 12.0829 3.33331C10.6631 3.33331 9.51206 4.48433 9.51204 5.90415M14.6537 5.90414C14.6537 7.32398 13.5027 8.47498 12.0829 8.47498C10.663 8.47498 9.51204 7.32398 9.51204 5.90415M14.6537 5.90414L17.7087 5.90411M9.51204 5.90415L2.29199 5.90411M5.34694 14.0958C5.34694 12.676 6.49794 11.525 7.91777 11.525C9.33761 11.525 10.4886 12.676 10.4886 14.0958M5.34694 14.0958C5.34694 15.5156 6.49794 16.6666 7.91778 16.6666C9.33761 16.6666 10.4886 15.5156 10.4886 14.0958M5.34694 14.0958L2.29199 14.0958M10.4886 14.0958L17.7087 14.0958" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {filter.status ? filter.status.replace(/_/g, " ") : "Status"}
                {filter.status && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] text-white">1</span>}
              </button>

              {filterOpen && (
                <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  {["", "APPROVED", "IN_PROGRESS", "RESOLVED", "WAITING_FOR_VERIFICATION", "VERIFIED", "DONE", "REJECTED", "CANCELLED"].map((s) => {
                    const dotClass = s ? (
                      statusColorMap[s] === "success" ? "bg-success-500" :
                        statusColorMap[s] === "warning" ? "bg-warning-500" :
                          statusColorMap[s] === "error" ? "bg-error-500" :
                            "bg-info-500"
                    ) : "bg-gray-400";
                    return (
                      <button
                        key={s}
                        onClick={() => { handleFilterChange({ status: s }); setFilterOpen(false); }}
                        className={`flex w-full items-center gap-2.5 px-4 py-2 text-sm transition ${filter.status === s ? "text-brand-600 bg-brand-50 dark:bg-brand-900/20 dark:text-brand-400" : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.04]"}`}
                      >
                        {s !== "" && <span className={`h-2 w-2 rounded-full ${dotClass}`} />}
                        {s === "" ? "All Statuses" : s.replace(/_/g, " ")}
                      </button>
                    );
                  })}
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
                    Deadline
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
                  paginatedTickets.map((ticket) => (
                    <TableRow key={ticket.ticket_id}>
                      <TableCell className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800 dark:text-white">
                            {ticket.requester?.username}
                          </span>
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
                      <TableCell className="px-4 py-4 text-sm font-medium text-brand-600 dark:text-brand-400">
                        {ticket.deadline ? new Date(ticket.deadline).toLocaleString() : "—"}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm text-gray-500">
                        {new Date(ticket.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge
                          size="sm"
                          color={statusColorMap[ticket.status] ?? "info"}
                        >
                          {ticket.status.replace("_", " ")}
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
