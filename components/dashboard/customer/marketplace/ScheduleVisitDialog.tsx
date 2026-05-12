"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { visitSchema, VisitFormValues, Property } from "./schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";

export function ScheduleVisitDialog({
  property,
  isOpen,
  onClose,
}: {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const form = useForm<VisitFormValues>({ resolver: zodResolver(visitSchema) });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Schedule Visit
          </DialogTitle>
          <p className="text-sm text-slate-500">
            Pick a date to view {property?.title}
          </p>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((d) => {
              console.log(d);
              onClose();
            })}
            className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="visitDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="font-bold">Preferred Date</FormLabel>
                  <FormControl>
                    <Button
                      variant="outline"
                      className="h-12 bg-slate-50/50 justify-between font-normal">
                      {field.value ? field.value.toDateString() : "mm/dd/yyyy"}
                      <CalendarIcon className="h-4 w-4 opacity-50" />
                    </Button>
                    {/* Note: In a real app, wrap this Button in a Popover with a Calendar component */}
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-[#f26522] hover:bg-[#d4561b] h-12 text-white">
              Schedule Visit
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
