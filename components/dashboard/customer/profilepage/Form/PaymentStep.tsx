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
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const paymentSchema = z.object({
  auto_pay_bookings: z.boolean(),
  save_payment_info: z.boolean(),
});

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

export default function PaymentForm() {
  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { auto_pay_bookings: true, save_payment_info: true },
  });

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Payment Methods</h3>
          <div className="space-y-3">
            {cards.map((card) => (
              <div
                key={card.id}
                className="flex items-center justify-between p-4 border rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-100 p-2 rounded">
                    <CreditCard className="text-orange-600 h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {card.type} •••• {card.last4}
                      </p>
                      {card.is_default && (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 shadow-none border-none">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Expires {card.expiry}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500">
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full border-dashed py-6 gap-2">
              <Plus className="h-4 w-4" /> Add New Payment Method
            </Button>
          </div>
        </div>

        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-medium">Payment Preferences</h3>
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="auto_pay_bookings"
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
                      className="data-[state=checked]:bg-orange-500"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
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
                      className="data-[state=checked]:bg-orange-500"
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
            className="bg-orange-500 hover:bg-orange-600 px-8">
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
