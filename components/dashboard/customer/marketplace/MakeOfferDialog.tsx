"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OfferFormValues, offerSchema, Property } from "./schema";
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
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { DollarSign, Info } from "lucide-react";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { useState } from "react";

interface Props {
  property: any;
}

export function MakeOfferDialog({ property }: Props) {
  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: { financingType: "Cash", contingencies: [] },
  });

  const [isOpen, setIsOpen] = useState(false);

  const onSubmit = (data: OfferFormValues) => {
    console.log("Offer Submitted:", data);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 gap-2">
          <DollarSign size={16} /> Make Offer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <div className="p-8">
          <DialogHeader className="mb-4 text-left">
            <DialogTitle className="text-2xl font-bold text-[#1e293b]">
              Make an Offer
            </DialogTitle>
            <p className="text-sm text-slate-500">
              Submit your offer for {property?.title}
            </p>
          </DialogHeader>

          {/* Green Status Header */}
          <div className="bg-[#effaf3] border border-[#dcfce7] p-4 rounded-lg flex justify-between items-center mb-6">
            <div>
              <p className="font-bold text-[#1e293b]">{property?.title}</p>
              <p className="text-xs text-slate-500 uppercase">
                Property ID: {property?.id}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                Listing Price
              </p>
              <p className="text-2xl font-black text-[#1e293b]">
                {property?.price}
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">
                      Your Offer Amount *
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-400">
                          $
                        </span>
                        <Input
                          className="pl-8 h-12 bg-slate-50/50"
                          {...field}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="financingType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="font-bold">
                      Financing Type *
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex gap-6">
                        {["Cash", "Financing", "Mixed"].map((type) => (
                          <div
                            key={type}
                            className="flex items-center space-x-2">
                            <RadioGroupItem
                              value={type}
                              id={type}
                              className="text-[#f26522]"
                            />
                            <label
                              htmlFor={type}
                              className="text-sm font-medium cursor-pointer">
                              {type}
                            </label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="bg-[#f0f7ff] p-4 rounded-lg border border-[#e0efff] flex gap-3">
                <Info className="h-4 w-4 text-[#0066cc] mt-1 shrink-0" />
                <div className="text-[11px] text-[#0066cc]">
                  <p className="font-bold uppercase mb-1">Important Notice</p>
                  <p>
                    This offer is subject to seller approval and legal review.
                    You may be required to provide proof of funds.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-8 h-11">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#f26522] hover:bg-[#d4561b] px-8 h-11 text-white">
                  $ Submit Offer
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
