import { useState } from "react";
import { Send } from "lucide-react";

type TicketStatus = "PENDING" | "APPROVED" | "REJECTED";

export default function TicketDetailManager() {
  const ticket = {
    id: "9a2f-xxxx",
    requester: "abc@fpt",
    status: "PENDING" as TicketStatus,
    description: "Request access to Sales Dashboard",
    assignedBI: null,
  };

  /* ===== FORM STATE ===== */
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [assignBI, setAssignBI] = useState("");
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (!status) return;

    const payload = {
      ticketId: ticket.id,
      status,
      assignBI: assignBI || null,
      comment: comment.trim() || null,
      role: "MANAGER",
    };

    console.log("Submit payload:", payload);
    // TODO: call API
  };

  return (
    <div className="space-y-6">
      {/* ===== TICKET DETAILS ===== */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
        <h2 className="mb-4 text-lg font-semibold">Ticket Details</h2>

        <ul className="divide-y dark:divide-gray-800">
          <DetailRow label="Ticket ID" value={ticket.id} />
          <DetailRow label="Requester" value={ticket.requester} />
          <DetailRow label="Description" value={ticket.description} />
          <DetailRow
            label="Status"
            value={
              <span className="font-semibold text-orange-600">
                {ticket.status}
              </span>
            }
          />
        </ul>
      </div>

      {/* ===== ACTION + COMMENTS (ONE FORM) ===== */}
      <div className="grid gap-6 lg:grid-cols-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="lg:col-span-3 grid gap-6 lg:grid-cols-3"
        >
          {/* COMMENTS */}
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
            <h3 className="mb-4 font-semibold">Comment (optional)</h3>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-lg border p-3 text-sm"
              placeholder="Add internal comment..."
              rows={8}
            />

            {/* EXISTING COMMENTS
            <div className="mt-4 space-y-3">
              <CommentItem
                author="Manager"
                content="Approved and forwarded to BI"
              />
            </div> */}
          </div>
          {/* ACTION PANEL */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
            <h3 className="mb-4 font-semibold">Manager Actions</h3>

            {/* STATUS */}
            <label className="text-sm text-gray-500">
              Update Status <span className="text-red-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TicketStatus)}
              className="mt-1 w-full rounded-lg border p-2 text-sm"
              required
            >
              <option value="">Select status</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {/* ASSIGN BI */}
            <label className="mt-4 block text-sm text-gray-500">
              Assign to BI
            </label>
            <select
              value={assignBI}
              onChange={(e) => setAssignBI(e.target.value)}
              className="mt-1 w-full rounded-lg border p-2 text-sm"
            >
              <option value="">Select BI Staff</option>
              <option value="bi1@fpt.vn">bi1@fpt.vn</option>
              <option value="bi2@fpt.vn">bi2@fpt.vn</option>
            </select>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={!status}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              <Send className="size-4" />
              Update Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ===== SMALL COMPONENTS ===== */

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <li className="flex gap-5 py-2.5">
      <span className="w-1/3 text-sm text-gray-500">{label}</span>
      <span className="w-2/3 text-sm text-gray-700 dark:text-gray-300">
        {value}
      </span>
    </li>
  );
}

// function CommentItem({ author, content }: { author: string; content: string }) {
//   return (
//     <div className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800">
//       <p className="font-medium">{author}</p>
//       <p className="text-gray-600 dark:text-gray-400">{content}</p>
//     </div>
//   );
// }
