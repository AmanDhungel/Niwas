import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const profileSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone_number: z.string().optional(),
  address: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
});

export default function ProfileForm() {
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: "", email: "" },
  });

  return (
    <Form {...form}>
      <form className="space-y-6">
        <div className="flex items-center gap-6 p-6 border rounded-lg">
          <Avatar className="h-20 w-20 bg-slate-100">
            <AvatarImage src="" />
            <AvatarFallback>UI</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <h4 className="font-medium">Upload Profile Image</h4>
            <p className="text-sm text-muted-foreground">
              Image should be below 4 mb...
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                className="bg-orange-500 hover:bg-orange-600">
                Upload
              </Button>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          {/* Repeat for other fields: phone_number, address, state, zip_code */}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" type="button">
            Cancel
          </Button>
          <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
