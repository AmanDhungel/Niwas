"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Info } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const formSchema = z
  .object({
    checkIn: z.date(),
    checkOut: z.date(),
    guests: z.string(),
    specialRequests: z.string().optional(),
  })
  .refine((data) => data.checkOut > data.checkIn, {
    message: "Check-out must be after check-in",
    path: ["checkOut"],
  });

export function BookingDialog() {
  const [open, setOpen] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { specialRequests: "" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Booking Data:", values);
    setOpen(false); // Close modal on success
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="bg-[#f26522]">
          Book Now
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="p-6 bg-white">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold text-[#1e293b]">
              Book Your Stay
            </DialogTitle>
            <p className="text-sm text-slate-500">
              Complete your booking for Luxury Beach House
            </p>
          </DialogHeader>

          {/* Price Header Card */}
          <div className="bg-[#fff1eb] p-4 rounded-lg flex justify-between items-center mb-8 border border-[#ffe4d6]">
            <div>
              <p className="font-bold text-[#1e293b]">Luxury Beach House</p>
              <p className="text-xs text-slate-500 uppercase tracking-tighter">
                Property ID: STR-002
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-[#f26522]">$350</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase">
                per night
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {/* Check-in */}
                <FormField
                  control={form.control}
                  name="checkIn"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="font-bold text-slate-700">
                        Check-in Date *
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "h-12 bg-slate-50/50 justify-between font-normal",
                                !field.value && "text-muted-foreground",
                              )}>
                              {field.value
                                ? format(field.value, "MM/dd/yyyy")
                                : "mm/dd/yyyy"}
                              <CalendarIcon className="h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Check-out */}
                <FormField
                  control={form.control}
                  name="checkOut"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="font-bold text-slate-700">
                        Check-out Date *
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "h-12 bg-slate-50/50 justify-between font-normal",
                                !field.value && "text-muted-foreground",
                              )}>
                              {field.value
                                ? format(field.value, "MM/dd/yyyy")
                                : "mm/dd/yyyy"}
                              <CalendarIcon className="h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < (form.getValues("checkIn") || new Date())
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Number of Guests */}
              <FormField
                control={form.control}
                name="guests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-slate-700">
                      Number of Guests *
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 bg-slate-50/50">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 Guest</SelectItem>
                        <SelectItem value="2">2 Guests</SelectItem>
                        <SelectItem value="4">4 Guests</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Special Requests */}
              <FormField
                control={form.control}
                name="specialRequests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-slate-700">
                      Special Requests (Optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-[100px] bg-slate-50/50 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Info Box */}
              <div className="flex gap-3 p-4 bg-[#f0f7ff] border border-[#e0efff] rounded-lg items-start">
                <Info className="h-4 w-4 text-[#0066cc] mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <p className="font-bold text-[#004d99] mb-1">
                    Payment Information
                  </p>
                  <p className="text-[#0066cc]">
                    You wont be charged yet. Payment details will be collected
                    on the next step.
                  </p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="px-8 h-11">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#f26522] hover:bg-[#d4561b] px-8 h-11 text-white">
                  Confirm Booking
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
