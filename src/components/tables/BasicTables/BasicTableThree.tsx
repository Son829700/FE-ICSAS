import { useState } from "react";

interface Transaction {
  id: number;
  name: string;
  brand: string;
  date: string;
  price: string;
  category: string;
  status: "Success" | "Pending" | "Failed";
}

const DATA: Transaction[] = [
  {
    id: 1,
    name: "Bought PYPL",
    brand: "/images/brand/brand-08.svg",
    date: "Nov 23, 01:00 PM",
    price: "$2,567.88",
    category: "Finance",
    status: "Success",
  },
  {
    id: 2,
    name: "Bought AAPL",
    brand: "/images/brand/brand-07.svg",
    date: "Nov 23, 01:00 PM",
    price: "$2,567.88",
    category: "Finance",
    status: "Pending",
  },
  {
    id: 3,
    name: "Sell KKST",
    brand: "/images/brand/brand-15.svg",
    date: "Nov 23, 01:00 PM",
    price: "$2,567.88",
    category: "Finance",
    status: "Success",
  },
  {
    id: 4,
    name: "Bought FB",
    brand: "/images/brand/brand-02.svg",
    date: "Nov 23, 01:00 PM",
    price: "$2,567.88",
    category: "Finance",
    status: "Success",
  },
  {
    id: 5,
    name: "Sell AMZN",
    brand: "/images/brand/brand-10.svg",
    date: "Nov 23, 01:00 PM",
    price: "$2,567.88",
    category: "Finance",
    status: "Failed",
  },
];

const PAGE_SIZE = 2;

export default function BasicTableThree() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(2);
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const filtered = DATA.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const paginated = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white pt-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* HEADER */}
      <div className="flex flex-col gap-2 px-5 mb-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Latest Transactions
        </h3>

        <form>
          <div className="relative">
            <span className="absolute -translate-y-1/2 left-4 top-1/2 text-gray-400">
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="h-[42px] w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-[42px] pr-4 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 xl:w-[300px]"
            />
          </div>
        </form>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden">
        <div className="max-w-full px-5 overflow-x-auto sm:px-6">
          <table className="min-w-full">
            <thead className="border-y border-gray-100 dark:border-white/[0.05]">
              <tr>
                {["Name", "Date", "Price", "Category", "Status", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-start text-theme-sm font-normal text-gray-500 dark:text-gray-400"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {paginated.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.brand}
                        className="size-8"
                        alt="brand"
                      />
                      <span className="font-medium text-gray-700 text-theme-sm dark:text-gray-400">
                        {item.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-theme-sm text-gray-700 dark:text-gray-400">
                    {item.date}
                  </td>

                  <td className="px-4 py-4 text-theme-sm text-gray-700 dark:text-gray-400">
                    {item.price}
                  </td>

                  <td className="px-4 py-4 text-theme-sm text-gray-700 dark:text-gray-400">
                    {item.category}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-theme-xs font-medium
                        ${
                          item.status === "Success"
                            ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500"
                            : item.status === "Pending"
                            ? "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400"
                            : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500"
                        }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  {/* ACTION */}
                  <td className="px-4 py-4 relative">
                    <button
                      onClick={() =>
                        setOpenMenu(openMenu === item.id ? null : item.id)
                      }
                      className="text-gray-500 dark:text-gray-400"
                    >
                      •••
                    </button>

                    {openMenu === item.id && (
                      <div className="absolute right-0 z-10 mt-2 w-40 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                        <button className="block w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5">
                          View More
                        </button>
                        <button className="block w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5">
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-white/[0.05]">
        <div className="flex items-center justify-between">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-3 text-sm rounded-lg ring-1 ring-gray-300 dark:ring-gray-700"
          >
            Previous
          </button>

          <ul className="hidden sm:flex gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <li key={i}>
                <button
                  onClick={() => setPage(i + 1)}
                  className={`h-10 w-10 rounded-lg text-theme-sm font-medium
                    ${
                      page === i + 1
                        ? "bg-brand-500 text-white"
                        : "text-gray-700 hover:bg-brand-500/[0.08] dark:text-gray-400"
                    }`}
                >
                  {i + 1}
                </button>
              </li>
            ))}
          </ul>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-3 text-sm rounded-lg ring-1 ring-gray-300 dark:ring-gray-700"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
