import { useState } from "react";
import { Plus, Search, ChevronUp, ChevronDown, Users } from "lucide-react";
import AddGroupModal from "../components/card/AddGroupModal";
import Button from "../components/ui/button/Button";

type Group = {
  id: number;
  name: string;
  type: string;
  department: string;
  members: number;
};

const mockGroups: Group[] = [
  { id: 1, name: "Marketing", type: "Traditional", department: "Marketing", members: 12 },
  { id: 2, name: "Sales Team A", type: "Adhoc", department: "Sales", members: 8 },
  { id: 3, name: "BI Team", type: "Traditional", department: "Data", members: 6 },
  { id: 4, name: "Project Phoenix", type: "Adhoc", department: "IT", members: 10 },
];

export default function GroupManagement() {
  const [search, setSearch] = useState("");
  const [pageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [sortKey, setSortKey] = useState<keyof Group>("name");
  const [sortAsc, setSortAsc] = useState(true);

  const filteredData = mockGroups
    .filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a[sortKey] < b[sortKey]) return sortAsc ? -1 : 1;
      if (a[sortKey] > b[sortKey]) return sortAsc ? 1 : -1;
      return 0;
    });

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const pagedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleSort = (key: keyof Group) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return (
    <div>
      <div className="overflow-hidden rounded-xl bg-white dark:bg-white/[0.03]">
        {/* Top controls */}
        <div className="flex flex-col gap-3 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] sm:flex-row sm:items-center sm:justify-between">
          <Button
            size="md"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg bg-brand-500 hover:bg-brand-600"
          >
            <Plus size={16} />
            Create Group
          </Button>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              placeholder="Search group..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent pl-10 pr-4 text-sm
                         text-gray-700 dark:text-gray-300
                         dark:border-gray-700 dark:bg-gray-900 xl:w-[300px]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-t border-gray-100 dark:border-white/[0.05]">
              <tr>
                {[
                  { key: "name", label: "Group Name" },
                  { key: "type", label: "Type" },
                  { key: "department", label: "Department" },
                  { key: "members", label: "Members" },
                ].map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
                  >
                    <div
                      onClick={() => toggleSort(col.key as keyof Group)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-400">
                        {col.label}
                      </p>
                      <div className="flex flex-col">
                        <ChevronUp
                          size={12}
                          className={
                            sortKey === col.key && sortAsc
                              ? "text-brand-500"
                              : "text-gray-300 dark:text-gray-600"
                          }
                        />
                        <ChevronDown
                          size={12}
                          className={
                            sortKey === col.key && !sortAsc
                              ? "text-brand-500"
                              : "text-gray-300 dark:text-gray-600"
                          }
                        />
                      </div>
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-xs font-medium text-gray-700 dark:text-gray-400">
                  Action
                </th>
              </tr>
            </thead>

            {/* 👇 gom màu chữ tại đây */}
            <tbody className="text-sm text-gray-700 dark:text-gray-300">
              {pagedData.map((group) => (
                <tr key={group.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-4 border border-gray-100 dark:border-white/[0.05]">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-gray-400 dark:text-gray-500" />
                      {group.name}
                    </div>
                  </td>
                  <td className="px-4 py-4 border border-gray-100 dark:border-white/[0.05]">
                    {group.type}
                  </td>
                  <td className="px-4 py-4 border border-gray-100 dark:border-white/[0.05]">
                    {group.department}
                  </td>
                  <td className="px-4 py-4 border border-gray-100 dark:border-white/[0.05]">
                    {group.members}
                  </td>
                  <td className="px-4 py-4 border border-gray-100 dark:border-white/[0.05]">
                    <button className="text-sm text-brand-500 dark:text-brand-400 hover:underline">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-4 border-t border-gray-100 dark:border-white/[0.05]">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-3 py-1 text-sm border rounded
                         text-gray-700 dark:text-gray-300
                         border-gray-300 dark:border-gray-700
                         disabled:opacity-50"
            >
              Prev
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1 text-sm border rounded
                         text-gray-700 dark:text-gray-300
                         border-gray-300 dark:border-gray-700
                         disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <AddGroupModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
