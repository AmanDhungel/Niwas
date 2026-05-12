"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Clock,
  DollarSign,
  Wrench,
  Download,
  MessageSquare,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { MaintenanceRequest } from "./schema";

export function MaintenanceDetailsDialog({
  isOpen,
  onClose,
  request,
}: {
  isOpen: boolean;
  onClose: () => void;
  request: MaintenanceRequest;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[750px] p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800">
            Maintenance Request Details
          </DialogTitle>
          <p className="text-sm text-slate-500">
            View complete information about your maintenance request.
          </p>
        </DialogHeader>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 my-6">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg">{request.serviceType}</h3>
            <Badge className="bg-blue-100 text-blue-600 hover:bg-blue-100">
              {request.status}
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-600 hover:bg-yellow-100">
              {request.priority}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 uppercase font-bold">
            Request ID: {request.id}
          </p>
          <p className="text-sm text-slate-600 mt-1 flex items-center gap-1">
            Considering:{" "}
            <span className="font-medium text-slate-800">
              {request.propertyAddress}
            </span>
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wide">
              Description
            </h4>
            <p className="p-3 bg-white border rounded-md text-sm text-slate-600">
              {request.description}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <InfoCard
              icon={<CalendarDays className="h-4 w-4 text-slate-400" />}
              label="Requested Date"
              value={request.requestedDate}
            />
            <InfoCard
              icon={<Clock className="h-4 w-4 text-blue-500" />}
              label="Scheduled Date"
              value={request.scheduledDate || "Pending"}
            />
            <InfoCard
              icon={<DollarSign className="h-4 w-4 text-green-500" />}
              label="Estimated Cost"
              value={request.estimatedCost}
            />
            <InfoCard
              icon={<Wrench className="h-4 w-4 text-purple-500" />}
              label="Service Type"
              value={request.serviceType}
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Request Timeline
            </h4>
            <TimelineItem
              label="Request Submitted"
              date={request.requestedDate}
              completed
            />
            <TimelineItem
              label="Service Scheduled"
              date={request.scheduledDate || ""}
              completed={!!request.scheduledDate}
            />
            <TimelineItem
              label="Service Completion"
              date="Pending"
              completed={false}
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center border border-blue-100">
            <div>
              <p className="text-sm font-bold text-slate-800">
                Need to make changes?
              </p>
              <p className="text-xs text-slate-500">
                Contact support or reschedule your service
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="bg-white">
                <MessageSquare className="h-3 w-3 mr-1" /> Contact Support
              </Button>
              <Button variant="outline" size="sm" className="bg-white">
                <RotateCcw className="h-3 w-3 mr-1" /> Reschedule
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t mt-6">
          <Button variant="outline" onClick={onClose} className="px-8 h-12">
            Close
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 px-8 h-12 text-white gap-2">
            <Download className="h-4 w-4" /> Download Receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Sub-components for Details
function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="border border-slate-100 p-3 rounded-xl flex items-center gap-3 bg-white shadow-sm">
      <div className="bg-slate-50 p-2 rounded-lg">{icon}</div>
      <div>
        <p className="text-[10px] uppercase font-bold text-slate-400">
          {label}
        </p>
        <p className="text-xs font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function TimelineItem({
  label,
  date,
  completed,
}: {
  label: string;
  date: string;
  completed: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`p-1 rounded-full ${completed ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-300"}`}>
        <CheckCircle2 className="h-4 w-4" />
      </div>
      <div>
        <p
          className={`text-sm font-bold ${completed ? "text-slate-800" : "text-slate-400"}`}>
          {label}
        </p>
        <p className="text-xs text-slate-400">{date}</p>
      </div>
    </div>
  );
}
