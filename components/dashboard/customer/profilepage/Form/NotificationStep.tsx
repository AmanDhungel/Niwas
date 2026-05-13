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

const notificationSchema = z.object({
  email_notifications: z.boolean(),
  sms_notifications: z.boolean(),
  property_alerts: z.boolean(),
  tour_reminders: z.boolean(),
  maintenance_updates: z.boolean(),
  marketing_emails: z.boolean(),
});

const items = [
  {
    id: "email_notifications",
    label: "Email Notifications",
    desc: "Receive updates via email",
  },
  {
    id: "sms_notifications",
    label: "SMS Notifications",
    desc: "Receive text message alerts",
  },
  {
    id: "property_alerts",
    label: "Property Alerts",
    desc: "New properties matching your preferences",
  },
  {
    id: "tour_reminders",
    label: "Tour Reminders",
    desc: "Reminders for scheduled property tours",
  },
  {
    id: "maintenance_updates",
    label: "Maintenance Updates",
    desc: "Status updates for maintenance requests",
  },
  {
    id: "marketing_emails",
    label: "Marketing Emails",
    desc: "Special offers and promotions",
  },
] as const;

export default function NotificationsForm() {
  const form = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      email_notifications: true,
      sms_notifications: true,
      property_alerts: true,
      tour_reminders: true,
      maintenance_updates: true,
      marketing_emails: true,
    },
  });

  return (
    <Form {...form}>
      <form className="space-y-4">
        <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
        <div className="space-y-3">
          {items.map((item) => (
            <FormField
              key={item.id}
              control={form.control}
              name={item.id as any}
              render={({ field }) => (
                <FormItem className="flex items-center justify-between p-4 border rounded-xl space-y-0">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{item.label}</FormLabel>
                    <FormDescription>{item.desc}</FormDescription>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-orange-500 h-5 w-5 border-slate-300"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-6">
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
