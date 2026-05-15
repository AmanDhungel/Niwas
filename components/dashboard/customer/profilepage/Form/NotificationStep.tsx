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
import { Loader2 } from "lucide-react"; // Imported for loading spinner
import { useUpdateNotification } from "@/services/profile.service";
import { toast } from "sonner";

// Schema matching your backend requirements
const notificationSchema = z.object({
  email_notifications: z.boolean(),
  sms_notifications: z.boolean(),
  property_alerts: z.boolean(),
  tour_reminders: z.boolean(),
  maintenance_updates: z.boolean(),
  marketing_emails: z.boolean(),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

// Typed item array elements explicitly using the schema's keys
const items: {
  id: keyof NotificationFormValues;
  label: string;
  desc: string;
}[] = [
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
];

interface NotificationsFormProps {
  data: {
    notification_preferences: {
      email_notification: boolean;
      sms_notification: boolean;
      property_alerts: boolean;
      tour_reminders: boolean;
      maintenance_updates: boolean;
      marketing_emails: boolean;
    };
  };
}

export default function NotificationsForm({ data }: NotificationsFormProps) {
  const { mutate, isPending } = useUpdateNotification();

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      email_notifications:
        data?.notification_preferences?.email_notification ?? false,
      sms_notifications:
        data?.notification_preferences?.sms_notification ?? false,
      property_alerts: data?.notification_preferences?.property_alerts ?? false,
      tour_reminders: data?.notification_preferences?.tour_reminders ?? false,
      maintenance_updates:
        data?.notification_preferences?.maintenance_updates ?? false,
      marketing_emails:
        data?.notification_preferences?.marketing_emails ?? false,
    },
  });

  function onSubmit(values: NotificationFormValues) {
    mutate(values, {
      onSuccess: () => {
        toast.success("Notification preferences updated successfully!");
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>

        <div className="space-y-3">
          {items.map((item) => (
            <FormField
              key={item.id}
              control={form.control}
              name={item.id} // Stripped the 'as any' casting for native type safety
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
                      className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 h-5 w-5 border-slate-300"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <Button variant="outline" type="button" disabled={isPending}>
            Cancel
          </Button>
          {/* 2. Tied loading state constraints here */}
          <Button
            type="submit"
            disabled={isPending}
            className="bg-orange-500 hover:bg-orange-600 px-8 text-white min-w-[140px]">
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
