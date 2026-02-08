import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Button from "../components/ui/button/Button";
import { Modal } from "../components/ui/modal";

interface AddTicketCardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddTicketCard({
  isOpen,
  onClose,
}: AddTicketCardProps) {
  const handleCreate = () => {
    console.log("Create ticket...");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[700px] m-4">
      <div className="relative w-full rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        {/* HEADER */}
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Create Ticket
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Fill in the details to create a new ticket.
          </p>
        </div>

        {/* FORM */}
        <form className="flex flex-col">
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
            {/* STAFF NAME */}
            <div>
              <Label>Staff Name</Label>
              <Input type="text" placeholder="Nguyen Van A" />
            </div>

            {/* EMAIL */}
            <div>
              <Label>Email</Label>
              <Input type="email" placeholder="staff@company.com" />
            </div>

            {/* DEPARTMENT */}
            <div className="lg:col-span-2">
              <Label>Department</Label>
              <Input type="text" placeholder="IT / HR / Marketing" />
            </div>

            {/* TICKET TYPE */}
            <div>
              <Label>Ticket Type</Label>
              <select className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <option value="">Select type</option>
                <option value="ACCESS_REQUEST">ACCESS_REQUEST</option>
                <option value="CUSTOM_DASHBOARD">CUSTOM_DASHBOARD</option>
              </select>
            </div>

            {/* STATUS */}
            <div>
              <Label>Status</Label>
              <select className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            {/* ASSIGNED STAFF */}
            <div className="lg:col-span-2">
              <Label>Assigned Staff (UUID)</Label>
              <Input type="text" placeholder="UUID of assigned staff" />
            </div>

            {/* DESCRIPTION */}
            <div className="lg:col-span-2">
              <Label>Description</Label>
              <Input type="text" placeholder="Describe the ticket request" />
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate}>
              Create Ticket
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
