import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, Plus, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  useCreatePayment,
  useUpdatePaymentPreferences,
} from "@/services/profile.service";
import { useQueryClient } from "@tanstack/react-query";

const paymentPrefsSchema = z.object({
  auto_pay: z.boolean(),
  save_payment_info: z.boolean(),
});

const newPaymentMethodSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("card"),
    card_type: z.string(),
    card_number: z
      .string()
      .min(12, { message: "Card number must be at least 12 digits" }),
    card_exp_month: z
      .number()
      .min(1, { message: "Month must be 1-12" })
      .max(12, { message: "Month must be 1-12" }),
    card_exp_year: z
      .number()
      .min(2026, { message: "Year must be 2026 or later" }),
    cvv: z
      .string()
      .min(3, { message: "CVV must be 3-4 digits" })
      .max(4, { message: "CVV must be 3-4 digits" }),
  }),
  z.object({
    type: z.literal("bank_account"),
    bank_name: z.string().min(2, { message: "Bank name required" }),
    bank_account_number: z
      .string()
      .min(8, { message: "Invalid account number" }),
  }),
  z.object({
    type: z.literal("paypal"),
    paypal_email: z.string().email({ message: "Invalid PayPal email" }),
  }),
]);

type PaymentPrefsValues = z.infer<typeof paymentPrefsSchema>;
type NewPaymentValues = z.infer<typeof newPaymentMethodSchema>;

export default function PaymentForm({ data }: { data: any }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const querClient = useQueryClient();
  const { mutate: updatePrefs, isPending: isUpdatingPrefs } =
    useUpdatePaymentPreferences();
  const { mutate: createPayment, isPending: isCreatingPayment } =
    useCreatePayment();

  const prefsForm = useForm<PaymentPrefsValues>({
    resolver: zodResolver(paymentPrefsSchema),
    defaultValues: {
      auto_pay: data?.payment_preferences?.auto_pay ?? false,
      save_payment_info: data?.payment_preferences?.save_payment_info ?? false,
    },
  });

  const dialogForm = useForm<NewPaymentValues>({
    resolver: zodResolver(newPaymentMethodSchema),
    defaultValues: {
      type: "card",
      card_type: "visa",
      card_number: "",
      card_exp_month: undefined,
      card_exp_year: undefined,
      cvv: "",
    } as any,
  });

  const selectedMethod = dialogForm.watch("type");

  const cards = [
    { id: 1, type: "Visa", last4: "4242", expiry: "12/25", is_default: true },
    {
      id: 2,
      type: "Mastercard",
      last4: "8888",
      expiry: "03/26",
      is_default: false,
    },
  ];

  function onSavePreferences(values: PaymentPrefsValues) {
    updatePrefs(values);
  }

  function onAddPaymentMethod(values: NewPaymentValues) {
    createPayment(values, {
      onSuccess: () => {
        setIsDialogOpen(false);
        dialogForm.reset({
          type: "card",
          card_type: "visa",
          card_number: "",
          card_exp_month: undefined,
          card_exp_year: undefined,
          cvv: "",
        } as any);
        querClient.invalidateQueries({ queryKey: ["profile"] });
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Payment Methods</h3>
        <div className="space-y-3">
          {data.payment_methods.map((card: any) => (
            <div
              key={card._id}
              className="flex items-center justify-between p-4 border rounded-xl">
              <div className="flex items-center gap-4">
                <div className="bg-orange-100 p-2 rounded">
                  <CreditCard className="text-orange-600 h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {card.type} •••• {card.bank_account_last4}
                    </p>
                    {card.is_default && (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 shadow-none border-none">
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {card.bank_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expires {card.expiry}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" type="button">
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  className="text-red-500">
                  Remove
                </Button>
              </div>
            </div>
          ))}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                type="button"
                className="w-full border-dashed py-6 gap-2">
                <Plus className="h-4 w-4" /> Add New Payment Method
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Payment Method</DialogTitle>
                <DialogDescription>
                  Choose a billing setup to attach to your digital account
                  profile.
                </DialogDescription>
              </DialogHeader>

              <Form {...dialogForm}>
                <form
                  onSubmit={dialogForm.handleSubmit(onAddPaymentMethod)}
                  className="space-y-4 pt-2">
                  {/* Dropdown Selection */}
                  <FormField
                    control={dialogForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Type</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Reset form when type changes
                            if (value === "card") {
                              dialogForm.reset({
                                type: "card",
                                card_type: "visa",
                                card_number: "",
                                card_exp_month: undefined,
                                card_exp_year: undefined,
                                cvv: "",
                              } as any);
                            } else if (value === "bank_account") {
                              dialogForm.reset({
                                type: "bank_account",
                                bank_name: "",
                                bank_account_number: "",
                              } as any);
                            } else if (value === "paypal") {
                              dialogForm.reset({
                                type: "paypal",
                                paypal_email: "",
                              } as any);
                            }
                          }}
                          value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="card">
                              Credit / Debit Card
                            </SelectItem>
                            <SelectItem value="bank_account">
                              Bank Account
                            </SelectItem>
                            <SelectItem value="paypal">PayPal</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Render Fields Condition: Card Variant */}
                  {selectedMethod === "card" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <FormField
                        control={dialogForm.control}
                        name="card_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Card Number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="4111 1111 1111 4242"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <FormField
                          control={dialogForm.control}
                          name="card_exp_month"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Exp Month</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="MM"
                                  {...field}
                                  value={field.value || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(
                                      val === "" ? undefined : Number(val),
                                    );
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={dialogForm.control}
                          name="card_exp_year"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Exp Year</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="YYYY"
                                  {...field}
                                  value={field.value || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(
                                      val === "" ? undefined : Number(val),
                                    );
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={dialogForm.control}
                          name="cvv"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CVV</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="123"
                                  maxLength={4}
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {/* Render Fields Condition: Bank Variant */}
                  {selectedMethod === "bank_account" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <FormField
                        control={dialogForm.control}
                        name="bank_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Nepal Bank"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={dialogForm.control}
                        name="bank_account_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Account string sequence"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Render Fields Condition: PayPal Variant */}
                  {selectedMethod === "paypal" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <FormField
                        control={dialogForm.control}
                        name="paypal_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>PayPal Account Email</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="user@paypal.com"
                                type="email"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isCreatingPayment}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white mt-2">
                    {isCreatingPayment ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "Link Payment Method"
                    )}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Preferences Form Wrapper Context */}
      <Form {...prefsForm}>
        <form
          onSubmit={prefsForm.handleSubmit(onSavePreferences)}
          className="space-y-6">
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-medium">Payment Preferences</h3>
            <div className="space-y-3">
              <FormField
                control={prefsForm.control}
                name="auto_pay"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-4 border rounded-xl space-y-0">
                    <div>
                      <FormLabel className="text-base">
                        Auto-pay for bookings
                      </FormLabel>
                      <FormDescription>
                        Automatically charge default card for confirmed bookings
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={prefsForm.control}
                name="save_payment_info"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-4 border rounded-xl space-y-0">
                    <div>
                      <FormLabel className="text-base">
                        Save payment info
                      </FormLabel>
                      <FormDescription>
                        Securely save cards for faster checkout
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdatingPrefs}
              className="bg-orange-500 hover:bg-orange-600 px-8 text-white">
              {isUpdatingPrefs ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
