import { Plus, Eye, Pencil } from "lucide-react";
import ComponentCard from "../components/common/ComponentCard";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import Button from "../components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";

export interface Dashboard {
  dashboard_id: string;
  dashboard_name: string;
  url_path: string;
  category: string;
  created_by: string;
  created_at: string;
}
const dashboards: Dashboard[] = [
  {
    dashboard_id: "dsh-001",
    dashboard_name: "Sales Overview",
    url_path: "/dashboard/sales",
    category: "Business",
    created_by: "admin-uuid",
    created_at: "10 Jan, 2026",
  },
  {
    dashboard_id: "dsh-002",
    dashboard_name: "Customer Analytics",
    url_path: "/dashboard/customer",
    category: "Analytics",
    created_by: "admin-uuid",
    created_at: "18 Jan, 2026",
  },
];

export default function DashboardManagement() {
  return (
    <div>
      <PageMeta
        title="Dashboard Management | Admin"
        description="Manage system dashboards"
      />

      <PageBreadcrumb pageTitle="Dashboard Management" />

      <ComponentCard
        title="Dashboards"
        desc="Manage all dashboards in the system"
        headerAction={
          <Button
            size="md"
            variant="primary"
            startIcon={<Plus className="size-5 text-white" />}
          >
            Create Dashboard
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs text-gray-500">
                  Name
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs text-gray-500">
                  URL Path
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs text-gray-500">
                  Category
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs text-gray-500">
                  Created At
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-right text-theme-xs text-gray-500">
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {dashboards.map((dashboard) => (
                <TableRow key={dashboard.dashboard_id}>
                  <TableCell className="px-5 py-4 font-medium text-gray-800 dark:text-white/90">
                    {dashboard.dashboard_name}
                  </TableCell>

                  <TableCell className="px-5 py-4 text-gray-600 dark:text-gray-400">
                    {dashboard.url_path}
                  </TableCell>

                  <TableCell className="px-5 py-4 text-gray-600 dark:text-gray-400">
                    {dashboard.category}
                  </TableCell>

                  <TableCell className="px-5 py-4 text-gray-500">
                    {dashboard.created_at}
                  </TableCell>

                  <TableCell className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="size-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Pencil className="size-4" />
                      </Button>
                      
                    </div>
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
