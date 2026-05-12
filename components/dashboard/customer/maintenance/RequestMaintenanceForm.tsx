"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CalendarIcon, UploadCloud, X } from "lucide-react";

export function RequestMaintenanceForm({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[700px] p-8 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800">
            Request Maintenance Service
          </DialogTitle>
          <p className="text-sm text-slate-500">
            Submit a maintenance or repair request. Our team will review and
            schedule the service.
          </p>
        </DialogHeader>

        <form className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label className="font-bold">Service Type *</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-bold">Property Address *</Label>
            <Input placeholder="Enter address" />
          </div>

          <div className="space-y-2">
            <Label className="font-bold">Description *</Label>
            <Textarea
              className="min-h-[100px]"
              placeholder="Describe the issue..."
            />
          </div>

          <div className="space-y-3">
            <Label className="font-bold">Priority Level</Label>
            <RadioGroup defaultValue="low" className="flex gap-4">
              {["Low", "Medium", "High", "Urgent"].map((p) => (
                <div key={p} className="flex items-center space-x-2">
                  <RadioGroupItem value={p.toLowerCase()} id={p} />
                  <Label htmlFor={p} className="font-normal">
                    {p}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold">Preferred Service Date</Label>
              <div className="relative">
                <Input placeholder="mm/dd/yyyy" />
                <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Contact Phone</Label>
              <Input placeholder="Enter phone number" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-bold">Upload Photos (Optional)</Label>
            <div className="border-2 border-dashed border-blue-200 rounded-lg p-8 text-center bg-slate-50">
              <UploadCloud className="mx-auto h-8 w-8 text-orange-500 mb-2" />
              <p className="text-sm font-medium">
                Drag your file(s) or{" "}
                <span className="text-orange-500 cursor-pointer">browse</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Max 10 MB files are allowed
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              className="px-8 h-12">
              Cancel
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600 px-8 h-12 text-white">
              Submit Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
