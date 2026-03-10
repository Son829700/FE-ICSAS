import { FileText, UserCheck, Loader2, CheckCircle } from "lucide-react";

export default function TicketDetail() {
  const ticket = {
    ticket_id: "9a2f-xxxx-xxxx",
    requester_id: "abc@fpt",
    type: "ACCESS_REQUEST",
    description: "Request access to Sales Dashboard",
    status: "APPROVED",
    assigned_staff: "manager@fpt",
    created_at: "Marketing",
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
      <h2 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
        Ticket History
      </h2>

      {/* HORIZONTAL TIMELINE */}
      <div className="relative flex items-start justify-between">
        {/* LINE */}
        <div className="absolute top-6 left-0 right-0 h-px border-t border-dashed border-gray-300 dark:border-gray-700" />

        {/* STEP 1 */}
        <div className="relative z-10 flex w-full flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-50 bg-white text-gray-700 ring ring-gray-200 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:ring-gray-800">
            <FileText className="size-5" />
          </div>
          <h4 className="mt-3 font-medium text-gray-800 dark:text-white/90">
            Ticket Created
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            User submitted request
          </p>
          <span className="mt-1 text-xs text-gray-400">
            09:15 • 12 Apr 2028
          </span>
        </div>

        {/* STEP 2 */}
        <div className="relative z-10 flex w-full flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-50 bg-white text-gray-700 ring ring-gray-200 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:ring-gray-800">
            <UserCheck className="size-5" />
          </div>
          <h4 className="mt-3 font-medium text-gray-800 dark:text-white/90">
            Assigned
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Assigned to IT Staff
          </p>
          <span className="mt-1 text-xs text-gray-400">
            10:02 • 12 Apr 2028
          </span>
        </div>

        {/* STEP 3 */}
        <div className="relative z-10 flex w-full flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-50 bg-white text-gray-700 ring ring-gray-200 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:ring-gray-800">
            <Loader2 className="size-5 animate-spin" />
          </div>
          <h4 className="mt-3 font-medium text-gray-800 dark:text-white/90">
            In Progress
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Investigating issue
          </p>
          <span className="mt-1 text-xs text-gray-400">
            11:30 • 12 Apr 2028
          </span>
        </div>

        {/* STEP 4 */}
        <div className="relative z-10 flex w-full flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-orange-200 bg-orange-50 text-green-600 ring ring-orange-200 dark:border-orange-800 dark:bg-orange-900/40 dark:text-orange-400 dark:ring-orange-800">
            <CheckCircle className="size-5 text-orange-600 dark:text-orange-400" />
          </div>
          <h4 className="mt-3 font-medium text-gray-800 dark:text-white/90">
            Resolved
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Ticket approved & closed
          </p>
          <span className="mt-1 text-xs text-gray-400">
            14:10 • 12 Apr 2028
          </span>
        </div>
      </div>

      {/* ACTIONS */}

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
        <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
          Ticket Details
        </h2>

        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          <li className="flex items-start gap-5 py-2.5">
            <span className="w-1/2 text-sm text-gray-500 sm:w-1/3 dark:text-gray-400">
              Ticket ID
            </span>
            <span className="w-1/2 text-sm text-gray-700 sm:w-2/3 dark:text-gray-300">
              {ticket.ticket_id}
            </span>
          </li>

          <li className="flex items-start gap-5 py-2.5">
            <span className="w-1/2 text-sm text-gray-500 sm:w-1/3 dark:text-gray-400">
              Requester email
            </span>
            <span className="w-1/2 text-sm text-gray-700 sm:w-2/3 dark:text-gray-300">
              {ticket.requester_id}
            </span>
          </li>

          <li className="flex items-start gap-5 py-2.5">
            <span className="w-1/2 text-sm text-gray-500 sm:w-1/3 dark:text-gray-400">
              Ticket Type
            </span>
            <span className="w-1/2 text-sm font-medium text-gray-700 sm:w-2/3 dark:text-gray-300">
              {ticket.type}
            </span>
          </li>

          <li className="flex items-start gap-5 py-2.5">
            <span className="w-1/2 text-sm text-gray-500 sm:w-1/3 dark:text-gray-400">
              Description
            </span>
            <span className="w-1/2 text-sm text-gray-700 sm:w-2/3 dark:text-gray-300">
              {ticket.description}
            </span>
          </li>

          <li className="flex items-start gap-5 py-2.5">
            <span className="w-1/2 text-sm text-gray-500 sm:w-1/3 dark:text-gray-400">
              Status
            </span>
            <span
              className="w-1/2 text-sm font-semibold sm:w-2/3
        text-green-600 dark:text-green-400"
            >
              {ticket.status}
            </span>
          </li>

          <li className="flex items-start gap-5 py-2.5">
            <span className="w-1/2 text-sm text-gray-500 sm:w-1/3 dark:text-gray-400">
              Manager
            </span>
            <span className="w-1/2 text-sm text-gray-700 sm:w-2/3 dark:text-gray-300">
              {ticket.assigned_staff || "Not assigned"}
            </span>
          </li>

          <li className="flex items-start gap-5 py-2.5">
            <span className="w-1/2 text-sm text-gray-500 sm:w-1/3 dark:text-gray-400">
              Department
            </span>
            <span className="w-1/2 text-sm text-gray-700 sm:w-2/3 dark:text-gray-300">
              {ticket.created_at}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
