import { useEffect, useState } from "react";
import API from "../../api";
import { PlusIcon } from "lucide-react";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import CreateTicketModal from "./../AddTicketCard";

interface Ticket {
  id: string;
  customer: {
    name: string;
    email: string;
    avatar: string;
  };
  subject: string;
  createdAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SOLVED";
}


export default function SupportTicketPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [tickets, setTicket] = useState<Ticket[]>([]);

  const totalTickets = tickets.length;
  const pendingTickets = tickets.filter(
    (ticket) => ticket.status === "PENDING",
  ).length;
  const rejectedTickets = tickets.filter(
    (ticket) => ticket.status === "REJECTED",
  ).length;
  const solvedTickets = tickets.filter(
    (ticket) => ticket.status === "SOLVED",
  ).length;
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await API.get("/tickets");
        setTicket(response.data.data);
        console.log("API response:", response.data);
      } catch (error) {
        console.error("Fetch error in DashboardManagement:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <CreateTicketModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      {/* META */}
      <PageMeta
        title="Support Ticket | Admin Dashboard"
        description="Manage and track customer support tickets"
      />

      {/* BREADCRUMB */}
      {/* <PageBreadcrumb pageTitle="Support Ticket" /> */}

      {/* ===== STATS ===== */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
        <ComponentCard title="Total Tickets">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            {totalTickets.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            All support tickets
          </p>
        </ComponentCard>

        <ComponentCard title="Pending Tickets">
          <h3 className="text-2xl font-bold text-warning-500">
            {pendingTickets.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Waiting for response
          </p>
        </ComponentCard>

        <ComponentCard title="Solved Tickets">
          <h3 className="text-2xl font-bold text-success-500">
            {solvedTickets.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Successfully resolved
          </p>
        </ComponentCard>
        <ComponentCard title="Rejected Tickets">
          <h3 className="text-2xl font-bold text-error-500">
            {rejectedTickets.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Rejected
          </p>
        </ComponentCard>
      </div>

      {/* ===== TABLE ===== */}
      <ComponentCard
        title="Support Tickets"
        desc="Your most recent support tickets list"
        headerAction={
          <Button
            size="md"
            variant="primary"
            startIcon={<PlusIcon className="size-5 text-white" />}
            onClick={() => setIsOpen(true)}
          >
            Create Ticket
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <Table>
            {/* Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs text-gray-500"
                >
                  Ticket ID
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs text-gray-500"
                >
                  Requested By
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs text-gray-500"
                >
                  Subject
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs text-gray-500"
                >
                  Created
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs text-gray-500"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-right text-theme-xs text-gray-500"
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  {/* ID */}
                  <TableCell className="px-5 py-4 text-theme-sm font-medium">
                    {ticket.id}
                  </TableCell>

                  {/* Customer */}
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={ticket.customer.avatar}
                        alt={ticket.customer.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white/90">
                          {ticket.customer.name}
                        </p>
                        <p className="text-theme-xs text-gray-500">
                          {ticket.customer.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Subject */}
                  <TableCell className="px-5 py-4 text-gray-700 dark:text-gray-300">
                    {ticket.subject}
                  </TableCell>

                  {/* Date */}
                  <TableCell className="px-5 py-4 text-gray-500">
                    {ticket.createdAt}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="px-5 py-4">
                    <Badge
                      size="sm"
                      color={ticket.status === "SOLVED" ? "success" : "warning"}
                    >
                      {ticket.status}
                    </Badge>
                  </TableCell>

                  {/* Action */}
                  <TableCell className="px-5 py-4 text-right">
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ComponentCard>
    </div>
  );
}
