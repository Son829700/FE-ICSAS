// src/pages/Logs.tsx
import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import API from "../../api";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

interface ApiLog {
  log_id: string;
  user: {
    user_id: string;
    username: string;
    email: string;
    role: string;
  };
  action: string;
  target_entity: string;
  target_id: string;
  created_at: string;
}

const LogsList: React.FC = () => {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [actionFilter, setActionFilter] = useState<
    "ALL" | "CREATE" | "UPDATE" | "DELETE"
  >("ALL");
  const getActionType = (action: string) => {
    if (!action) return "UPDATE";

    if (action.includes("CREATED") || action.includes("ADDED")) {
      return "CREATE";
    }

    if (action.includes("DELETED") || action.includes("REVOKED")) {
      return "DELETE";
    }

    if (
      action.includes("UPDATED") ||
      action.includes("RESTORED") ||
      action.includes("GRANTED")
    ) {
      return "UPDATE";
    }

    return "UPDATE";
  };
  const sortedLogs = [...logs].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const filteredLogs = sortedLogs.filter((log) => {
    if (actionFilter === "ALL") return true;
    return getActionType(log.action) === actionFilter;
  });

  const paginatedLogs = filteredLogs.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  const totalPages = Math.ceil(filteredLogs.length / pageSize);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const res = await API.get("/logs");

      setLogs(res.data.data);
    } catch (error) {
      console.error("Fetch logs error:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchLogs();
  }, []);
  return (
    <>
      <PageMeta
        title="Logs"
        description="View application logs with search, filters and status."
      />
      <PageBreadcrumb pageTitle="Logs" />

      {/* Card chính giống block invoices */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Header: title + filter/search */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Logs
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Latest application and system logs
            </p>
          </div>

          <div className="flex gap-3.5">
            {/* Tabs filter level (All / Error / Warn ...) */}
            <div className="hidden h-11 items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 lg:inline-flex dark:bg-gray-900">
              <button
                onClick={() => setActionFilter("ALL")}
                className={`h-10 rounded-md px-3 py-2 text-sm font-medium ${
                  actionFilter === "ALL"
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-theme-xs"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                All
              </button>

              <button
                onClick={() => setActionFilter("CREATE")}
                className={`h-10 rounded-md px-3 py-2 text-sm font-medium ${
                  actionFilter === "CREATE"
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-theme-xs"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                Create
              </button>

              <button
                onClick={() => setActionFilter("UPDATE")}
                className={`h-10 rounded-md px-3 py-2 text-sm font-medium ${
                  actionFilter === "UPDATE"
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-theme-xs"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                Update
              </button>

              <button
                onClick={() => setActionFilter("DELETE")}
                className={`h-10 rounded-md px-3 py-2 text-sm font-medium ${
                  actionFilter === "DELETE"
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-theme-xs"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                Delete
              </button>
            </div>

            {/* Search + filter + export */}
            <div className="hidden flex-col gap-3 sm:flex sm:flex-row sm:items-center">
              {/* Search input */}
              <div className="relative">
                <span className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  <svg
                    className="fill-current"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search logs..."
                  className="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pr-4 pl-11 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden xl:w-[300px] dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                />
              </div>

              {/* Filter button (mock) */}
              <div className="relative">
                <button
                  type="button"
                  className="shadow-theme-xs flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 sm:w-auto sm:min-w-[100px] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14.6537 5.90414C14.6537 4.48433 13.5027 3.33331 12.0829 3.33331C10.6631 3.33331 9.51206 4.48433 9.51204 5.90415M14.6537 5.90414C14.6537 7.32398 13.5027 8.47498 12.0829 8.47498C10.663 8.47498 9.51204 7.32398 9.51204 5.90415M14.6537 5.90414L17.7087 5.90411M9.51204 5.90415L2.29199 5.90411M5.34694 14.0958C5.34694 12.676 6.49794 11.525 7.91777 11.525C9.33761 11.525 10.4886 12.676 10.4886 14.0958M5.34694 14.0958C5.34694 15.5156 6.49794 16.6666 7.91778 16.6666C9.33761 16.6666 10.4886 15.5156 10.4886 14.0958M5.34694 14.0958L2.29199 14.0958M10.4886 14.0958L17.7087 14.0958"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Filter
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table logs */}
        <div className="overflow-x-auto px-5 pb-4">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                <th className="cursor-pointer p-4 text-left text-xs font-medium text-gray-700 dark:text-gray-400">
                  <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">
                    User
                  </p>
                </th>

                <th className="cursor-pointer p-4 text-left text-xs font-medium text-gray-700 dark:text-gray-400">
                  <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">
                    Type
                  </p>
                </th>

                <th className="cursor-pointer p-4 text-left text-xs font-medium text-gray-700 dark:text-gray-400">
                  <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">
                    Entity
                  </p>
                </th>

                <th className="cursor-pointer p-4 text-left text-xs font-medium text-gray-700 dark:text-gray-400">
                  <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">
                    Time
                  </p>
                </th>

                <th className="p-4 text-center text-xs font-medium text-gray-700 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center p-6">
                    Loading logs...
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr
                    key={log.log_id}
                    className="transition hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <td className="p-4 whitespace-nowrap">
                      <p className="text-sm text-gray-700 dark:text-gray-400">
                        {log.user?.username}
                      </p>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      {(() => {
                        const type = getActionType(log.action);

                        const color =
                          type === "CREATE"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : type === "DELETE"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";

                        return (
                          <span
                            className={`text-xs rounded-full px-2.5 py-1 font-medium ${color}`}
                          >
                            {log.action}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Message */}
                    <td className="p-4 whitespace-nowrap">
                      <p className="text-sm text-gray-700 dark:text-gray-400 max-w-xs truncate">
                        {log.target_entity}
                      </p>
                    </td>

                    {/* User */}
                    <td className="p-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="relative flex justify-center">
                        <button className="text-gray-500 dark:text-gray-400">
                          <svg
                            className="fill-current"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M5.99902 10.245C6.96552 10.245 7.74902 11.0285 7.74902 11.995V12.005C7.74902 12.9715 6.96552 13.755 5.99902 13.755C5.03253 13.755 4.24902 12.9715 4.24902 12.005V11.995C4.24902 11.0285 5.03253 10.245 5.99902 10.245ZM17.999 10.245C18.9655 10.245 19.749 11.0285 19.749 11.995V12.005C19.749 12.9715 18.9655 13.755 17.999 13.755C17.0325 13.755 16.249 12.9715 16.249 12.005V11.995C16.249 11.0285 17.0325 10.245 17.999 10.245ZM13.749 11.995C13.749 11.0285 12.9655 10.245 11.999 10.245C11.0325 10.245 10.249 11.0285 10.249 11.995V12.005C10.249 12.9715 11.0325 13.755 11.999 13.755C12.9655 13.755 13.749 12.9715 13.749 12.005V11.995Z"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-5 py-4 border-t dark:border-gray-800">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>

            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
              >
                Prev
              </button>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LogsList;
