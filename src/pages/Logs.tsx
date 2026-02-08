// src/pages/Logs.tsx
import React from "react";
import PageMeta from "../components/common/PageMeta";
// import PageBreadcrumb from "../components/common/PageBreadCrumb";

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

interface LogItem {
  id: number;
  time: string;
  level: LogLevel;
  message: string;
  user: string;
  source: string;
  status: "New" | "Processing" | "Resolved";
}

const mockLogs: LogItem[] = [
  {
    id: 1,
    time: "2026-01-03 20:10:25",
    level: "ERROR",
    message: "Login failed: invalid credentials",
    user: "user_a",
    source: "AuthService",
    status: "New",
  },
  {
    id: 2,
    time: "2026-01-03 20:05:10",
    level: "WARN",
    message: "High response time on /api/orders",
    user: "system",
    source: "APIGateway",
    status: "Processing",
  },
  {
    id: 3,
    time: "2026-01-03 19:50:03",
    level: "INFO",
    message: "User updated profile successfully",
    user: "user_b",
    source: "UserService",
    status: "Resolved",
  },
  {
    id: 4,
    time: "2026-01-03 19:45:41",
    level: "DEBUG",
    message: "Cron job started: sync-report",
    user: "system",
    source: "Scheduler",
    status: "Resolved",
  },
];

const LogsList: React.FC = () => {
  return (
    <>
      <PageMeta
        title="Logs"
        description="View application logs with search, filters and status."
      />
      {/* <PageBreadcrumb pageTitle="Logs" /> */}

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
              <button className="text-theme-sm h-10 rounded-md px-3 py-2 font-medium hover:text-gray-900 dark:hover:text-white shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800">
                All Logs
              </button>
              <button className="text-theme-sm h-10 rounded-md px-3 py-2 font-medium hover:text-gray-900 dark:hover:text-white text-gray-500 dark:text-gray-400">
                Errors
              </button>
              <button className="text-theme-sm h-10 rounded-md px-3 py-2 font-medium hover:text-gray-900 dark:hover:text-white text-gray-500 dark:text-gray-400">
                Warnings
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
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                {/* checkbox + ID */}
                <th className="p-4">
                  <div className="flex w-full cursor-pointer items-center justify-between">
                    <div className="flex items-center gap-3">
                      <label className="flex cursor-pointer items-center text-sm font-medium text-gray-700 select-none dark:text-gray-400">
                        <span className="relative">
                          <input type="checkbox" className="sr-only" />
                          <span className="flex h-4 w-4 items-center justify-center rounded-sm border-[1.25px] bg-transparent border-gray-300 dark:border-gray-700">
                            <span className="opacity-0">
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M10 3L4.5 8.5L2 6"
                                  stroke="white"
                                  strokeWidth="1.6666"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                          </span>
                        </span>
                      </label>
                      <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">
                        Log ID
                      </p>
                    </div>
                  </div>
                </th>

                <th className="cursor-pointer p-4 text-left text-xs font-medium text-gray-700 dark:text-gray-400">
                  <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">
                    Time
                  </p>
                </th>

                <th className="cursor-pointer p-4 text-left text-xs font-medium text-gray-700 dark:text-gray-400">
                  <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">
                    Level
                  </p>
                </th>

                <th className="cursor-pointer p-4 text-left text-xs font-medium text-gray-700 dark:text-gray-400">
                  <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">
                    Message
                  </p>
                </th>

                <th className="cursor-pointer p-4 text-left text-xs font-medium text-gray-700 dark:text-gray-400">
                  <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">
                    User
                  </p>
                </th>

                <th className="cursor-pointer p-4 text-left text-xs font-medium text-gray-700 dark:text-gray-400">
                  <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">
                    Source
                  </p>
                </th>

                <th className="cursor-pointer p-4 text-left text-xs font-medium text-gray-700 dark:text-gray-400">
                  <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">
                    Status
                  </p>
                </th>

                <th className="p-4 text-center text-xs font-medium text-gray-700 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {mockLogs.map((log) => (
                <tr
                  key={log.id}
                  className="transition hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  {/* Checkbox + ID */}
                  <td className="p-4 whitespace-nowrap">
                    <div className="group flex items-center gap-3">
                      <label className="flex cursor-pointer items-center text-sm font-medium text-gray-700 select-none dark:text-gray-400">
                        <span className="relative">
                          <input type="checkbox" className="sr-only" />
                          <span className="flex h-4 w-4 items-center justify-center rounded-sm border-[1.25px] bg-transparent border-gray-300 dark:border-gray-700">
                            <span className="opacity-0">
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M10 3L4.5 8.5L2 6"
                                  stroke="white"
                                  strokeWidth="1.6666"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                          </span>
                        </span>
                      </label>
                      <p className="text-theme-xs font-medium text-gray-700 group-hover:underline dark:text-gray-400">
                        #{log.id.toString().padStart(6, "0")}
                      </p>
                    </div>
                  </td>

                  {/* Time */}
                  <td className="p-4 whitespace-nowrap">
                    <p className="text-sm text-gray-700 dark:text-gray-400">
                      {log.time}
                    </p>
                  </td>

                  {/* Level */}
                  <td className="p-4 whitespace-nowrap">
                    <span
                      className={
                        "text-theme-xs rounded-full px-2 py-0.5 font-medium " +
                        (log.level === "ERROR"
                          ? "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500"
                          : log.level === "WARN"
                          ? "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-500"
                          : log.level === "INFO"
                          ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400")
                      }
                    >
                      {log.level}
                    </span>
                  </td>

                  {/* Message */}
                  <td className="p-4 whitespace-nowrap">
                    <p className="text-sm text-gray-700 dark:text-gray-400 max-w-xs truncate">
                      {log.message}
                    </p>
                  </td>

                  {/* User */}
                  <td className="p-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                      {log.user}
                    </span>
                  </td>

                  {/* Source */}
                  <td className="p-4 whitespace-nowrap">
                    <p className="text-sm text-gray-700 dark:text-gray-400">
                      {log.source}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="p-4 whitespace-nowrap">
                    <span
                      className={
                        "text-theme-xs rounded-full px-2 py-0.5 font-medium " +
                        (log.status === "New"
                          ? "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500"
                          : log.status === "Processing"
                          ? "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-500"
                          : "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500")
                      }
                    >
                      {log.status}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default LogsList;
