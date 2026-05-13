"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Info } from "lucide-react";

const bookingSchema = z.object({
  check_in_date: z.string().min(1, "Check-in date is required"),
  check_out_date: z.string().min(1, "Check-out date is required"),
  number_of_guests: z.string().min(1, "Please select number of guests"),
  special_requests: z.string().optional(),
});

export function BookYourStayDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { special_requests: "" },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Book Your Stay
          </DialogTitle>
          <p className="text-sm text-slate-500">
            Complete your booking for Luxury Beach House
          </p>
        </DialogHeader>

        <div className="bg-orange-50 p-4 rounded-lg flex justify-between items-center border border-orange-100 my-4">
          <div>
            <p className="font-bold text-sm">Luxury Beach House</p>
            <p className="text-xs text-slate-500">Property ID: STR-002</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-orange-600">$350</p>
            <p className="text-[10px] uppercase text-slate-400 font-bold">
              per night
            </p>
          </div>
        </div>

        <Form {...form}>
          <form className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="check_in_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check-in Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                name="check_out_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check-out Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              name="special_requests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Requests (Optional)</FormLabel>
                  <FormControl>
                    <Textarea className="h-32" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3">
              <Info className="h-5 w-5 text-blue-500" />
              <div className="text-xs text-blue-700">
                <p className="font-bold">Payment Information</p>
                <p>
                  You wont be charged yet. Payment details will be collected on
                  the next step.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-10 h-12">
                Cancel
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600 px-10 h-12">
                Confirm Booking
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
