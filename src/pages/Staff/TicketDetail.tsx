import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api";
import {
  FileText,
  UserCheck,
  Loader2,
  CheckCircle,
  ArrowLeft,
  Clock,
  PlayCircle,
  XCircle,
  Ban,
} from "lucide-react";
import Badge from "../../components/ui/badge/Badge";
import PageMeta from "../../components/common/PageMeta";

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

const statusColorMap: Record<string, "success" | "warning" | "error" | "info"> = {
  DONE: "success",
  RESOLVED: "success",
  APPROVED: "success",
  IN_PROGRESS: "info",
  CREATED: "info",
  REJECTED: "error",
  CANCELLED: "error",
};

/* =======================
   TIMELINE CONFIG
======================= */
type StepKey = "CREATED" | "APPROVED" | "IN_PROGRESS" | "RESOLVED" | "DONE";
type TerminalStatus = "REJECTED" | "CANCELLED";

const TIMELINE_STEPS: {
  key: StepKey;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "CREATED",
    label: "Ticket Created",
    description: "Request submitted",
    icon: <FileText className="size-5" />,
  },
  {
    key: "APPROVED",
    label: "Approved",
    description: "Manager approved",
    icon: <UserCheck className="size-5" />,
  },
  {
    key: "IN_PROGRESS",
    label: "In Progress",
    description: "BI staff processing",
    icon: <PlayCircle className="size-5" />,
  },
  {
    key: "RESOLVED",
    label: "Resolved",
    description: "Issue resolved",
    icon: <CheckCircle className="size-5" />,
  },
  {
    key: "DONE",
    label: "Done",
    description: "Ticket closed",
    icon: <Clock className="size-5" />,
  },
];

const STEP_ORDER: StepKey[] = ["CREATED", "APPROVED", "IN_PROGRESS", "RESOLVED", "DONE"];
const TERMINAL_STATUSES: TerminalStatus[] = ["REJECTED", "CANCELLED"];

function getStepIndex(status: string): number {
  const idx = STEP_ORDER.indexOf(status as StepKey);
  return idx === -1 ? 0 : idx;
}

function isTerminal(status: string): status is TerminalStatus {
  return TERMINAL_STATUSES.includes(status as TerminalStatus);
}

