import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetProfile, useUpdateProfile } from "@/services/profile.service";
import { useRouter } from "next/navigation";

const profileSchema = z.object({
  user_name: z.string().min(2, "Name is required"),
  user_email: z.string().email("Invalid email address"),
  user_phone: z.string().optional(),
  address_line: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  photo: z.any().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileForm({ data }: { data: any }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const { mutate } = useUpdateProfile();

  const router = useRouter();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      user_name: "",
      user_email: "",
      user_phone: "",
      address_line: "",
      country: "Nepal",
      state: "",
      city: "",
      postal_code: "",
    },
  });

  useEffect(() => {
    if (data) {
      form.setValue("user_name", data?.user_name);
      form.setValue("user_email", data?.user_email);
      form.setValue("user_phone", data?.user_phone);
      form.setValue("address_line", data?.address?.address_line);
      form.setValue("country", data?.address?.country);
      form.setValue("state", data?.address?.state);
      form.setValue("city", data?.address?.city);
      form.setValue("postal_code", data?.address?.postal_code);
      setTimeout(() => {
        setPreviewUrl(data?.photo);
      }, 0);
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert("Image must be below 4MB");
        return;
      }
      form.setValue("photo", file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (key !== "photo" && value !== undefined) {
          formData.append(key, value);
        }
      });

      if (data.photo) {
        formData.append("photo", data.photo);
      }

      mutate(formData, {
        onSuccess: () => {
          router.refresh();
        },
      });
    } catch (error) {
      console.error(error);
      alert("Error updating profile");
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6  mx-auto p-4">
        <div className="flex items-center gap-6 p-6 border rounded-lg">
          <Avatar className="h-20 w-20 bg-slate-100">
            <AvatarImage src={previewUrl} />
            <AvatarFallback>UI</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <h4 className="font-medium">Upload Profile Image</h4>
            <p className="text-sm text-muted-foreground">
              Image should be below 4 mb...
            </p>
            <div className="flex gap-2">
              {/* Hidden file input controlled by custom button */}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <Button
                type="button"
                className="bg-orange-500 hover:bg-orange-600"
                onClick={() => fileInputRef.current?.click()}>
                Upload
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPreviewUrl("");
                  form.setValue("photo", undefined);
                }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>

        {/* Form Fields Grid */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="user_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="user_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="user_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address_line"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address Line</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="postal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postal Code</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" type="button" onClick={() => form.reset()}>
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
