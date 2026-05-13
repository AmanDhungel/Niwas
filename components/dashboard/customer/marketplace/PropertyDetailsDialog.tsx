"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  CheckCircle2,
  MapPin,
  Square,
  TrendingUp,
  BarChart3,
  Calendar,
  FileText,
} from "lucide-react";
import { Property } from "./schema";
import { cn } from "@/lib/utils";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { ScheduleVisitDialog } from "./ScheduleVisitDialog";
import { MakeOfferDialog } from "./MakeOfferDialog";

interface PropertyDetailsProps {
  property: any;
  onAction?: (type: "offer" | "visit") => void;
}

export function PropertyDetailsDialog({
  property,
  onAction,
}: PropertyDetailsProps) {
  const [open, setIsOpen] = useState(false);
  if (!property) return null;

  return (
    <Dialog open={open} onOpenChange={setIsOpen}>
      <DialogTrigger>
        <Button
          variant="outline"
          className="bg-white text-black  rounded-md px-6">
          <FileText size={16} /> Details
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-5xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="absolute right-4 top-4 z-10">
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/20 hover:bg-white/40 text-white">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </div>

        <div className="overflow-y-auto max-h-[95vh]">
          {/* Property Image Hero */}
          <div className="relative h-[350px] w-full">
            <img
              src={property.image}
              alt={property.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <Badge className="bg-[#f26522] border-none px-3 py-1 text-xs uppercase font-bold">
                Featured
              </Badge>
            </div>
          </div>

          <div className="p-8 space-y-8 bg-white">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-bold text-[#1e293b]">
                    {property.title}
                  </DialogTitle>
                </DialogHeader>
                <div className="flex items-center text-slate-500 gap-1">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {property.location}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-slate-100 text-slate-600 font-semibold text-[10px]">
                    {property.type}
                  </Badge>
                  <Badge className="bg-blue-50 text-blue-600 border-blue-100 font-semibold text-[10px]">
                    {property.category}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-[#22c55e]">
                  {property.price}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Sale Price
                </p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                icon={<Square className="h-5 w-5 text-blue-500" />}
                label="Total Area"
                value={`${property.sqft} sqft`}
              />
              <MetricCard
                icon={<TrendingUp className="h-5 w-5 text-orange-500" />}
                label="Expected ROI"
                value={property.roi}
                subValue="annually"
              />
              <MetricCard
                icon={<BarChart3 className="h-5 w-5 text-green-500" />}
                label="Occupancy Rate"
                value="95%"
              />
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h3 className="font-bold text-[#1e293b]">Description</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                This premium retail property offers exceptional investment
                opportunities in the heart of {property.location}. With{" "}
                {property.sqft} square feet of prime space, this property is
                ideal for investors seeking strong returns in a growing market.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-4">
              <h3 className="font-bold text-[#1e293b]">Key Features</h3>
              <div className="grid grid-cols-2 gap-y-3 text-sm text-slate-600">
                {[
                  "Prime Location",
                  "High Visibility",
                  "Ample Parking",
                  "Modern Infrastructure",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#22c55e]" /> {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Info Bar */}
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Property ID
                </p>
                <p className="text-xs font-semibold text-slate-800">
                  {property.id}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Category
                </p>
                <p className="text-xs font-semibold text-slate-800">
                  {property.type}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Type
                </p>
                <p className="text-xs font-semibold text-slate-800">
                  {property.category}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Status
                </p>
                <p className="text-xs font-bold text-green-600">Available</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100">
              <Button
                variant="outline"
                className="px-8  text-slate-600"
                onClick={() => setIsOpen(false)}>
                Close
              </Button>
              <ScheduleVisitDialog />
              <MakeOfferDialog property={property} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MetricCard({ icon, label, value, subValue }: any) {
  return (
    <div className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl bg-white shadow-sm">
      <div className="bg-slate-50 p-2 rounded-lg">{icon}</div>
      <div>
        <p className="text-[10px] uppercase font-bold text-slate-400">
          {label}
        </p>
        <p className="text-lg font-bold text-[#1e293b] leading-tight">
          {value}
        </p>
        {subValue && (
          <p className="text-[10px] text-slate-400 font-medium">{subValue}</p>
        )}
      </div>
    </div>
  );
}
