import { useEffect, useState } from "react";
import API from "../api";
import Label from "../components/form/Label";
import Button from "../components/ui/button/Button";
import { Modal } from "../components/ui/modal";

interface AddTicketCardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  allowedTypes?: string[]; // nếu truyền vào thì chỉ hiện các type này
}

const TICKET_TYPE_OPTIONS = [
  {
    value: "TYPE1",
    label: "Dashboard Access Request",
    placeholder: `Describe your dashboard access request. For example:
- Name of the dashboard you want to access
- Your current team / department
- Reason for requesting access
- Expected usage frequency (daily, weekly, ...)`,
  },
  {
    value: "TYPE2",
    label: "User Account Management",
    placeholder: `Describe your account update request. For example:
- Change department (from Department X → Department Y)
- Update your role or permissions in the system
- Edit personal information (email, display name, ...)
- Reason for the change`,
  },
  {
    value: "TYPE3",
    label: "Dashboard Development Request",
    placeholder: `Describe the dashboard you want to be built. For example:
- Dashboard name and its purpose
- Key metrics / KPIs to display (revenue, conversion rate, ...)
- Related data sources
- List of users or teams who should have access
- Report type: Traditional (scheduled) or Ad-hoc (on-demand)`,
  },
];

export default function AddTicketCard({
  isOpen,
  onClose,
  onSuccess,
  allowedTypes,
}: AddTicketCardProps) {
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Lọc options theo allowedTypes nếu có
  const filteredOptions = allowedTypes
    ? TICKET_TYPE_OPTIONS.filter((opt) => allowedTypes.includes(opt.value))
    : TICKET_TYPE_OPTIONS;

  useEffect(() => {
    if (isOpen && filteredOptions.length === 1) {
      setType(filteredOptions[0].value);
    }
  }, [isOpen]);

  const selectedType = filteredOptions.find((o) => o.value === type);
  const isSingleType = filteredOptions.length === 1;

  const handleTypeChange = (newType: string) => {
    setType(newType);
    setDescription("");
    setError("");
  };

  const handleCreate = async () => {
    if (!type) {
      setError("Please select a ticket type.");
      return;
    }
    if (!description.trim()) {
      setError("Please enter a description.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // TYPE2 dùng endpoint riêng
      if (type === "TYPE2") {
        await API.post("/tickets/ticket_type2", { type, description });
      } else {
        await API.post("/tickets", { type, description });
      }

      setDescription("");
      if (!isSingleType) setType("");

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to create ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDescription("");
    setError("");
    // Chỉ reset type nếu không phải single type
    if (!isSingleType) setType("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[620px] m-4">
      <div className="relative w-full rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-10">
        {/* HEADER */}
        <div className="mb-6">
          <h4 className="mb-1 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Create Ticket
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isSingleType
              ? `Submitting a ${selectedType?.label} request.`
              : "Select a ticket type and describe your request."}
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {/* TICKET TYPE */}
          {isSingleType ? (
            /* Nếu chỉ có 1 type → hiện badge thay vì select */
            <div>
              <Label>Ticket Type</Label>
              <div className="flex h-11 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 dark:border-gray-700 dark:bg-gray-800">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {selectedType?.label}
                </span>
                <span className="ml-auto inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  {type}
                </span>
              </div>
            </div>
          ) : (
            /* Nhiều type → dropdown như bình thường */
            <div>
              <Label>Ticket Type</Label>
              <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                <option value="">-- Select ticket type --</option>
                {filteredOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* DESCRIPTION */}
          <div>
            <Label>Description</Label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setError("");
              }}
              placeholder={
                selectedType
                  ? selectedType.placeholder
                  : "Select a ticket type to see guidance..."
              }
              rows={7}
              disabled={!type}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:placeholder-gray-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            />
            {type && (
              <p className="mt-1 text-right text-xs text-gray-400">
                {description.length} characters
              </p>
            )}
          </div>

          {/* ERROR */}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* FOOTER */}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={loading || !type || !description.trim()}
          >
            {loading ? "Creating..." : "Create Ticket"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
