import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import Badge from "../../components/ui/badge/Badge";
import PageMeta from "../../components/common/PageMeta";
import toast from "react-hot-toast";

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
  dashboard_id: string;
  reason: string;
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
    IN_PROGRESS: "info",
    WAITING_FOR_VERIFICATION: "warning",
    CREATED: "warning",
    REJECTED: "error",
    CANCELLED: "error",
  };

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
    <li className="flex gap-5 py-2.5">
      <span className="w-1/3 text-sm text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span className="w-2/3 text-sm text-gray-700 dark:text-gray-300">
        {value}
      </span>
    </li>
  );
}

/* =======================
   MAIN COMPONENT
======================= */
export default function TicketDetailManager() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [status, setStatus] = useState<"APPROVED" | "REJECTED" | "">("");
  const [reason, setReason] = useState("");
  const isRejectWithoutReason = status === "REJECTED" && !reason.trim();
  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/tickets/${id}`);
        setTicket(res.data.data);
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load ticket.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTicket();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status || !id) return;

    if (isRejectWithoutReason) {
      toast.error("Please provide a reason for rejection.");
      return;
    }

    try {
      setSubmitting(true);

      if (status === "APPROVED") {
        await API.post(`/tickets/${id}/status/${status}`);
      } else {
        await API.post(`/tickets/reject/${id}`, null, {
          params: { reason: reason.trim() },
        });
      }

      toast.success(
        `Ticket ${status === "APPROVED" ? "approved" : "rejected"} successfully!`,
      );

      // Refetch ticket để cập nhật UI tại chỗ
      const res = await API.get(`/tickets/${id}`);
      setTicket(res.data.data);

      // Reset form
      setStatus("");
      setReason("");
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update ticket.");
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-gray-500">Ticket not found.</p>
        <button
          onClick={() => navigate("/manager/ticket")}
          className="text-sm text-brand-500 hover:underline"
        >
          Back to tickets
        </button>
      </div>
    );
  }

  const isAlreadyProcessed = !["CREATED"].includes(ticket.status);

  return (
    <>
      <PageMeta title="Ticket Detail" description="Manager ticket review" />

      <div className="space-y-6">
        {/* BACK */}
        <button
          onClick={() => navigate("/manager/ticket")}
          className="flex w-fit items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition"
        >
          <ArrowLeft className="size-4" />
          Back to Tickets
        </button>

        {/* TICKET DETAILS */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Ticket Details
          </h2>

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
            <DetailRow label="Description" value={ticket.description} />
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
              label="Created At"
              value={new Date(ticket.createdAt).toLocaleString()}
            />
          </ul>
        </div>

        {/* ACTION FORM */}
        {isAlreadyProcessed ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-white/[0.02]">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This ticket has already been{" "}
              <span className="font-medium text-gray-700 dark:text-gray-200">
                {ticket.status.toLowerCase()}
              </span>{" "}
              and cannot be updated.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
            {/* COMMENT / REASON */}
            <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h3 className="mb-4 font-semibold text-gray-800 dark:text-white/90">
                {status === "REJECTED" ? (
                  <>
                    Reason for Rejection{" "}
                    <span className="text-xs font-normal text-red-400">
                      * required
                    </span>
                  </>
                ) : (
                  <>
                    Note{" "}
                    <span className="text-xs font-normal text-gray-400">
                      (optional)
                    </span>
                  </>
                )}
              </h3>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={`w-full rounded-lg border p-3 text-sm outline-none focus:ring-1 resize-none dark:bg-gray-900 dark:text-gray-300 transition
                  ${
                    status === "REJECTED" && !reason.trim()
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-700"
                      : "border-gray-300 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-700"
                  }`}
                placeholder={
                  status === "REJECTED"
                    ? "You must provide a reason for rejecting this ticket..."
                    : "Add an optional note for this approval..."
                }
                rows={8}
              />
              {status === "REJECTED" && !reason.trim() && (
                <p className="mt-1.5 text-xs text-red-500">
                  A reason is required when rejecting a ticket.
                </p>
              )}
            </div>

            {/* ACTION PANEL */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
              <h3 className="mb-4 font-semibold text-gray-800 dark:text-white/90">
                Manager Actions
              </h3>

              <label className="text-sm text-gray-500 dark:text-gray-400">
                Decision <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as "APPROVED" | "REJECTED");
                  setReason(""); // reset reason khi đổi decision
                }}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                required
              >
                <option value="">Select decision</option>
                <option value="APPROVED">Approve</option>
                <option value="REJECTED">Reject</option>
              </select>

              <button
                type="submit"
                disabled={!status || submitting || isRejectWithoutReason}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                {submitting ? "Updating..." : "Submit Decision"}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
