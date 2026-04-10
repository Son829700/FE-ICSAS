import React, { useState, useEffect } from "react";
import API from "../../api";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import { Check, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface ReviewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string | null;
  onSuccess: () => void;
}

const TICKET_TYPE_MAP: Record<string, string> = {
  TYPE1: "Dashboard Access Request",
  TYPE2: "User Account Management",
  TYPE3: "Dashboard Development Request",
};

const statusColorMap: Record<string, "success" | "warning" | "error" | "info"> = {
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

export default function ReviewTicketModal({
  isOpen,
  onClose,
  ticketId,
  onSuccess,
}: ReviewTicketModalProps) {
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submittingAction, setSubmittingAction] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (isOpen && ticketId) {
      fetchTicket();
    } else {
      setTicket(null);
      setReason("");
      setSubmittingAction(null);
    }
  }, [isOpen, ticketId]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/tickets/${ticketId}`);
      setTicket(res.data.data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load ticket.");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: "APPROVED" | "REJECTED") => {
    if (action === "REJECTED" && !reason.trim()) {
      toast.error("Reason is required when rejecting a ticket.");
      return;
    }

    try {
      setSubmittingAction(action);
      if (action === "APPROVED") {
        await API.post(`/tickets/${ticketId}/status/APPROVED`, null, {
          params: { reason: reason.trim() || undefined }
        });
      } else {
        await API.post(`/tickets/reject/${ticketId}`, null, {
          params: { reason: reason.trim() },
        });
      }

      toast.success(
        `Ticket ${action.toLowerCase()} successfully!`
      );
      onSuccess();
    } catch (error) {
      console.error("Update error:", error);
      toast.error(`Failed to ${action.toLowerCase()} ticket.`);
    } finally {
      setSubmittingAction(null);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[700px] m-4">
      <div className="relative w-full rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h4 className="mb-1 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Review Ticket
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Review the details and approve or reject the request.
            </p>
          </div>
          {ticket && (
            <Badge size="md" color={statusColorMap[ticket.status] ?? "info"}>
              {ticket.status.replace(/_/g, " ")}
            </Badge>
          )}
        </div>

        {loading || !ticket ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-brand-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* TICKET DETAILS */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Requester</p>
                  <p className="mt-1 flex flex-col">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{ticket.requester?.username}</span>
                    <span className="text-sm text-gray-500">{ticket.requester?.email}</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Department</p>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                    {ticket.requester?.department?.department_name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Ticket Type</p>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                    {TICKET_TYPE_MAP[ticket.type] || ticket.type}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Created At</p>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Description</p>
                <div className="mt-1 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 whitespace-pre-wrap">
                  {ticket.description}
                </div>
              </div>
            </div>

            {/* ACTION SECTION */}
            {ticket.status === "CREATED" ? (
              <div className="mt-6 flex flex-col gap-4">
                <div>
                  <label className="mb-2 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                    <span>Reason / Notes</span>
                    <span className="text-xs font-normal text-gray-500">(Required for Reject, Optional for Approve)</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason or notes here..."
                    rows={4}
                    className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-all resize-none"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={onClose} disabled={!!submittingAction}>
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    className="border-error-500 text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10 focus:ring-error-500"
                    onClick={() => handleAction("REJECTED")}
                    disabled={!reason.trim() || !!submittingAction}
                    startIcon={
                      submittingAction === "REJECTED" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <X className="size-4" />
                      )
                    }
                  >
                    {submittingAction === "REJECTED" ? "Rejecting..." : "Reject"}
                  </Button>
                  <Button
                    variant="primary"
                    className="bg-brand-500 hover:bg-brand-600 focus:ring-brand-500"
                    onClick={() => handleAction("APPROVED")}
                    disabled={!!submittingAction}
                    startIcon={
                      submittingAction === "APPROVED" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )
                    }
                  >
                    {submittingAction === "APPROVED" ? "Approving..." : "Approve"}
                  </Button>
                </div>
              </div>
            ) : (
               <div className="rounded-2xl border border-warning-200 bg-warning-50 p-4 dark:border-warning-800/30 dark:bg-warning-900/20">
                <p className="text-center text-sm font-medium text-warning-800 dark:text-warning-300">
                  This ticket has already been processed ({ticket.status.toLowerCase()}).
                </p>
                <div className="mt-4 flex justify-center">
                   <Button variant="outline" onClick={onClose}>
                     Close
                   </Button>
                </div>
               </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
