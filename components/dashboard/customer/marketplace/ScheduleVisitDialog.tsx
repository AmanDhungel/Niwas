"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { CalendarDays, Clock } from "lucide-react";

const visitSchema = z.object({
  visit_date: z.string().min(1, "Date is required"),
  visit_time: z.string().min(1, "Time is required"),
  additional_notes: z.string().optional(),
});

export function ScheduleVisitDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const form = useForm<z.infer<typeof visitSchema>>({
    resolver: zodResolver(visitSchema),
    defaultValues: { additional_notes: "" },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6 border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Schedule a Visit
          </DialogTitle>
          <p className="text-sm text-slate-500">
            Pick a preferred time to tour this property
          </p>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4 mt-4">
            <FormField
              name="visit_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-slate-500">
                    Preferred Date
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input type="date" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              name="visit_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-slate-500">
                    Preferred Time
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input type="time" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              name="additional_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-slate-500">
                    Notes for the host
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Anything you'd like to mention?"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-2 pt-4">
              <Button className="w-full bg-[#f26522] hover:bg-[#d4561b] h-11 font-bold">
                Confirm Schedule
              </Button>
              <Button
                variant="ghost"
                type="button"
                onClick={onClose}
                className="text-slate-500 h-11">
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
