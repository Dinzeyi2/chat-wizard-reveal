
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Reusable card component for metrics
const MetricCard = ({ title, value, description }: {
  title: string;
  value: string;
  description: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
    </CardContent>
  </Card>
);

// Mock chart component
const Chart = () => (
  <div className="h-[200px] w-full rounded-md bg-slate-100"></div>
);

// Mock recent sales component
const RecentSales = () => (
  <div className="space-y-8">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center">
        <div className="space-y-1">
          <p className="text-sm font-medium leading-none">Customer {i+1}</p>
          <p className="text-sm text-muted-foreground">email{i+1}@example.com</p>
        </div>
        <div className="ml-auto font-medium">+${(Math.random() * 1000).toFixed(2)}</div>
      </div>
    ))}
  </div>
);

// Dashboard component
export default function Dashboard() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <button className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
            Download
          </button>
        </div>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Revenue"
              value="$45,231.89"
              description="+20.1% from last month"
            />
            <MetricCard
              title="Subscriptions"
              value="+2350"
              description="+180.1% from last month"
            />
            <MetricCard
              title="Sales"
              value="+12,234"
              description="+19% from last month"
            />
            <MetricCard
              title="Active Users"
              value="+573"
              description="+201 since last hour"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <Chart />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>
                  You made 265 sales this month.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentSales />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <Chart />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Reports</CardTitle>
                <CardDescription>
                  Summary of your monthly reports.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Report {i+1}</p>
                        <p className="text-sm text-muted-foreground">PDF Report</p>
                      </div>
                      <div className="ml-auto font-medium">View</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>
                Monthly generated reports and analytics data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">Report {i+1}</p>
                      <p className="text-sm text-muted-foreground">
                        Generated on {new Date().toLocaleDateString()}
                      </p>
                    </div>
                    <button className="text-sm text-blue-500 hover:underline">
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
