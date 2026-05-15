"use client";
import React, { useState } from "react";
import {
  X,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Wrench,
  CheckCircle2,
  Info,
  MessageSquare,
  Download,
  CalendarDays,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { useGetMaintenance } from "@/services/maintenance.service";

interface MaintenanceDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MaintenanceDetailsModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-slate-700 hover:text-slate-900">
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-5xl max-h-[95vh] overflow-y-auto p-0 border-none gap-0">
        {/* Header Section */}
        <div className="p-8 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-3xl font-bold text-slate-900">
                Maintenance Request Details
              </DialogTitle>
              <DialogDescription className="text-slate-500 mt-1 text-base">
                View complete information about your maintenance request
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-8 pt-0 space-y-8">
          {/* Top Info Card */}
          <div className="bg-slate-50/50 rounded-xl p-6 border border-slate-100">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-slate-800">
                General Inspection
              </h3>
              <Badge
                variant="secondary"
                className="bg-[#e0e7ff] text-[#4338ca] hover:bg-[#e0e7ff] border-none px-3 py-0.5 rounded text-[11px] font-semibold">
                Scheduled
              </Badge>
              <Badge
                variant="secondary"
                className="bg-[#fef9c3] text-[#a16207] hover:bg-[#fef9c3] border-none px-3 py-0.5 rounded text-[11px] font-semibold">
                Medium
              </Badge>
            </div>
            <p className="text-sm text-slate-400 font-medium">
              Request ID: MAINT-001
            </p>
            <div className="flex items-center gap-1 text-slate-500 text-sm mt-2">
              <MapPin size={14} className="text-slate-400" />
              <span>Considering: Spacious 3BR Family Home, Brooklyn</span>
            </div>
          </div>

          {/* Description */}
          <section className="space-y-3">
            <h4 className="text-sm font-bold text-slate-600">Description</h4>
            <div className="w-full p-4 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm">
              Pre-lease property inspection before signing
            </div>
          </section>

          {/* Request Information Grid */}
          <section className="space-y-3">
            <h4 className="text-sm font-bold text-slate-600">
              Request Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoCard
                icon={<Calendar size={18} />}
                label="Requested Date"
                value="2025-01-25"
                iconBg="bg-slate-50 text-slate-400"
              />
              <InfoCard
                icon={<Clock size={18} />}
                label="Scheduled Date"
                value="2025-02-04"
                iconBg="bg-blue-50 text-blue-500"
              />
              <InfoCard
                icon={<DollarSign size={18} />}
                label="Estimated Cost"
                value="$150"
                iconBg="bg-emerald-50 text-emerald-500"
              />
              <InfoCard
                icon={<Wrench size={18} />}
                label="Service Type"
                value="General Inspection"
                iconBg="bg-purple-50 text-purple-400"
              />
            </div>
          </section>

          {/* Request Timeline */}
          <section className="space-y-4">
            <h4 className="text-sm font-bold text-slate-600">
              Request Timeline
            </h4>
            <div className="space-y-4 relative">
              <TimelineItem
                icon={<CheckCircle2 size={18} />}
                title="Request Submitted"
                subtitle="2025-01-25"
                color="text-emerald-500"
                bg="bg-emerald-50"
              />
              <TimelineItem
                icon={<Clock size={18} />}
                title="Service Scheduled"
                subtitle="2025-02-04"
                color="text-blue-500"
                bg="bg-blue-50"
              />
              <TimelineItem
                icon={<Clock size={18} />}
                title="Service Completion"
                subtitle="Pending"
                color="text-slate-300"
                bg="bg-slate-50"
                isLast
              />
            </div>
          </section>

          {/* Help/Changes Banner */}
          <div className="bg-[#eff6ff] rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-[#dbeafe]">
            <div className="flex items-center gap-3">
              <div className="bg-white p-1 rounded text-blue-600">
                <Info size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Need to make changes?
                </p>
                <p className="text-xs text-slate-500">
                  Contact support or reschedule your service
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-slate-200 text-slate-700 font-bold h-9 px-4 flex-1 md:flex-none">
                <MessageSquare size={16} className="mr-2" /> Contact Support
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-slate-200 text-slate-700 font-bold h-9 px-4 flex-1 md:flex-none">
                <CalendarDays size={16} className="mr-2" /> Reschedule
              </Button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="px-12 h-12 text-slate-600 border-slate-200 font-bold">
                Close
              </Button>
            </DialogClose>
            <Button className="px-8 h-12 bg-[#f26522] hover:bg-[#d9541a] text-white font-bold flex gap-2">
              <Download size={18} /> Download Receipt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper Components
function InfoCard({
  icon,
  label,
  value,
  iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconBg: string;
}) {
  return (
    <div className="border border-slate-100 rounded-xl p-4 flex items-center gap-3 bg-white">
      <div className={`p-2.5 rounded-full ${iconBg}`}>{icon}</div>
      <div>
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tight leading-tight">
          {label}
        </p>
        <p className="text-sm font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function TimelineItem({
  icon,
  title,
  subtitle,
  color,
  bg,
  isLast = false,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  bg: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="relative flex flex-col items-center">
        <div className={`p-1.5 rounded-full ${bg} ${color} z-10`}>{icon}</div>
        {!isLast && (
          <div className="absolute top-8 w-[1px] h-8 bg-slate-100"></div>
        )}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-800 leading-tight">
          {title}
        </p>
        <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
      </div>
    </div>
  );
}
