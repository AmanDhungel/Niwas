"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CalendarIcon, Info, X } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const formSchema = z.object({
  checkIn: z.date(),
  checkOut: z.date(),
  guests: z.string(),
  specialRequests: z.string().optional(),
});

export default function BookingForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      specialRequests: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Modal Header */}
      <div className="p-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-[#1e293b]">Book Your Stay</h1>
          <p className="text-slate-500 text-sm mt-1">
            Complete your booking for Luxury Beach House
          </p>
        </div>
        <Button variant="ghost" size="icon" className="text-slate-400">
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Property Summary Strip */}
      <div className="mx-6 p-4 bg-[#FFF1EB] rounded-lg border border-[#FFD8C9] flex justify-between items-center">
        <div>
          <p className="font-bold text-slate-800">Luxury Beach House</p>
          <p className="text-xs text-slate-500 font-medium">
            Property ID: STR-002
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#F26522]">$350</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
            per night
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Dates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="checkIn"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-slate-700 font-bold">
                    Check-in Date *
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "h-12 pl-3 text-left font-normal bg-[#F8FAFC] border-slate-200",
                            !field.value && "text-muted-foreground",
                          )}>
                          {field.value ? (
                            format(field.value, "MM/dd/yyyy")
                          ) : (
                            <span>mm/dd/yyyy</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 text-slate-400" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="checkOut"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-slate-700 font-bold">
                    Check-out Date *
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "h-12 pl-3 text-left font-normal bg-[#F8FAFC] border-slate-200",
                            !field.value && "text-muted-foreground",
                          )}>
                          {field.value ? (
                            format(field.value, "MM/dd/yyyy")
                          ) : (
                            <span>mm/dd/yyyy</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 text-slate-400" />
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

          {/* Guests Select */}
          <FormField
            control={form.control}
            name="guests"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 font-bold">
                  Number of Guests *
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 bg-[#F8FAFC] border-slate-200">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">1 Guest</SelectItem>
                    <SelectItem value="2">2 Guests</SelectItem>
                    <SelectItem value="3">3 Guests</SelectItem>
                    <SelectItem value="4+">4+ Guests</SelectItem>
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
                <FormLabel className="text-slate-700 font-bold">
                  Special Requests (Optional)
                </FormLabel>
                <FormControl>
                  <Textarea
                    className="min-h-[120px] bg-[#F8FAFC] border-slate-200 resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Info Banner */}
          <div className="bg-[#EBF5FF] border border-[#D1E9FF] p-4 rounded-lg flex gap-3">
            <Info className="h-5 w-5 text-[#0070E0] shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#1e293b]">
                Payment Information
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                You wont be charged yet. Payment details will be collected on
                the next step.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="px-10 h-12 border-slate-200 text-slate-600">
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-10 h-12 bg-[#F26522] hover:bg-[#d95a1e] text-white font-bold">
              Confirm Booking
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
