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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdatePreferences } from "@/services/profile.service";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const preferencesSchema = z.object({
  language: z.string().min(1, "Required"),
  timezone: z.string().min(1, "Required"),
  currency: z.string().min(1, "Required"),
  date_format: z.string().min(1, "Required"),
  profile_visibility: z.boolean(),
  show_activity_status: z.boolean(),
});

type PreferencesFormValues = z.infer<typeof preferencesSchema>;

export default function PreferencesForm({ data }: { data: any }) {
  const { mutate, isPending } = useUpdatePreferences();
  const queryClient = useQueryClient();

  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      language: data?.account_preferences?.language || "",
      timezone: data?.account_preferences?.timezone || "",
      currency: data?.account_preferences?.currency || "", // Fixed typo: curreny -> currency
      date_format: data?.account_preferences?.date_format || "",
      profile_visibility:
        data?.account_preferences?.privacy_settings?.profile_visibility ===
        "private"
          ? false
          : true,
      show_activity_status:
        !!data?.account_preferences?.privacy_settings?.show_activity_status,
    },
  });

  const onSubmit = (values: PreferencesFormValues) => {
    const payload = {
      language: values.language,
      timezone: values.timezone,
      currency: values.currency,
      date_format: values.date_format,
      privacy_settings: JSON.stringify({
        profile_visibility: values.profile_visibility ? "public" : "private",
        show_activity_status: values.show_activity_status,
      }),
    };

    mutate(payload, {
      onSuccess: () => {
        toast.success("Preferences updated successfully!");
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Account Preferences</h3>
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-50/50">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="nepali">Nepali</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-50/50">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ET">Eastern Time (ET)</SelectItem>
                      <SelectItem value="PT">Pacific Time (PT)</SelectItem>
                      <SelectItem value="NPT">Nepal Time (NPT)</SelectItem>
                      <SelectItem value="UTC">
                        Universal Time Zone (UTC)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-50/50">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="AUD">AUD ($)</SelectItem>
                      <SelectItem value="NPR">NPR (रू)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date_format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Format</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-50/50">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Privacy Settings Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Privacy Settings</h3>
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="profile_visibility"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between p-4 border rounded-xl space-y-0">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Profile Visibility
                    </FormLabel>
                    <FormDescription>
                      Make your profile visible to property owners
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
              control={form.control}
              name="show_activity_status"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between p-4 border rounded-xl space-y-0">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Show Activity Status
                    </FormLabel>
                    <FormDescription>
                      Let others see when youre online
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

        {/* Danger Zone */}
        <div className="p-6 border border-red-100 bg-red-50/50 rounded-xl space-y-4">
          <div>
            <h4 className="text-red-600 font-bold">Danger Zone</h4>
            <p className="text-sm text-red-500">
              Once you delete your account, there is no going back. Please be
              certain.
            </p>
          </div>
          <Button
            variant="outline"
            type="button"
            className="text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 bg-white">
            Delete Account
          </Button>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="outline"
            type="button"
            disabled={isPending}
            onClick={() => form.reset()}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-orange-500 hover:bg-orange-600 px-8 min-w-[140px]">
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
