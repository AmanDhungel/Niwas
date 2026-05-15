"use client";
import {
  Search,
  SlidersHorizontal,
  DollarSign,
  FileText,
  TrendingUp,
  Building2,
  Home,
  Eye,
  Wrench,
  Zap,
  Paintbrush,
  Droplets,
  Sparkles,
  AlertCircle,
  Calendar,
  Clock,
  MessageSquare,
  Activity,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import MaintenanceDetailsModal from "./MaintenanceDetailsDialog";
import { RequestMaintenanceForm } from "./RequestMaintenanceForm";
import { useGetMaintenance } from "@/services/maintenance.service";

// Types based on your JSON structure
interface MaintenanceRequest {
  _id: string;
  service_type: string;
  priority: string;
  description: string;
  preferred_service_date: string;
  createdAt: string;
  property: {
    basic_info: {
      name: string;
    };
    location: {
      address_line_1: string;
      city: string;
    };
  };
}

const STATS = [
  {
    label: "For Sale",
    count: "45",
    icon: <DollarSign className="w-5 h-5 text-emerald-500" />,
    bgColor: "bg-emerald-50",
  },
  {
    label: "For Lease",
    count: "32",
    icon: <FileText className="w-5 h-5 text-blue-500" />,
    bgColor: "bg-blue-50",
  },
  {
    label: "Investment",
    count: "28",
    icon: <TrendingUp className="w-5 h-5 text-orange-500" />,
    bgColor: "bg-orange-50",
  },
  {
    label: "Development",
    count: "12",
    icon: <Building2 className="w-5 h-5 text-purple-500" />,
    bgColor: "bg-purple-50",
  },
];

const SERVICES = [
  {
    name: "Property Inspection",
    icon: <Eye className="w-5 h-5 text-orange-500" />,
  },
  {
    name: "General Repairs",
    icon: <Wrench className="w-5 h-5 text-orange-500" />,
  },
  {
    name: "HVAC Service",
    icon: <Activity className="w-5 h-5 text-orange-500" />,
  },
  { name: "Plumbing", icon: <Droplets className="w-5 h-5 text-orange-500" /> },
  { name: "Electrical", icon: <Zap className="w-5 h-5 text-orange-500" /> },
  {
    name: "Painting",
    icon: <Paintbrush className="w-5 h-5 text-orange-500" />,
  },
  { name: "Cleaning", icon: <Sparkles className="w-5 h-5 text-orange-500" /> },
  {
    name: "Emergency",
    icon: <AlertCircle className="w-5 h-5 text-orange-500" />,
  },
];

export default function MaintenancePage() {
  const { data, isLoading } = useGetMaintenance();

  const maintenanceRequests: MaintenanceRequest[] = data?.data || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().split("T")[0];
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-50 text-red-600";
      case "medium":
        return "bg-amber-50 text-amber-600";
      default:
        return "bg-emerald-50 text-emerald-600";
    }
  };

  if (isLoading)
    return <div className="p-10 text-center">Loading maintenance data...</div>;

  return (
    <div className="min-h-screen p-6 md:p-10 lg:p-12 font-sans text-slate-900">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <Home size={14} /> / Maintenance
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Maintenance & Repair Services
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Request inspections and repair services
          </p>
        </div>
        <RequestMaintenanceForm />
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((stat, idx) => (
          <Card key={idx} className="border-none shadow-sm overflow-hidden">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold mt-1">{stat.count}</p>
              </div>
              <div
                className={`p-4 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                {stat.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2 mb-8">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <Input
            className="pl-10 bg-white border-slate-200 h-11 focus-visible:ring-[#f26522]"
            placeholder="Search requests..."
          />
        </div>
        <Button
          variant="outline"
          className="h-11 border-slate-200 text-slate-600 px-4 flex gap-2">
          Filter <SlidersHorizontal size={16} />
        </Button>
      </div>

      {/* Services Grid */}
      <Card className="border-none shadow-sm mb-8">
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-6">
            Available Services
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {SERVICES.map((service, idx) => (
              <div
                key={idx}
                className="group cursor-pointer border border-slate-100 rounded-lg p-6 flex flex-col items-center justify-center gap-3 transition-all hover:shadow-md hover:border-orange-100 bg-white text-center">
                <div className="mb-1">{service.icon}</div>
                <span className="text-sm font-medium text-slate-700">
                  {service.name}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Maintenance Requests List */}
      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-6">
            My Maintenance Requests
          </h2>

          <div className="flex flex-col gap-4">
            {maintenanceRequests.length > 0 ? (
              maintenanceRequests.map((request) => (
                <div
                  key={request._id}
                  className="border border-slate-100 rounded-xl p-6 bg-white">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <h3 className="text-lg font-bold capitalize">
                      {request.property.basic_info.name}
                    </h3>
                    <Badge className="bg-blue-50 text-blue-600 border-none px-3 py-0.5 rounded text-[11px] font-semibold capitalize">
                      {request.service_type}
                    </Badge>
                    <Badge
                      className={`${getPriorityColor(request.priority)} border-none px-3 py-0.5 rounded text-[11px] font-semibold capitalize`}>
                      {request.priority}
                    </Badge>
                  </div>

                  <div className="space-y-1 mb-4">
                    <p className="text-sm text-slate-500">
                      <span className="font-medium text-slate-700">
                        Location:
                      </span>{" "}
                      {request.property.location.address_line_1},{" "}
                      {request.property.location.city}
                    </p>
                    <p className="text-sm text-slate-500 italic">
                      {request.description}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-2 uppercase tracking-tighter">
                      Request ID: {request._id.slice(-8).toUpperCase()}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 bg-slate-50/80 rounded-lg p-4 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-md text-slate-400">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-slate-400 font-bold">
                          Created At
                        </p>
                        <p className="text-sm font-bold text-slate-700">
                          {formatDate(request.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-md text-blue-500">
                        <Clock size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-slate-400 font-bold">
                          Preferred Service Date
                        </p>
                        <p className="text-sm font-bold text-slate-700">
                          {formatDate(request.preferred_service_date)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      className="h-9 text-slate-600 border-slate-200 px-4 flex gap-2">
                      <MessageSquare size={16} /> Contact
                    </Button>
                    <MaintenanceDetailsModal />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 border border-dashed rounded-xl">
                No maintenance requests found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
