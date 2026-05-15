"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Clock,
  Home,
  MessageSquare,
  ExternalLink,
  Trash2,
  X,
} from "lucide-react";
import { RequestTourDialog } from "./RequestTourDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils copy";
import {
  useCancelPropertyTour,
  useGetPropertyTour,
} from "@/services/propertytour.service";
import { useQueryClient } from "@tanstack/react-query";

export default function PropertyTours() {
  const { data, isLoading } = useGetPropertyTour();

  const toursList = Array.isArray(data?.data) ? data.data : data ? [data] : [];

  const totalRequests = toursList.length;
  const confirmedCount = toursList.filter(
    (tour: any) => tour.status?.toLowerCase() === "confirmed",
  ).length;
  const pendingCount = toursList.filter(
    (tour: any) => tour.status?.toLowerCase() === "pending",
  ).length;
  const cancelledCount = toursList.filter(
    (tour: any) => tour.status?.toLowerCase() === "cancelled",
  ).length;

  if (isLoading)
    return <div className="p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="p-8 space-y-8 w-full min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Property Tours</h1>
          <p className="text-slate-500 text-sm">
            Schedule and manage your property visits
          </p>
        </div>
        <RequestTourDialog />
      </div>

      {/* Dynamic Counter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          label="Total Requests"
          value={totalRequests}
          icon={<CalendarDays className="text-slate-400" />}
        />
        <StatsCard
          label="Confirmed"
          value={confirmedCount}
          icon={
            <div className="bg-green-100 p-1 rounded-full">
              <Clock className="text-green-600 h-4 w-4" />
            </div>
          }
          color="border-l-green-500"
        />
        <StatsCard
          label="Pending"
          value={pendingCount}
          icon={
            <div className="bg-yellow-100 p-1 rounded-full">
              <Clock className="text-yellow-600 h-4 w-4" />
            </div>
          }
          color="border-l-yellow-500"
        />
        <StatsCard
          label="Cancelled"
          value={cancelledCount}
          icon={
            <div className="bg-red-100 p-1 rounded-full">
              <X className="text-red-600 h-4 w-4" />
            </div>
          }
          color="border-l-red-500"
        />
      </div>

      {/* Render Tour Listings */}
      <div className="space-y-4">
        <h2 className="font-semibold text-slate-800">All Tour Requests</h2>

        {toursList.length === 0 ? (
          <p className="text-slate-500 text-sm italic">
            No tour requests found.
          </p>
        ) : (
          toursList.map((tour: any) => {
            // Setup dynamic design tokens conditionally based on status
            let statusColor = "bg-yellow-100 text-yellow-700";
            if (tour.status?.toLowerCase() === "confirmed")
              statusColor = "bg-green-100 text-green-700";
            if (tour.status?.toLowerCase() === "cancelled")
              statusColor = "bg-red-100 text-red-700";

            return (
              <TourCard
                key={tour._id}
                title={tour.property?.basic_info?.name || "Unknown Property"}
                status={
                  tour.status
                    ? tour.status.charAt(0).toUpperCase() + tour.status.slice(1)
                    : "Pending"
                }
                statusColor={statusColor}
                location={`${tour.property?.location?.city || ""}, ${tour.property?.location?.country || ""}`}
                id={tour._id} // Displays short neat ID from MongoId
                date={
                  tour.preferred_date
                    ? tour.preferred_date.split("T")[0]
                    : "N/A"
                }
                time={tour.preferred_time || "N/A"}
                property={tour.property?.basic_info?.code || "N/A"}
                notes={tour.additional_notes || "No additional notes provided."}
                type={
                  tour.type
                    ? tour.type.charAt(0).toUpperCase() + tour.type.slice(1)
                    : "In-Person"
                }
                canCancel={tour.status?.toLowerCase() === "pending"}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function StatsCard({ label, value, icon, color = "" }: any) {
  return (
    <Card className={cn("border-l-4 shadow-sm", color)}>
      <CardContent className="p-4 flex justify-between items-center">
        <div>
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        {icon}
      </CardContent>
    </Card>
  );
}

function TourCard({
  title,
  status,
  statusColor,
  location,
  id,
  date,
  time,
  property,
  notes,
  type,
  canCancel,
}: any) {
  const { mutate } = useCancelPropertyTour();
  const queryClient = useQueryClient();
  const handleCancelTour = () => {
    mutate(
      { _id: id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["property-tour"] });
        },
      },
    );
  };
  return (
    <Card className="shadow-sm overflow-hidden border-slate-200">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-slate-800">{title}</h3>
              <Badge
                variant="secondary"
                className={cn("font-semibold", statusColor)}>
                {status}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">{location}</p>
            <p className="text-xs text-slate-400">Tour ID: {id}</p>
          </div>
          <p className="text-xs font-medium text-slate-500">{type}</p>
        </div>

        <div className="grid grid-cols-3 gap-8 mb-6 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <p className="text-xs text-slate-400 uppercase font-bold tracking-tight">
              Requested Date
            </p>
            <div className="flex items-center gap-2 text-slate-700">
              <CalendarDays className="h-4 w-4 text-orange-500" />
              <span className="font-medium text-sm">{date}</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-400 uppercase font-bold tracking-tight">
              Requested Time
            </p>
            <div className="flex items-center gap-2 text-slate-700">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="font-medium text-sm">{time}</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-400 uppercase font-bold tracking-tight">
              Property
            </p>
            <div className="flex items-center gap-2 text-slate-700">
              <Home className="h-4 w-4 text-orange-500" />
              <span className="font-medium text-sm">{property}</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xs text-slate-400 uppercase font-bold tracking-tight mb-2">
            Notes
          </p>
          <p className="text-sm text-slate-600 italic">{notes}</p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" size="sm" className="text-slate-600">
            <MessageSquare className="h-4 w-4 mr-2" /> Message
          </Button>
          {canCancel ? (
            <Button
              onClick={() => handleCancelTour()}
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" /> Cancel
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700">
              <ExternalLink className="h-4 w-4 mr-2" /> View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
