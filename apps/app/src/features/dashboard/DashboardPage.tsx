"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@myapp/ui/components/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@myapp/ui/components/table";
import { Badge } from "@myapp/ui/components/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@myapp/ui/components/chart";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

type CustomerRow = {
  id: string;
  customer: string;
  email: string;
  plan: string;
  status: "active" | "trial" | "paused";
  joinedAt: string;
};

const TABLE_ROWS: CustomerRow[] = [
  {
    id: "cus_001",
    customer: "Alice Kim",
    email: "alice.kim@example.com",
    plan: "Pro",
    status: "active",
    joinedAt: "2025-01-12",
  },
  {
    id: "cus_002",
    customer: "Minho Park",
    email: "minho.park@example.com",
    plan: "Starter",
    status: "trial",
    joinedAt: "2025-02-03",
  },
  {
    id: "cus_003",
    customer: "Jisoo Lee",
    email: "jisoo.lee@example.com",
    plan: "Business",
    status: "paused",
    joinedAt: "2025-02-20",
  },
];

const REVENUE_DATA: Array<{ month: string; revenue: number }> = [
  { month: "Jan", revenue: 12000 },
  { month: "Feb", revenue: 15000 },
  { month: "Mar", revenue: 18000 },
  { month: "Apr", revenue: 16000 },
  { month: "May", revenue: 21000 },
  { month: "Jun", revenue: 24000 },
];

export function DashboardPage() {
  const t = useTranslations("DashboardPage");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
        {/* <div className="flex items-center space-x-2">
          <Button>Download</Button>
        </div> */}
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("metrics.revenue")}</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">$24,000</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("metrics.activeUsers")}</CardTitle>
            <CardDescription>Currently online</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">1,284</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("metrics.newCustomers")}</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">96</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("metrics.churnRate")}</CardTitle>
            <CardDescription>Monthly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">2.3%</div>
          </CardContent>
        </Card>
      </div>

      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>{t("chart.title")}</CardTitle>
            <CardDescription>FY 2025</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: {
                  label: t("metrics.revenue"),
                  color: "hsl(var(--chart-1))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={REVENUE_DATA} margin={{ left: 4, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>{t("table.title")}</CardTitle>
            <CardDescription>Last updated 3 mins ago</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.columns.customer")}</TableHead>
                  <TableHead>{t("table.columns.email")}</TableHead>
                  <TableHead>{t("table.columns.plan")}</TableHead>
                  <TableHead>{t("table.columns.status")}</TableHead>
                  <TableHead className="text-right">
                    {t("table.columns.joinedAt")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TABLE_ROWS.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.customer}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.email}
                    </TableCell>
                    <TableCell>{row.plan}</TableCell>
                    <TableCell>
                      {row.status === "active" && (
                        <Badge variant="default">active</Badge>
                      )}
                      {row.status === "trial" && (
                        <Badge variant="secondary">trial</Badge>
                      )}
                      {row.status === "paused" && (
                        <Badge variant="outline">paused</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{row.joinedAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
