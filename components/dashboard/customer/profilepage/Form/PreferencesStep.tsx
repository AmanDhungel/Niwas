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

const preferencesSchema = z.object({
  language: z.string().min(1, "Required"),
  timezone: z.string().min(1, "Required"),
  currency: z.string().min(1, "Required"),
  date_format: z.string().min(1, "Required"),
  profile_visibility: z.boolean(),
  show_activity_status: z.boolean(),
});

export default function PreferencesForm() {
  const form = useForm<z.infer<typeof preferencesSchema>>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      language: "en-us",
      timezone: "et",
      currency: "usd",
      date_format: "mm/dd/yyyy",
      profile_visibility: true,
      show_activity_status: true,
    },
  });

  const onSubmit = (data: z.infer<typeof preferencesSchema>) => {
    console.log("Saving preferences:", data);
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
                    defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-50/50">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="en-us">English (US)</SelectItem>
                      <SelectItem value="en-gb">English (UK)</SelectItem>
                      <SelectItem value="np">Nepali</SelectItem>
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
                    defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-50/50">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="et">Eastern Time (ET)</SelectItem>
                      <SelectItem value="pt">Pacific Time (PT)</SelectItem>
                      <SelectItem value="npt">Nepal Time (NPT)</SelectItem>
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
                    defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-50/50">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="aud">AUD ($)</SelectItem>
                      <SelectItem value="npr">NPR (रू)</SelectItem>
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
                    defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-50/50">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
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
                      className="data-[state=checked]:bg-orange-500"
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
                      className="data-[state=checked]:bg-orange-500"
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
