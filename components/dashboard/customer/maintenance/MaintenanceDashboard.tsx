import React from "react";
import {
  Search,
  SlidersHorizontal,
  PlusCircle,
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
  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 lg:p-12 font-sans text-slate-900">
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
        <Button className="bg-[#f26522] hover:bg-[#d9541a] text-white rounded-md px-6 py-5 flex gap-2">
          <PlusCircle size={18} />
          New Request
        </Button>
      </div>

      {/* Top Stats Grid */}
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

      <div className="flex gap-2 mb-8">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <Input
            className="pl-10 bg-white border-slate-200 h-11 focus-visible:ring-[#f26522]"
            placeholder="Search..."
          />
        </div>
        <Button
          variant="outline"
          className="h-11 border-slate-200 text-slate-600 px-4 flex gap-2">
          Filter <SlidersHorizontal size={16} />
        </Button>
      </div>

      <Card className="border-none shadow-sm mb-8">
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-6">
            Available Services
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SERVICES.map((service, idx) => (
              <div
                key={idx}
                className="group cursor-pointer border border-slate-100 rounded-lg p-8 flex flex-col items-center justify-center gap-3 transition-all hover:shadow-md hover:border-orange-100 bg-white">
                <div className="mb-1">{service.icon}</div>
                <span className="text-sm font-medium text-slate-700">
                  {service.name}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-6">
            My Maintenance Requests
          </h2>

          <div className="border border-slate-100 rounded-xl p-6 bg-white">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold">General Inspection</h3>
                <Badge
                  variant="secondary"
                  className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-none px-3 py-0.5 rounded text-[11px] font-semibold">
                  Scheduled
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-amber-50 text-amber-600 hover:bg-amber-100 border-none px-3 py-0.5 rounded text-[11px] font-semibold">
                  Medium
                </Badge>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-slate-500">
                  <span className="font-medium text-slate-700">
                    Considering:
                  </span>{" "}
                  Spacious 3BR Family Home, Brooklyn
                </p>
                <p className="text-sm text-slate-500">
                  Pre-lease property inspection before signing
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-2 uppercase tracking-tighter">
                  Request ID: MAINT-001
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 bg-slate-50/80 rounded-lg p-4 mt-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-md text-slate-400">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-slate-400 font-bold">
                      Requested Date
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      2025-01-25
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-md text-blue-500">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-slate-400 font-bold">
                      Scheduled Date
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      2025-02-04
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-md text-emerald-500">
                    <DollarSign size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-slate-400 font-bold">
                      Estimated Cost
                    </p>
                    <p className="text-sm font-bold text-slate-700">$150</p>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="outline"
                  className="h-9 text-slate-600 border-slate-200 px-4 flex gap-2">
                  <MessageSquare size={16} /> Contact
                </Button>
                <MaintenanceDetailsModal />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
