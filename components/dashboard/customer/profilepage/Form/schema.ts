import * as z from "zod";

export const accountSettingsSchema = z
  .object({
    // Step 1: Profile
    full_name: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email"),
    phone_number: z.string().min(10, "Phone number is required"),
    address: z.string().min(5, "Address is required"),
    state: z.string().min(1, "State is required"),
    zip_code: z.string().min(5, "Zip code is required"),

    // Step 2: Password
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),

    // Step 3: Payment
    card_number: z.string().min(16, "Invalid card number"),
    expiry_date: z.string().min(5, "MM/YY required"),
    cvv: z.string().min(3, "CVV required"),

    // Step 4: Billing
    billing_address: z.string().min(5, "Billing address is required"),
    billing_city: z.string().min(1, "City is required"),

    // Step 5: Notifications
    email_notifications: z.boolean(),
    sms_notifications: z.boolean(),
    marketing_emails: z.boolean(),

    // Step 6: Preferences
    language: z.string(),
    timezone: z.string(),
    currency: z.string(),
    profile_visibility: z.boolean(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type AccountSettingsValues = z.infer<typeof accountSettingsSchema>;
