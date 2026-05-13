"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BedDouble,
  Bath,
  Square,
  MapPin,
  Wifi,
  Car,
  Wind,
  Tv,
  User,
} from "lucide-react";

interface PropertyDetailsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PropertyDetailsDialog({
  isOpen,
  onClose,
}: PropertyDetailsProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden border-none shadow-2xl bg-white">
        <div className="relative h-64 w-full">
          <img
            src="https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&q=80&w=1200"
            alt="Luxury Beach House"
            className="w-full h-full object-cover"
          />
          <Badge className="absolute top-4 left-4 bg-[#f26522] text-white border-none px-3 py-1">
            Featured Property
          </Badge>
        </div>

        <div className="p-8">
          <DialogHeader className="flex flex-row justify-between items-start space-y-0">
            <div className="space-y-1">
              <DialogTitle className="text-3xl font-bold text-slate-900">
                Luxury Beach House
              </DialogTitle>
              <div className="flex items-center text-slate-500">
                <MapPin className="h-4 w-4 mr-1 text-[#f26522]" />
                <span className="text-sm">
                  Malibu, California • Property ID: STR-002
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[#f26522]">$350</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                per night
              </p>
            </div>
          </DialogHeader>

          {/* Quick Specs */}
          <div className="flex gap-6 mt-6 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-50 rounded-lg">
                <BedDouble className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-bold">3</p>
                <p className="text-[10px] text-slate-500 uppercase">Bedrooms</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-50 rounded-lg">
                <Bath className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-bold">2</p>
                <p className="text-[10px] text-slate-500 uppercase">
                  Bathrooms
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-50 rounded-lg">
                <Square className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-bold">1,200</p>
                <p className="text-[10px] text-slate-500 uppercase">Sq Ft</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 mt-6">
            {/* Description */}
            <div className="col-span-2 space-y-4">
              <h4 className="font-bold text-slate-800">About this property</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Experience ultimate coastal living in this stunning Malibu beach
                house. Featuring panoramic ocean views, modern architectural
                design, and direct private beach access. Perfect for families or
                group getaways seeking luxury and tranquility.
              </p>

              <h4 className="font-bold text-slate-800 pt-2">Amenities</h4>
              <div className="grid grid-cols-2 gap-3">
                <AmenityItem icon={<Wifi />} label="High-speed Wi-Fi" />
                <AmenityItem icon={<Car />} label="Free Parking" />
                <AmenityItem icon={<Wind />} label="Air Conditioning" />
                <AmenityItem icon={<Tv />} label="Smart TV" />
              </div>
            </div>

            <div className="col-span-1">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">
                  Listed By
                </h4>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-[#f26522]/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-[#f26522]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Sarah Jenkins
                    </p>
                    <p className="text-[10px] text-slate-500">Verified Host</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full text-xs h-9 border-slate-200 hover:bg-white">
                  Contact Host
                </Button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-slate-500">
              Close
            </Button>
            <Button className="bg-[#f26522] hover:bg-[#d4561b] px-10 font-bold text-white shadow-lg shadow-orange-100">
              Book Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AmenityItem({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-slate-600">
      <span className="[&>svg]:h-4 [&>svg]:w-4 text-[#f26522]">{icon}</span>
      <span className="text-xs">{label}</span>
    </div>
  );
}
