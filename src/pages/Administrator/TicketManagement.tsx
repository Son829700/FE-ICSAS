/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState } from "react";
import API from "../../api";
import {
  X,
  Loader2,
  Send,
  UserCog,
  CheckCheck,
  Search,
} from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import ComponentCard from "../../components/common/ComponentCard";
import toast from "react-hot-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import DashboardViewer from "../Dashboard/DashboardViewer";

/* =======================
   CONSTANTS
======================= */
const TICKET_TYPE_MAP: Record<string, string> = {
  TYPE2: "User Account Management",
  TYPE3: "Dashboard Development Request",
};

const statusColorMap: Record<string, "success" | "warning" | "error" | "info"> =
{
  DONE: "success",
  RESOLVED: "success",
  VERIFIED: "success",
  APPROVED: "info",
  IN_PROGRESS: "info",
  WAITING_FOR_VERIFICATION: "warning",
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
  department: Department | null;
  createdAt: string;
  status: string;
}

interface Ticket {
  ticket_id: string;
  requester: User;
  type: string;
  description: string;
  reason: string;
  dashboard_id: string | null;
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
  assigned_staff: User | null;
  approver: User | null;
  createdAt: string;
  updatedAt: string;
}

interface Dashboard {
  dashboard_id: string;
  dashboard_name: string;
  url_path: string;
  category: string;
  status: string;
}

interface FilterValue {
  type: string;
  status: string;
}

/* =======================
   FLOW PROGRESS (TYPE2)
======================= */
const FLOW_STEPS_TYPE2 = ["CREATED", "APPROVED", "RESOLVED", "DONE"];

