import * as z from "zod";

export interface Property {
  id: string;
  title: string;
  location: string;
  price: string;
  sqft: string;
  roi: string;
  type: string;
  category: string;
  image: string;
}

export const offerSchema = z.object({
  amount: z.string().min(1, "Offer amount is required"),
  financingType: z.enum(["Cash", "Financing", "Mixed"]),
  contingencies: z.array(z.string()),
  closingDate: z.date(),
  terms: z.string().optional(),
});

export const visitSchema = z.object({
  visitDate: z.date(),
});

export type OfferFormValues = z.infer<typeof offerSchema>;
export type VisitFormValues = z.infer<typeof visitSchema>;
