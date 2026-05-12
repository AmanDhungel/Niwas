import React from "react";
import { Calendar, Wrench, Activity, Eye, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BaseRequest, MOCK_REQUESTS, RequestStatus } from "./schema";

const MyRequestsPage = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      {/* Header & Breadcrumbs */}
      <div className="space-y-1">
        <nav className="flex items-center text-xs text-muted-foreground gap-1">
          <span>🏠</span> <ChevronRight className="h-3 w-3" />{" "}
          <span>My Requests</span>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          My Requests
        </h1>
        <p className="text-sm text-muted-foreground">
          All your tours, maintenance, and service requests
        </p>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Tour Requests"
          value={3}
          icon={<Calendar className="text-blue-500" />}
        />
        <StatCard
          label="Maintenance Requests"
          value={1}
          icon={<Wrench className="text-orange-500" />}
        />
        <StatCard
          label="Total Active"
          value={3}
          icon={<Activity className="text-green-500" />}
        />
      </div>

      {/* Active Requests List */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            All Active Requests
          </h2>
          <div className="space-y-3">
            {MOCK_REQUESTS.map((req) => (
              <RequestListItem key={req.id} request={req} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyRequestsPage;

/**
 * Sub-component: Stat Card
 */
function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border border-slate-100 shadow-sm">
      <CardContent className="p-6 flex justify-between items-center">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Sub-component: Request List Item
 */
function RequestListItem({ request }: { request: BaseRequest }) {
  const isMaintenance = request.type === "Maintenance";

  // Dynamic styling based on request type
  const borderClass = isMaintenance
    ? "border-l-4 border-l-orange-500 border-orange-200"
    : "border-l-4 border-l-blue-500 border-blue-200";

  const iconContainerClass = isMaintenance ? "bg-orange-50" : "bg-blue-50";
  const iconClass = isMaintenance ? "text-orange-500" : "text-blue-500";

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border bg-white transition-all hover:shadow-md ${borderClass}`}>
      <div className="flex items-center gap-4">
        {/* Icon Container */}
        <div className={`p-3 rounded-lg ${iconContainerClass}`}>
          {isMaintenance ? (
            <Wrench className={`h-5 w-5 ${iconClass}`} />
          ) : (
            <Calendar className={`h-5 w-5 ${iconClass}`} />
          )}
        </div>

        {/* Content */}
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900">
            {request.propertyTitle}
          </h3>
          <p className="text-[10px] text-muted-foreground font-medium">
            {request.type} Request • {request.requestId}
          </p>
          <div className="flex gap-2 pt-1">
            <Badge
              variant="secondary"
              className="text-[10px] font-medium bg-slate-100 text-slate-600 border-none">
              {request.subType}
            </Badge>
            <StatusBadge status={request.status} />
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="text-xs font-semibold h-8 gap-2 border-slate-200">
        <Eye className="h-3.5 w-3.5" /> View
      </Button>
    </div>
  );
}

/**
 * Sub-component: Status Badge with specific colors
 */
function StatusBadge({ status }: { status: RequestStatus }) {
  const variants: Record<RequestStatus, string> = {
    Confirmed: "bg-green-100 text-green-700",
    Pending: "bg-yellow-100 text-yellow-700",
    Scheduled: "bg-blue-100 text-blue-700",
  };

  return (
    <Badge
      className={`text-[10px] font-medium border-none shadow-none ${variants[status]}`}>
      {status}
    </Badge>
  );
}