/* =======================
   COMPONENT
======================= */
export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setLoading(true);
        const response = await API.get(`/tickets/${id}`);
        setTicket(response.data.data);
      } catch (error) {
        console.error("Fetch ticket detail error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTicket();
  }, [id]);

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
          onClick={() => navigate("/ticket")}
          className="text-sm text-brand-500 hover:underline"
        >
          Back to tickets
        </button>
      </div>
    );
  }

  const currentStepIndex = getStepIndex(ticket.status);
  const terminal = isTerminal(ticket.status);

  return (
    <>
      <PageMeta title="Ticket Detail" description="View ticket details" />

      <div className="flex flex-col gap-6">
        {/* BACK */}
        <button
          onClick={() => navigate("/ticket")}
          className="flex w-fit items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition"
        >
          <ArrowLeft className="size-4" />
          Back to Tickets
        </button>

        {/* TIMELINE */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Ticket Progress
            </h2>
            <Badge size="sm" color={statusColorMap[ticket.status] ?? "info"}>
              {ticket.status.replace("_", " ")}
            </Badge>
          </div>

          {/* Terminal status banner */}
          {terminal ? (
            <div className={`rounded-xl border px-5 py-4 flex items-start gap-3 ${
              ticket.status === "REJECTED"
                ? "border-error-200 bg-error-50 dark:border-error-800 dark:bg-error-900/20"
                : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40"
            }`}>
              {ticket.status === "REJECTED" ? (
                <XCircle className="size-5 text-error-500 shrink-0 mt-0.5" />
              ) : (
                <Ban className="size-5 text-gray-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-medium ${
                  ticket.status === "REJECTED"
                    ? "text-error-600 dark:text-error-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}>
                  {ticket.status === "REJECTED"
                    ? "This ticket has been rejected."
                    : "This ticket has been cancelled."}
                </p>
                {ticket.reason && (
                  <p className={`mt-1 text-sm ${
                    ticket.status === "REJECTED"
                      ? "text-error-500 dark:text-error-300"
                      : "text-gray-500 dark:text-gray-400"
                  }`}>
                    Reason: {ticket.reason}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Normal timeline */
            <div className="relative flex items-start justify-between overflow-x-auto pb-2">
              {/* LINE */}
              <div className="absolute top-6 left-0 right-0 h-px border-t border-dashed border-gray-300 dark:border-gray-700" />

              {TIMELINE_STEPS.map((step, index) => {
                const isDone = index < currentStepIndex;
                const isActive = index === currentStepIndex;

                return (
                  <div
                    key={step.key}
                    className="relative z-10 flex w-full flex-col items-center text-center px-2 min-w-[80px]"
                  >
                    {/* Circle */}
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ring transition-all ${
                      isDone
                        ? "border-success-200 bg-success-50 text-success-600 ring-success-200 dark:border-success-800 dark:bg-success-900/40 dark:text-success-400 dark:ring-success-800"
                        : isActive
                        ? "border-brand-200 bg-brand-50 text-brand-600 ring-brand-200 dark:border-brand-800 dark:bg-brand-900/40 dark:text-brand-400 dark:ring-brand-800"
                        : "border-gray-100 bg-white text-gray-400 ring-gray-200 dark:border-gray-800 dark:bg-gray-900 dark:ring-gray-800"
                    }`}>
                      {isActive && ticket.status !== "DONE" ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : isDone ? (
                        <CheckCircle className="size-5" />
                      ) : (
                        step.icon
                      )}
                    </div>

                    {/* Label */}
                    <h4 className={`mt-3 text-xs font-medium sm:text-sm ${
                      isDone || isActive
                        ? "text-gray-800 dark:text-white/90"
                        : "text-gray-400 dark:text-gray-600"
                    }`}>
                      {step.label}
                    </h4>
                    <p className={`text-xs mt-0.5 hidden sm:block ${
                      isDone || isActive
                        ? "text-gray-500 dark:text-gray-400"
                        : "text-gray-300 dark:text-gray-700"
                    }`}>
                      {step.description}
                    </p>

                    {/* Active pulse dot */}
                    {isActive && ticket.status !== "DONE" && (
                      <span className="mt-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-brand-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DETAILS */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
            Ticket Details
          </h2>

          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            <li className="flex items-start gap-5 py-2.5">
              <span className="w-1/3 text-sm text-gray-500 dark:text-gray-400">Ticket ID</span>
              <span className="w-2/3 text-sm font-mono text-gray-700 dark:text-gray-300">
                {ticket.ticket_id}
              </span>
            </li>
            <li className="flex items-start gap-5 py-2.5">
              <span className="w-1/3 text-sm text-gray-500 dark:text-gray-400">Requester</span>
              <div className="flex w-2/3 flex-col">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {ticket.requester?.username}
                </span>
                <span className="text-xs text-gray-500">{ticket.requester?.email}</span>
              </div>
            </li>
            <li className="flex items-start gap-5 py-2.5">
              <span className="w-1/3 text-sm text-gray-500 dark:text-gray-400">Department</span>
              <span className="w-2/3 text-sm text-gray-700 dark:text-gray-300">
                {ticket.requester?.department?.department_name ?? "—"}
              </span>
            </li>
            <li className="flex items-start gap-5 py-2.5">
              <span className="w-1/3 text-sm text-gray-500 dark:text-gray-400">Ticket Type</span>
              <span className="w-2/3 text-sm font-medium text-gray-700 dark:text-gray-300">
                {TICKET_TYPE_MAP[ticket.type] ?? ticket.type}
              </span>
            </li>
            <li className="flex items-start gap-5 py-2.5">
              <span className="w-1/3 text-sm text-gray-500 dark:text-gray-400">Description</span>
              <span className="w-2/3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {ticket.description}
              </span>
            </li>
            <li className="flex items-start gap-5 py-2.5">
              <span className="w-1/3 text-sm text-gray-500 dark:text-gray-400">Status</span>
              <Badge size="sm" color={statusColorMap[ticket.status] ?? "info"}>
                {ticket.status.replace("_", " ")}
              </Badge>
            </li>
            <li className="flex items-start gap-5 py-2.5">
              <span className="w-1/3 text-sm text-gray-500 dark:text-gray-400">Assigned Staff</span>
              <div className="flex w-2/3 flex-col">
                {ticket.assigned_staff ? (
                  <>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {ticket.assigned_staff.username}
                    </span>
                    <span className="text-xs text-gray-500">{ticket.assigned_staff.email}</span>
                  </>
                ) : (
                  <span className="text-sm text-gray-400">Not assigned yet</span>
                )}
              </div>
            </li>
            <li className="flex items-start gap-5 py-2.5">
              <span className="w-1/3 text-sm text-gray-500 dark:text-gray-400">Approver</span>
              <div className="flex w-2/3 flex-col">
                {ticket.approver ? (
                  <>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {ticket.approver.username}
                    </span>
                    <span className="text-xs text-gray-500">{ticket.approver.email}</span>
                  </>
                ) : (
                  <span className="text-sm text-gray-400">Not approved yet</span>
                )}
              </div>
            </li>
            {ticket.reason && (
              <li className="flex items-start gap-5 py-2.5">
                <span className="w-1/3 text-sm text-gray-500 dark:text-gray-400">Reason</span>
                <span className="w-2/3 text-sm text-error-500 dark:text-error-400">
                  {ticket.reason}
                </span>
              </li>
            )}
            <li className="flex items-start gap-5 py-2.5">
              <span className="w-1/3 text-sm text-gray-500 dark:text-gray-400">Created At</span>
              <span className="w-2/3 text-sm text-gray-700 dark:text-gray-300">
                {new Date(ticket.createdAt).toLocaleString()}
              </span>
            </li>
            <li className="flex items-start gap-5 py-2.5">
              <span className="w-1/3 text-sm text-gray-500 dark:text-gray-400">Last Updated</span>
              <span className="w-2/3 text-sm text-gray-700 dark:text-gray-300">
                {new Date(ticket.updatedAt).toLocaleString()}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}