"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

import { PlusCircle, UploadCloud, X, Loader2 } from "lucide-react";

import { useCreateMaintenance } from "@/services/maintenance.service";

import { useGetProperties } from "@/services/standardpropertysetup.service";

type FormValues = {
  service_type: string;
  property: string;
  description: string;
  priority: string;
  preferred_service_date: string;
  contact_phone_number: string;
};

export function RequestMaintenanceForm() {
  const [open, setOpen] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const { mutate, isPending } = useCreateMaintenance();

  const { data } = useGetProperties();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      service_type: "reported",
      property: "",
      description: "",
      priority: "high",
      preferred_service_date: "",
      contact_phone_number: "",
    },
  });

  // Handle image upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);

      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  // Remove image
  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit form
  const onSubmit = (data: FormValues) => {
    const formData = new FormData();

    formData.append("service_type", data.service_type);
    formData.append("property", data.property);
    formData.append("description", data.description);
    formData.append("priority", data.priority);
    formData.append("preferred_service_date", data.preferred_service_date);
    formData.append("contact_phone_number", data.contact_phone_number);

    selectedFiles.forEach((file) => {
      formData.append("photos", file);
    });

    mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        reset();
        setSelectedFiles([]);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#f26522] hover:bg-[#d9541a] text-white rounded-md px-6 py-5 flex gap-2">
          <PlusCircle size={18} />
          New Request
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-4xl p-8 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800">
            Request Maintenance Service
          </DialogTitle>

          <p className="text-sm text-slate-500">
            Submit a maintenance or repair request.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {/* Service Type */}
          <div className="space-y-2">
            <Label className="font-bold">Service Type *</Label>

            <Controller
              name="service_type"
              control={control}
              rules={{
                required: "Service type is required",
              }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    className={errors.service_type ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="reported">Reported</SelectItem>

                    <SelectItem value="scheduled">Scheduled Routine</SelectItem>

                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />

            {errors.service_type && (
              <p className="text-xs text-red-500">
                {errors.service_type.message}
              </p>
            )}
          </div>

          {/* Property */}
          <div className="space-y-2">
            <Label className="font-bold">Property Address / ID *</Label>

            <Controller
              name="property"
              control={control}
              rules={{
                required: "Property is required",
              }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    className={errors.property ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>

                  <SelectContent>
                    {data?.data?.map((property: any) => (
                      <SelectItem key={property._id} value={property._id}>
                        {property.basic_info.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />

            {errors.property && (
              <p className="text-xs text-red-500">{errors.property.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="font-bold">Description *</Label>

            <Textarea
              className={`min-h-[100px] ${
                errors.description ? "border-red-500" : ""
              }`}
              placeholder="Describe the issue..."
              {...register("description", {
                required: "Please write a summary description",
              })}
            />

            {errors.description && (
              <p className="text-xs text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-3">
            <Label className="font-bold">Priority Level</Label>

            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex flex-wrap gap-4">
                  {["low", "medium", "high", "urgent"].map((priority) => (
                    <div key={priority} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={priority}
                        id={`priority-${priority}`}
                      />

                      <Label
                        htmlFor={`priority-${priority}`}
                        className="cursor-pointer">
                        {priority.toUpperCase()}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            />
          </div>

          {/* Dates & Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-bold">Preferred Service Date</Label>

              <Input type="date" {...register("preferred_service_date")} />
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Contact Phone</Label>

              <Input
                type="tel"
                placeholder="Enter phone number"
                {...register("contact_phone_number")}
              />
            </div>
          </div>

          {/* Upload */}
          <div className="space-y-2">
            <Label className="font-bold">Upload Photos</Label>

            <label className="border-2 border-dashed border-blue-200 rounded-lg p-8 text-center bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              <UploadCloud className="mx-auto h-8 w-8 text-orange-500 mb-2" />

              <p className="text-sm font-medium">
                Drag your file(s) or{" "}
                <span className="text-orange-500">browse</span>
              </p>

              <p className="text-xs text-slate-400 mt-1">
                Max 10 MB files are allowed
              </p>
            </label>

            {/* Preview */}
            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3 pt-3">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square border rounded-md overflow-hidden">
                    <img
                      src={URL.createObjectURL(file)}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              type="button"
              disabled={isPending}
              onClick={() => {
                setOpen(false);
                reset();
                setSelectedFiles([]);
              }}>
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white min-w-[160px]">
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin h-4 w-4" />
                  Submitting...
                </span>
              ) : (
                "Submit Request"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
