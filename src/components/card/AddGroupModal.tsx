import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";

interface AddGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddGroupModal({
  isOpen,
  onClose,
}: AddGroupModalProps) {
  const handleCreate = () => {
    console.log("Create group...");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[700px] m-4">
      <div className="relative w-full rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        {/* Header */}
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Add New Group
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Fill in the details to create a new group.
          </p>
        </div>

        {/* Form */}
        <form className="flex flex-col">
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
            {/* Group Name */}
            <div className="lg:col-span-2">
              <Label>Group Name</Label>
              <Input type="text" placeholder="Marketing Team" />
            </div>

            {/* Group Type */}
            <div>
              <Label>Group Type</Label>
              <Input type="text" placeholder="Traditional / Adhoc" />
            </div>

            {/* Department */}
            <div>
              <Label>Department</Label>
              <Input type="text" placeholder="Marketing / Sales / IT" />
            </div>

            {/* Description */}
            <div className="lg:col-span-2">
              <Label>Description</Label>
              <Input type="text" placeholder="Group description..." />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate}>
              Create Group
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
