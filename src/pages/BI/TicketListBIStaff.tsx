/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState } from "react";
import API from "../../api";
import { Filter, X, Loader2, CheckCheck } from "lucide-react";
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
import { useAuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

/* =======================
   CONSTANTS
======================= */
const TICKET_TYPE_MAP: Record<string, string> = {
  TYPE1: "Dashboard Access Request",
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
interface Dashboard {
  dashboard_id: string;
  dashboard_name: string;
  status: string;
  category: string;
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
    | "WAITING_FOR_VERIFICATION" // ← thêm
    | "VERIFIED" // ← thêm
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
   DETAIL ROW
======================= */
function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <li className="flex gap-4 py-2.5">
      <span className="w-1/3 shrink-0 text-sm text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span className="w-2/3 text-sm text-gray-700 dark:text-gray-300">
        {value}
      </span>
    </li>
  );
}

/* =======================
   TICKET DETAIL MODAL
======================= */
interface TicketDetailModalProps {
  ticket: Ticket;
  onClose: () => void;
  onUpdated: () => void;
}

function TicketDetailModal({
  ticket,
  onClose,
  onUpdated,
}: TicketDetailModalProps) {
  const [currentTicket, setCurrentTicket] = useState<Ticket>(ticket);
  const [submitting, setSubmitting] = useState(false);

  // Thêm state cho TYPE3 submit dashboard
  const [draftDashboards, setDraftDashboards] = useState<Dashboard[]>([]);
  const [selectedDashboardId, setSelectedDashboardId] = useState("");
  const [loadingDashboards, setLoadingDashboards] = useState(false);

  const isType3 = currentTicket.type === "TYPE3";

  // Fetch dashboard DRAFT khi IN_PROGRESS và TYPE3
  useEffect(() => {
    if (currentTicket.status === "IN_PROGRESS" && isType3) {
      const fetchDraftDashboards = async () => {
        try {
          setLoadingDashboards(true);
          const res = await API.get("/dashboard");
          const all: Dashboard[] = res.data.data ?? [];
          setDraftDashboards(all.filter((d) => d.status === "DRAFT"));
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingDashboards(false);
        }
      };
      fetchDraftDashboards();
    }
  }, [currentTicket.status, isType3]);

  const refetch = async () => {
    const res = await API.get(`/tickets/${currentTicket.ticket_id}`);
    const updated: Ticket = res.data.data;
    setCurrentTicket(updated);
    onUpdated();
  };

  const handleStartProcessing = async () => {
    try {
      setSubmitting(true);
      await API.post(`/tickets/${currentTicket.ticket_id}/status/IN_PROGRESS`);
      toast.success("Ticket is now in progress!");
      await refetch();
    } catch (err) {
      toast.error("Failed to update ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  // TYPE1: resolve trực tiếp
  const handleResolve = async () => {
    try {
      setSubmitting(true);
      await API.post(`/tickets/${currentTicket.ticket_id}/status/RESOLVED`);
      toast.success(
        "Ticket marked as resolved! Waiting for requester confirmation.",
      );
      await refetch();
    } catch (err) {
      toast.error("Failed to resolve ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  // TYPE3: submit dashboard DRAFT
  const handleSubmitDashboard = async () => {
    if (!selectedDashboardId) {
      toast.error("Please select a dashboard to submit.");
      return;
    }
    try {
      setSubmitting(true);
      await API.put(
        `/tickets/submit_result/${currentTicket.ticket_id}/dashboard/${selectedDashboardId}`,
      );
      toast.success("Dashboard submitted! Waiting for Admin review.");
      await refetch();
    } catch (err) {
      toast.error("Failed to submit dashboard.");
    } finally {
      setSubmitting(false);
    }
  };

  const isTerminal = ["DONE", "VERIFIED", "REJECTED", "CANCELLED"].includes(
    currentTicket.status,
  );
  const handleResolveAfterVerified = async () => {
    try {
      setSubmitting(true);
      await API.post(`/tickets/${currentTicket.ticket_id}/status/RESOLVED`);
      toast.success("Access granted! Waiting for requester confirmation.");
      await refetch();
    } catch (err) {
      toast.error("Failed to update ticket.");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Ticket Details
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <Badge
                size="sm"
                color={statusColorMap[currentTicket.status] ?? "info"}
              >
                {currentTicket.status.replace("_", " ")}
              </Badge>
              <span className="text-xs text-gray-400">
                {TICKET_TYPE_MAP[currentTicket.type] ?? currentTicket.type}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
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
                    {currentTicket.requester?.username}
                  </span>
                  <span className="text-xs text-gray-500">
                    {currentTicket.requester?.email}
                  </span>
                </div>
              }
            />
            <DetailRow
              label="Department"
              value={
                currentTicket.requester?.department?.department_name ?? "—"
              }
            />
            <DetailRow
              label="Ticket Type"
              value={
                <span className="font-medium">
                  {TICKET_TYPE_MAP[currentTicket.type] ?? currentTicket.type}
                </span>
              }
            />
            <DetailRow
              label="Description"
              value={
                <span className="whitespace-pre-wrap">
                  {currentTicket.description}
                </span>
              }
            />
            <DetailRow
              label="Approver"
              value={
                currentTicket.approver ? (
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {currentTicket.approver.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {currentTicket.approver.email}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )
              }
            />
            <DetailRow
              label="Created At"
              value={new Date(currentTicket.createdAt).toLocaleString()}
            />
            <DetailRow
              label="Last Updated"
              value={new Date(currentTicket.updatedAt).toLocaleString()}
            />
            {currentTicket.reason && (
              <DetailRow
                label="Reason"
                value={
                  <span className="text-error-500">{currentTicket.reason}</span>
                }
              />
            )}
          </ul>

          {/* ===== ACTIONS ===== */}

          {/* APPROVED → Start */}
          {currentTicket.status === "APPROVED" && (
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-800 dark:bg-brand-900/10 space-y-3">
              <h4 className="text-sm font-semibold text-brand-700 dark:text-brand-400">
                New Assignment
              </h4>
              <p className="text-sm text-brand-600 dark:text-brand-300">
                This ticket has been assigned to you. Click below to start
                processing.
              </p>
              <button
                onClick={handleStartProcessing}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition"
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {submitting ? "Updating..." : "Start Processing"}
              </button>
            </div>
          )}

          {/* IN_PROGRESS — TYPE1: grant access rồi resolve */}
          {currentTicket.status === "IN_PROGRESS" && !isType3 && (
            <div className="rounded-xl border border-warning-200 bg-warning-50 p-5 dark:border-warning-800 dark:bg-warning-900/10 space-y-3">
              <h4 className="text-sm font-semibold text-warning-700 dark:text-warning-400">
                In Progress — Dashboard Access Request
              </h4>
              <p className="text-sm text-warning-600 dark:text-warning-300">
                Grant the requester access to the requested dashboard, then mark
                as resolved.
              </p>
              <button
                onClick={handleResolve}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-success-500 py-2.5 text-sm font-medium text-white hover:bg-success-600 disabled:opacity-50 transition"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCheck className="size-4" />
                )}
                {submitting ? "Updating..." : "Mark as Resolved"}
              </button>
            </div>
          )}

          {/* IN_PROGRESS — TYPE3: chọn dashboard DRAFT và submit */}
          {currentTicket.status === "IN_PROGRESS" && isType3 && (
            <div className="rounded-xl border border-warning-200 bg-warning-50 p-5 dark:border-warning-800 dark:bg-warning-900/10 space-y-4">
              <h4 className="text-sm font-semibold text-warning-700 dark:text-warning-400">
                In Progress — Dashboard Development
              </h4>

              <ol className="space-y-1 text-sm text-warning-600 dark:text-warning-300 list-decimal ml-4">
                <li>
                  Go to <strong>Dashboard Management</strong> and create the
                  requested dashboard (it will be{" "}
                  <code className="rounded bg-warning-100 px-1 text-xs dark:bg-warning-900/40">
                    DRAFT
                  </code>{" "}
                  by default)
                </li>
                <li>
                  Come back here, select the DRAFT dashboard below and click{" "}
                  <strong>Submit</strong>
                </li>
              </ol>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-warning-700 dark:text-warning-400">
                  Select Dashboard Draft <span className="text-red-500">*</span>
                </label>

                {loadingDashboards ? (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Loader2 className="size-3.5 animate-spin" />
                    Loading dashboards...
                  </div>
                ) : draftDashboards.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-warning-300 bg-white px-4 py-3 dark:border-warning-700 dark:bg-gray-900">
                    <p className="text-xs text-gray-400 text-center">
                      No DRAFT dashboards found. Create one in Dashboard
                      Management first.
                    </p>
                  </div>
                ) : (
                  <select
                    value={selectedDashboardId}
                    onChange={(e) => setSelectedDashboardId(e.target.value)}
                    className="h-10 w-full rounded-lg border border-warning-300 bg-white px-3 text-sm outline-none focus:border-brand-500 dark:border-warning-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    <option value="">-- Select dashboard draft --</option>
                    {draftDashboards.map((d) => (
                      <option key={d.dashboard_id} value={d.dashboard_id}>
                        {d.dashboard_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <button
                onClick={handleSubmitDashboard}
                disabled={!selectedDashboardId || submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCheck className="size-4" />
                )}
                {submitting
                  ? "Submitting..."
                  : "Submit Dashboard for Admin Review"}
              </button>
            </div>
          )}
          {/* WAITING_FOR_VERIFICATION — chờ Admin */}
          {currentTicket.status === "WAITING_FOR_VERIFICATION" && (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-4 dark:border-yellow-800 dark:bg-yellow-900/10">
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                ⏳ Waiting for Admin to verify the dashboard
              </p>
              <p className="mt-1 text-xs text-yellow-500 dark:text-yellow-300">
                Admin is reviewing your submitted dashboard draft.
              </p>
            </div>
          )}

          {/* VERIFIED — Admin đã duyệt, BI Staff grant access rồi resolve */}
          {currentTicket.status === "VERIFIED" && (
            <div className="rounded-xl border border-success-200 bg-success-50 p-5 dark:border-success-800 dark:bg-success-900/10 space-y-3">
              <h4 className="text-sm font-semibold text-success-700 dark:text-success-400">
                Dashboard Verified by Admin
              </h4>
              <p className="text-sm text-success-600 dark:text-success-300">
                The dashboard has been approved. Grant the requester access to
                the dashboard, then mark as resolved.
              </p>
              <div className="rounded-lg border border-success-100 bg-white px-3 py-2 dark:border-success-900 dark:bg-gray-900">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Grant access to:
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white">
                  {currentTicket.requester?.username}
                </p>
                <p className="text-xs text-gray-500">
                  {currentTicket.requester?.email}
                </p>
              </div>
              <button
                onClick={handleResolveAfterVerified}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-success-500 py-2.5 text-sm font-medium text-white hover:bg-success-600 disabled:opacity-50 transition"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCheck className="size-4" />
                )}
                {submitting ? "Updating..." : " Mark Resolved"}
              </button>
            </div>
          )}

          {/* RESOLVED — chờ user confirm */}
          {/* {currentTicket.status === "RESOLVED" && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 dark:border-blue-800 dark:bg-blue-900/10">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
               
                {isType3
                  ? "Waiting for requester to confirm"
                  : "Waiting for requester confirmation"}
              </p>
              <p className="mt-1 text-xs text-blue-500 dark:text-blue-300">
                The requester needs to confirm completion.
              </p>
            </div>
          )} */}

          {/* RESOLVED */}
          {currentTicket.status === "RESOLVED" && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 dark:border-blue-800 dark:bg-blue-900/10">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                {isType3
                  ? "Waiting for Admin to review the dashboard draft"
                  : "Waiting for requester confirmation"}
              </p>
              <p className="mt-1 text-xs text-blue-500 dark:text-blue-300">
                {isType3
                  ? "Admin will approve or send back for revision."
                  : "The requester needs to verify and confirm completion."}
              </p>
            </div>
          )}

          {/* TERMINAL */}
          {isTerminal && currentTicket.status !== "RESOLVED" && (
            <div
              className={`rounded-xl border px-4 py-3 ${
                currentTicket.status === "DONE"
                  ? "border-success-200 bg-success-50 dark:border-success-800 dark:bg-success-900/10"
                  : "border-error-200 bg-error-50 dark:border-error-800 dark:bg-error-900/10"
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  currentTicket.status === "DONE"
                    ? "text-success-700 dark:text-success-400"
                    : "text-error-600 dark:text-error-400"
                }`}
              >
                {currentTicket.status === "DONE"
                  ? "Ticket completed successfully."
                  : currentTicket.status === "REJECTED"
                    ? "This ticket has been rejected."
                    : "This ticket has been cancelled."}
              </p>
              {currentTicket.reason && (
                <p className="mt-1 text-sm text-error-500">
                  Reason: {currentTicket.reason}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =======================
   MAIN PAGE
======================= */
export default function TicketListBIStaff() {
  const { user } = useAuthContext();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<FilterValue>({ type: "", status: "" });
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
      const [assignedRes, requesterRes] = await Promise.all([
        API.get(`/tickets/assigned/${user.user_id}`),
        API.get(`/tickets/requester/${user.user_id}`),
      ]);

      const assigned: Ticket[] = assignedRes.data.data ?? [];
      const requester: Ticket[] = requesterRes.data.data ?? [];

      // Merge + dedup theo ticket_id, chỉ lấy TYPE1 và TYPE3
      const map = new Map<string, Ticket>();
      [...assigned, ...requester].forEach((t) => map.set(t.ticket_id, t));

      setTickets(
        Array.from(map.values()).sort(
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

  /* Stats */
  const totalTickets = tickets.length;
  const activeTickets = tickets.filter((t) =>
    [
      "APPROVED",
      "IN_PROGRESS",
      "WAITING_FOR_VERIFICATION",
      "VERIFIED",
    ].includes(t.status),
  ).length;
  const resolvedTickets = tickets.filter((t) =>
    ["RESOLVED", "DONE"].includes(t.status),
  ).length;
  const rejectedTickets = tickets.filter((t) =>
    ["REJECTED", "CANCELLED"].includes(t.status),
  ).length;

  return (
    <div>
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdated={() => {
            fetchTickets();
            setSelectedTicket(null);
          }}
        />
      )}

      <PageMeta
        title="My Assigned Tickets | BI Staff"
        description="Process your assigned tickets"
      />

      {/* STATS */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
        <ComponentCard title="Total Assigned">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            {totalTickets.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            All assigned tickets
          </p>
        </ComponentCard>
        <ComponentCard title="Active">
          <h3 className="text-2xl font-bold text-brand-500">
            {activeTickets.toLocaleString()}
          </h3>
          <div className="mt-1 flex flex-wrap gap-1">
            {(["APPROVED", "IN_PROGRESS"] as const).map((s) => (
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
            {rejectedTickets.toLocaleString()}
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

      {/* TABLE */}
      <div className="rounded-2xl border border-gray-200 bg-white pt-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="mb-4 flex flex-col gap-3 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              My Assigned Tickets
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tickets assigned to you for processing
            </p>
          </div>

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
                    <option value="TYPE3">Dashboard Development Request</option>
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
                    <option value="APPROVED">Approved</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="DONE">Done</option>
                    <option value="WAITING_FOR_VERIFICATION">
                      Waiting Verification
                    </option>
                    <option value="VERIFIED">Verified</option>
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
        </div>

        {/* TABLE CONTENT */}
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
                    No assigned tickets found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTickets.map((ticket) => {
                  const needsAction = ticket.status === "APPROVED";
                  const inProgress = ticket.status === "IN_PROGRESS";
                  return (
                    <TableRow
                      key={ticket.ticket_id}
                      className={
                        needsAction
                          ? "bg-brand-50/30 dark:bg-brand-500/5"
                          : inProgress
                            ? "bg-warning-50/30 dark:bg-warning-500/5"
                            : ""
                      }
                    >
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
                          {needsAction && (
                            <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
                          )}
                          {inProgress && (
                            <span className="flex h-2 w-2 rounded-full bg-warning-500 animate-pulse" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right">
                        <Button
                          size="sm"
                          variant={needsAction ? "primary" : "outline"}
                          onClick={() => {
                            const isRequester =
                              ticket.requester?.user_id === user?.user_id;
                            const isAssigned =
                              ticket.assigned_staff?.user_id === user?.user_id;
                            const isApprover =
                              ticket.approver?.user_id === user?.user_id;

                            const isOwnTicket =
                              isRequester || isAssigned || isApprover;
                            const shouldNavigate =
                              isOwnTicket || ticket.type === "TYPE2";

                            if (shouldNavigate) {
                              navigate(`/ticket/${ticket.ticket_id}`);
                            } else {
                              setSelectedTicket(ticket);
                            }
                          }}
                        >
                          {needsAction
                            ? "Start"
                            : inProgress
                              ? "Process"
                              : ticket.requester?.user_id === user?.user_id ||
                                  ticket.type === "TYPE2"
                                ? "Open"
                                : "View"}
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