function FlowProgress({ status }: { status: string }) {
  const isRejected = status === "REJECTED" || status === "CANCELLED";
  const currentIdx = FLOW_STEPS_TYPE2.indexOf(status);
  return (
    <div className="flex items-center gap-1">
      {FLOW_STEPS_TYPE2.map((step, idx) => {
        const done = currentIdx > idx;
        const active = currentIdx === idx;
        return (
          <div key={step} className="flex items-center gap-1">
            <div
              className={`h-2 w-2 rounded-full transition-all ${isRejected
                  ? "bg-gray-200 dark:bg-gray-700"
                  : done
                    ? "bg-success-500"
                    : active
                      ? "bg-brand-500 animate-pulse"
                      : "bg-gray-200 dark:bg-gray-700"
                }`}
            />
            {idx < FLOW_STEPS_TYPE2.length - 1 && (
              <div
                className={`h-px w-4 ${done && !isRejected ? "bg-success-500" : "bg-gray-200 dark:bg-gray-700"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
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
   TYPE3 MODAL — Admin review dashboard draft
======================= */
interface Type3ModalProps {
  ticket: Ticket;
  onClose: () => void;
  onUpdated: (updated: Ticket) => void;
}

function Type3ReviewModal({ ticket, onClose, onUpdated }: Type3ModalProps) {
  const [currentTicket, setCurrentTicket] = useState<Ticket>(ticket);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentTicket.dashboard_id) {
      const fetchDashboard = async () => {
        try {
          setLoadingDashboard(true);
          const res = await API.get(`/dashboard/${currentTicket.dashboard_id}`);
          setDashboard(res.data.data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingDashboard(false);
        }
      };
      fetchDashboard();
    }
  }, [currentTicket.dashboard_id]);

  const refetch = async () => {
    const res = await API.get(`/tickets/${currentTicket.ticket_id}`);
    const updated: Ticket = res.data.data;
    setCurrentTicket(updated);
    onUpdated(updated);
  };

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      await API.put(`/tickets/approve-dashboard/${currentTicket.ticket_id}`);
      toast.success("Dashboard approved! Ticket marked as DONE.");
      await refetch();
    } catch (err) {
      toast.error("Failed to approve.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason.");
      return;
    }
    try {
      setSubmitting(true);
      await API.put(
        `/tickets/reject-dashboard/${currentTicket.ticket_id}`,
        null,
        {
          params: { reason: rejectReason.trim() },
        },
      );
      toast.success("Dashboard rejected. Ticket sent back to BI Staff.");
      await refetch();
      setShowRejectForm(false);
      setRejectReason("");
    } catch (err) {
      toast.error("Failed to reject.");
    } finally {
      setSubmitting(false);
    }
  };

  const isTerminal = ["DONE", "VERIFIED", "REJECTED", "CANCELLED"].includes(
    currentTicket.status,
  );
  const canReview =
    currentTicket.status === "WAITING_FOR_VERIFICATION" &&
    !!currentTicket.dashboard_id;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Dashboard Development Ticket
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <Badge
                size="sm"
                color={statusColorMap[currentTicket.status] ?? "info"}
              >
                {currentTicket.status.replace("_", " ")}
              </Badge>
              <span className="text-xs text-gray-400">TYPE3</span>
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
              label="Description"
              value={
                <span className="whitespace-pre-wrap">
                  {currentTicket.description}
                </span>
              }
            />
            <DetailRow
              label="Assigned BI Staff"
              value={
                currentTicket.assigned_staff ? (
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {currentTicket.assigned_staff.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {currentTicket.assigned_staff.email}
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
            {currentTicket.reason && (
              <DetailRow
                label="Reason"
                value={
                  <span className="text-error-500">{currentTicket.reason}</span>
                }
              />
            )}
          </ul>

          {/* Dashboard Preview */}
          {currentTicket.dashboard_id && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Dashboard Draft to Review
              </h4>

              {loadingDashboard ? (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="size-4 animate-spin" />
                  Loading dashboard...
                </div>
              ) : dashboard ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/[0.02] overflow-hidden">
                  {/* Dashboard info bar */}
                  <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {dashboard.dashboard_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {dashboard.category} · {dashboard.status}
                      </p>
                    </div>
                  </div>

                  {/* Iframe preview */}
                  <div className="relative w-full" style={{ height: "400px" }}>
                    <DashboardViewer
                      url={dashboard.url_path}
                      category={dashboard.category}
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-center dark:border-gray-700">
                  <p className="text-sm text-gray-400">
                    Could not load dashboard preview.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* No dashboard yet */}
          {!currentTicket.dashboard_id &&
            currentTicket.status === "IN_PROGRESS" && (
              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-4 dark:border-gray-700">
                <p className="text-sm text-gray-400 text-center">
                  BI Staff is still working on the dashboard.
                </p>
              </div>
            )}

          {/* ACTION SECTION — chỉ khi RESOLVED và có dashboard */}
          {canReview && !isTerminal && (
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-5 dark:border-purple-800 dark:bg-purple-900/10 space-y-4">
              <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                Admin Review Decision
              </h4>
              <p className="text-sm text-purple-600 dark:text-purple-300">
                Review the dashboard above, then approve to publish it or reject
                to send back for revision.
              </p>

              {!showRejectForm ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={submitting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-success-500 py-2.5 text-sm font-medium text-white hover:bg-success-600 disabled:opacity-50 transition"
                  >
                    {submitting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CheckCheck className="size-4" />
                    )}
                    {submitting
                      ? "Processing..."
                      : "Approve & Publish Dashboard"}
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    disabled={submitting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-error-500 py-2.5 text-sm font-medium text-white hover:bg-error-600 disabled:opacity-50 transition"
                  >
                    <X className="size-4" />
                    Reject — Send Back
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Reason for Rejection{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Describe what needs to be fixed or improved..."
                      rows={4}
                      className={`w-full rounded-lg border p-3 text-sm outline-none focus:ring-1 resize-none dark:bg-gray-800 dark:text-gray-300 transition ${!rejectReason.trim()
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-700"
                          : "border-gray-300 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-700"
                        }`}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectReason("");
                      }}
                      disabled={submitting}
                      className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition dark:border-gray-600 dark:text-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={submitting || !rejectReason.trim()}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-error-500 py-2.5 text-sm font-medium text-white hover:bg-error-600 disabled:opacity-50 transition"
                    >
                      {submitting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                      {submitting ? "Rejecting..." : "Confirm Reject"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TERMINAL */}
          {isTerminal && (
            <div
              className={`rounded-xl border px-4 py-3 ${currentTicket.status === "VERIFIED"
                  ? "border-success-200 bg-success-50 dark:border-success-800 dark:bg-success-900/10"
                  : "border-error-200 bg-error-50 dark:border-error-800 dark:bg-error-900/10"
                }`}
            >
              <p
                className={`text-sm font-medium ${currentTicket.status === "VERIFIED"
                    ? "text-success-700 dark:text-success-400"
                    : "text-error-600 dark:text-error-400"
                  }`}
              >
                {currentTicket.status === "VERIFIED"
                  ? "Dashboard verified and approved."
                  : "Dashboard rejected — sent back to BI Staff for revision."}
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
   TYPE2 MODAL (giữ nguyên như cũ)
   Chỉ đổi tên component
======================= */
interface Type2ModalProps {
  ticket: Ticket;
  departments: Department[];
  onClose: () => void;
  onUpdated: (updated: Ticket) => void;
}

function Type2ReviewModal({
  ticket,
  departments,
  onClose,
  onUpdated,
}: Type2ModalProps) {
  const [currentTicket, setCurrentTicket] = useState<Ticket>(ticket);
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | "">("");
  const [grantRole, setGrantRole] = useState<string>(
    ticket.requester?.role ?? "STAFF",
  );
  const [grantDept, setGrantDept] = useState<string>(
    ticket.requester?.department?.department_id ?? "",
  );
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isRejectWithoutReason = decision === "REJECTED" && !rejectReason.trim();

  const handleDecision = async () => {
    if (!decision || isRejectWithoutReason) return;
    try {
      setSubmitting(true);
      if (decision === "APPROVED") {
        if (grantRole && grantRole !== currentTicket.requester?.role) {
          await API.put(
            `/users/role/${currentTicket.requester.user_id}/${grantRole}`,
          );
        }
        if (
          grantDept &&
          grantDept !== currentTicket.requester?.department?.department_id
        ) {
          await API.put(
            `/users/${currentTicket.requester.user_id}/department/${grantDept}`,
          );
        }
        await API.post(`/tickets/${currentTicket.ticket_id}/status/APPROVED`);
        toast.success("Ticket approved and user updated!");
      } else {
        await API.post(`/tickets/reject/${currentTicket.ticket_id}`, null, {
          params: { reason: rejectReason.trim() },
        });
        toast.success("Ticket rejected.");
      }
      const res = await API.get(`/tickets/${currentTicket.ticket_id}`);
      const updated: Ticket = res.data.data;
      setCurrentTicket(updated);
      onUpdated(updated);
      setDecision("");
    } catch (error) {
      toast.error("Failed to process ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolved = async () => {
    try {
      setSubmitting(true);
      await API.post(`/tickets/${currentTicket.ticket_id}/status/RESOLVED`);
      toast.success("Ticket marked as resolved.");
      const res = await API.get(`/tickets/${currentTicket.ticket_id}`);
      const updated: Ticket = res.data.data;
      setCurrentTicket(updated);
      onUpdated(updated);
    } catch (error) {
      toast.error("Failed to update ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const isTerminal = ["REJECTED", "CANCELLED", "DONE"].includes(
    currentTicket.status,
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              User Account Management Ticket
            </h3>
            <div className="mt-1.5 flex items-center gap-3">
              <Badge
                size="sm"
                color={statusColorMap[currentTicket.status] ?? "info"}
              >
                {currentTicket.status.replace("_", " ")}
              </Badge>
              <FlowProgress status={currentTicket.status} />
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
              label="Current Role"
              value={
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${currentTicket.requester?.role === "STAFF"
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                      : currentTicket.requester?.role === "BI"
                        ? "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
                        : "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                    }`}
                >
                  {currentTicket.requester?.role ?? "—"}
                </span>
              }
            />
            <DetailRow
              label="Current Department"
              value={
                currentTicket.requester?.department?.department_name ?? (
                  <span className="text-gray-400 italic">Not assigned</span>
                )
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
              label="Created At"
              value={new Date(currentTicket.createdAt).toLocaleString()}
            />
            {currentTicket.reason && (
              <DetailRow
                label="Reject Reason"
                value={
                  <span className="text-error-500">{currentTicket.reason}</span>
                }
              />
            )}
          </ul>

          {currentTicket.status === "CREATED" && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-white/[0.02] space-y-4">
              <div className="flex items-center gap-2">
                <UserCog className="size-5 text-brand-500" />
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  Review & Decide
                </h4>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Decision <span className="text-red-500">*</span>
                </label>
                <select
                  value={decision}
                  onChange={(e) => {
                    setDecision(e.target.value as "APPROVED" | "REJECTED");
                    setRejectReason("");
                  }}
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  <option value="">-- Select decision --</option>
                  <option value="APPROVED">Approve & Update User</option>
                  <option value="REJECTED">Reject</option>
                </select>
              </div>
              {decision === "APPROVED" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                        Grant Role
                      </label>
                      <select
                        value={grantRole}
                        onChange={(e) => setGrantRole(e.target.value)}
                        className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        <option value="STAFF">Staff</option>
                        <option value="BI">BI</option>
                        <option value="CUSTOMER">Customer</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                        Assign Department
                      </label>
                      <select
                        value={grantDept}
                        onChange={(e) => setGrantDept(e.target.value)}
                        className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        <option value="">-- Keep current --</option>
                        {departments.map((d) => (
                          <option key={d.department_id} value={d.department_id}>
                            {d.department_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 dark:border-brand-900 dark:bg-brand-900/20">
                    <p className="text-xs font-semibold text-brand-600 mb-1.5">
                      Changes to be applied:
                    </p>
                    <ul className="space-y-1 text-xs text-brand-500">
                      <li>
                        Role:{" "}
                        <span className="line-through opacity-60">
                          {currentTicket.requester?.role ?? "—"}
                        </span>
                        {" → "}
                        <span className="font-semibold">{grantRole}</span>
                      </li>
                      <li>
                        Department:{" "}
                        <span className="line-through opacity-60">
                          {currentTicket.requester?.department
                            ?.department_name ?? "None"}
                        </span>
                        {" → "}
                        <span className="font-semibold">
                          {departments.find(
                            (d) => d.department_id === grantDept,
                          )?.department_name ?? "No change"}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
              {decision === "REJECTED" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Explain why..."
                    rows={4}
                    className={`w-full rounded-lg border p-3 text-sm outline-none focus:ring-1 resize-none dark:bg-gray-800 dark:text-gray-300 ${!rejectReason.trim()
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-brand-500 focus:ring-brand-500"
                      }`}
                  />
                </div>
              )}
              {decision && (
                <button
                  onClick={handleDecision}
                  disabled={submitting || isRejectWithoutReason}
                  className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition disabled:opacity-50 ${decision === "REJECTED"
                      ? "bg-error-500 hover:bg-error-600"
                      : "bg-brand-500 hover:bg-brand-600"
                    }`}
                >
                  {submitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  {submitting
                    ? "Processing..."
                    : decision === "APPROVED"
                      ? "Approve & Update User"
                      : "Reject Ticket"}
                </button>
              )}
            </div>
          )}

          {currentTicket.status === "APPROVED" && (
            <div className="rounded-xl border border-success-200 bg-success-50 p-5 dark:border-success-800 dark:bg-success-900/10 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCheck className="size-5 text-success-600" />
                <h4 className="text-sm font-semibold text-success-700">
                  Complete Task & Mark Resolved
                </h4>
              </div>
              <p className="text-sm text-success-600">
                Complete the requested task, then mark as resolved.
              </p>
              <button
                onClick={handleResolved}
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

          {currentTicket.status === "RESOLVED" && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 dark:border-blue-800 dark:bg-blue-900/10">
              <p className="text-sm font-medium text-blue-700">
                ⏳ Waiting for requester confirmation
              </p>
            </div>
          )}

          {isTerminal && (
            <div
              className={`rounded-xl border px-4 py-3 ${currentTicket.status === "DONE"
                  ? "border-success-200 bg-success-50 dark:border-success-800 dark:bg-success-900/10"
                  : "border-error-200 bg-error-50 dark:border-error-800 dark:bg-error-900/10"
                }`}
            >
              <p
                className={`text-sm font-medium ${currentTicket.status === "DONE" ? "text-success-700" : "text-error-600"}`}
              >
                {currentTicket.status === "DONE"
                  ? "✅ Ticket completed."
                  : currentTicket.status === "REJECTED"
                    ? "❌ Rejected."
                    : "🚫 Cancelled."}
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
export default function AdminTicketManagement() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filter, setFilter] = useState<FilterValue>({ type: "", status: "" });
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");

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
      const [type2Res, type3Res] = await Promise.all([
        API.get("/tickets/type/TYPE2"),
        API.get("/tickets/type/TYPE3"),
      ]);

      const type2: Ticket[] = type2Res.data.data ?? [];
      // TYPE3: chỉ lấy những ticket đã có dashboard (RESOLVED trở đi)
      const type3: Ticket[] = (type3Res.data.data ?? []).filter(
        (t: Ticket) =>
          !!t.dashboard_id &&
          ["WAITING_FOR_VERIFICATION", "VERIFIED", "REJECTED"].includes(
            t.status,
          ),
      );

      const merged = [...type2, ...type3].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setTickets(merged);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await API.get("/departments");
      setDepartments(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchDepartments();
  }, []);

  const handleTicketUpdated = (updated: Ticket) => {
    setTickets((prev) =>
      prev.map((t) => (t.ticket_id === updated.ticket_id ? updated : t)),
    );
    if (selectedTicket?.ticket_id === updated.ticket_id) {
      setSelectedTicket(updated);
    }
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
  const awaitingType2 = tickets.filter(
    (t) => t.type === "TYPE2" && t.status === "CREATED",
  ).length;
  const awaitingType3 = tickets.filter(
    (t) => t.type === "TYPE3" && t.status === "RESOLVED",
  ).length;
  const doneTickets = tickets.filter((t) => t.status === "DONE").length;

  return (
    <div>
      {/* Render đúng modal theo type */}
      {selectedTicket?.type === "TYPE2" && (
        <Type2ReviewModal
          ticket={selectedTicket}
          departments={departments}
          onClose={() => setSelectedTicket(null)}
          onUpdated={handleTicketUpdated}
        />
      )}
      {selectedTicket?.type === "TYPE3" && (
        <Type3ReviewModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdated={handleTicketUpdated}
        />
      )}

      <PageMeta
        title="Administrator | Ticket Management"
        description="Admin ticket management"
      />

      {/* STATS */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
        <ComponentCard title="Total Tickets">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            {totalTickets}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            TYPE2 + TYPE3 requiring Admin
          </p>
        </ComponentCard>
        <ComponentCard title="Account Requests">
          <h3 className="text-2xl font-bold text-warning-500">
            {awaitingType2}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            TYPE2 awaiting review
          </p>
        </ComponentCard>
        <ComponentCard title="Dashboard Reviews">
          <h3 className="text-2xl font-bold text-purple-500">
            {awaitingType3}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            TYPE3 dashboard to review
          </p>
        </ComponentCard>
        <ComponentCard title="Completed">
          <h3 className="text-2xl font-bold text-success-500">{doneTickets}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Done tickets
          </p>
        </ComponentCard>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-gray-200 bg-white pt-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="mb-4 flex flex-col gap-3 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Admin Ticket Management
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Process account requests (TYPE2) and review dashboard drafts
              (TYPE3)
            </p>
          </div>

          {/* Search + Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
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

            {/* Type filter chips */}
            <div className="hidden h-10 items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 sm:inline-flex dark:bg-gray-900">
              <button
                onClick={() => { setFilter((p) => ({ ...p, type: "" })); setPage(1); }}
                className={`h-9 rounded-md px-3 text-xs font-medium transition ${!filter.type ? "bg-white shadow-sm text-gray-900 dark:bg-gray-800 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
              >
                All Types
              </button>
              <button
                onClick={() => { setFilter((p) => ({ ...p, type: "TYPE2" })); setPage(1); }}
                className={`h-9 rounded-md px-3 text-xs font-medium transition ${filter.type === "TYPE2" ? "bg-white shadow-sm text-gray-900 dark:bg-gray-800 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
              >
                Account Mgmt
              </button>
              <button
                onClick={() => { setFilter((p) => ({ ...p, type: "TYPE3" })); setPage(1); }}
                className={`h-9 rounded-md px-3 text-xs font-medium transition ${filter.type === "TYPE3" ? "bg-white shadow-sm text-gray-900 dark:bg-gray-800 dark:text-white" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
              >
                Dashboard Dev
              </button>
            </div>

            {/* Status dropdown */}
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
                  {["", "CREATED", "APPROVED", "RESOLVED", "WAITING_FOR_VERIFICATION", "VERIFIED", "DONE", "REJECTED", "CANCELLED"].map((s) => {
                    const dotClass = s ? (
                      statusColorMap[s] === "success" ? "bg-success-500" :
                        statusColorMap[s] === "warning" ? "bg-warning-500" :
                          statusColorMap[s] === "error" ? "bg-error-500" :
                            "bg-info-500"
                    ) : "bg-gray-400";
                    return (
                      <button
                        key={s}
                        onClick={() => { setFilter((p) => ({ ...p, status: s })); setPage(1); setFilterOpen(false); }}
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

        <div className="max-w-full overflow-x-auto px-5 sm:px-6">
          <Table>
            <TableHeader className="border-y border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-start text-theme-xs text-gray-500"
                >
                  Requester
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
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-start text-theme-xs text-gray-500"
                >
                  Created
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
                  const isType2NeedsAction =
                    ticket.type === "TYPE2" && ticket.status === "CREATED";
                  const isType3NeedsReview =
                    ticket.type === "TYPE3" && ticket.status === "RESOLVED";
                  const needsAction = isType2NeedsAction || isType3NeedsReview;

                  return (
                    <TableRow
                      key={ticket.ticket_id}
                      className={
                        needsAction
                          ? "bg-warning-50/40 dark:bg-warning-500/5"
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
                      <TableCell className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ticket.type === "TYPE2"
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                              : "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
                            }`}
                        >
                          {TICKET_TYPE_MAP[ticket.type] ?? ticket.type}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm text-gray-500 max-w-[200px] truncate">
                        {ticket.description}
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
                            <span className="flex h-2 w-2 rounded-full bg-warning-500 animate-pulse" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm text-gray-500">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right">
                        <Button
                          size="sm"
                          variant={needsAction ? "primary" : "outline"}
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          {isType3NeedsReview
                            ? "Review Dashboard"
                            : isType2NeedsAction
                              ? "Review"
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
