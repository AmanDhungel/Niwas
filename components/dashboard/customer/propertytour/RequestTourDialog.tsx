"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Info, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  propertyId: z.string().min(1, "Please select a property"),
  tourType: z.enum(["in-person", "virtual"]),
  preferredDate: z.date(),
  preferredTime: z.string().min(1, "Time is required"),
  notes: z.string().optional(),
});

export function RequestTourDialog() {
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tourType: "in-person",
      notes: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#f26522] hover:bg-[#d4561b] text-white rounded-md px-6">
          <span className="mr-2">+</span> Request New Tour
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="p-8 bg-white">
          <DialogHeader className="mb-6 relative">
            <DialogTitle className="text-2xl font-bold text-slate-800">
              Request Property Tour
            </DialogTitle>
            <p className="text-sm text-slate-500">
              Schedule a tour for your desired property. Choose between
              in-person or virtual viewing.
            </p>
          </DialogHeader>

          {/* Property Highlight Card */}
          <div className="bg-[#fff1eb] p-4 rounded-lg flex justify-between items-center mb-8 border border-[#ffe4d6]">
            <div>
              <p className="font-bold text-slate-900">Luxury Beach House</p>
              <p className="text-xs text-slate-500">Property ID: STR-002</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-[#f26522]">$350</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase">
                per night
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Select Property */}
              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-slate-700">
                      Select Property
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
                        <SelectItem value="STR-002">
                          Luxury Beach House
                        </SelectItem>
                        <SelectItem value="STR-001">
                          Spacious 3BR Family Home
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tour Type */}
              <FormField
                control={form.control}
                name="tourType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="font-bold text-slate-700">
                      Tour Type
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4">
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem
                              value="in-person"
                              className="text-[#f26522] border-[#f26522]"
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            In-Person Tour
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem
                              value="virtual"
                              className="text-[#f26522] border-[#f26522]"
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Virtual Tour
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                {/* Preferred Date */}
                <FormField
                  control={form.control}
                  name="preferredDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="font-bold text-slate-700">
                        Preferred Date
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "h-12 bg-slate-50/50 pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}>
                              {field.value ? (
                                format(field.value, "MM/dd/yyyy")
                              ) : (
                                <span>mm/dd/yyyy</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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

                {/* Preferred Time */}
                <FormField
                  control={form.control}
                  name="preferredTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-slate-700">
                        Preferred Time
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
                          <SelectItem value="10:00">10:00 AM</SelectItem>
                          <SelectItem value="14:00">02:00 PM</SelectItem>
                          <SelectItem value="16:00">04:00 PM</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-slate-700">
                      Additional Notes (Optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        className="bg-slate-50/50 min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Info Box */}
              <div className="flex gap-3 p-4 bg-[#f0f7ff] border border-[#e0efff] rounded-lg">
                <Info className="h-5 w-5 text-[#0066cc] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-[#004d99]">
                    Payment Information
                  </p>
                  <p className="text-[#0066cc]">
                    You wont be charged yet. Payment details will be collected
                    on the next step.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="px-8 h-12">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#f26522] hover:bg-[#d4561b] px-8 h-12">
                  Submit Request
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
