import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileForm from "./ProfileStep";
import PasswordForm from "./PasswordStep";
import PaymentForm from "./PaymentStep";
import BillingForm from "./BillingStep";
import NotificationsForm from "./NotificationStep";
import PreferencesForm from "./PreferencesStep";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccountSettingsDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="bg-[#f26522] hover:bg-[#d4561b] text-white rounded-md px-6">
          <Settings size={15} /> Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#1e293b]">
            Account Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full! flex flex-col">
          <TabsList className="grid w-full! grid-cols-6 bg-transparent border-b rounded-none h-auto p-0 gap-4">
            {[
              "profile",
              "password",
              "payment",
              "billing",
              "notifications",
              "preferences",
            ].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="capitalize data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none bg-transparent px-0 py-2 text-muted-foreground data-[state=active]:text-orange-500">
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="profile">
              <ProfileForm />
            </TabsContent>
            <TabsContent value="password">
              <PasswordForm />
            </TabsContent>
            <TabsContent value="payment">
              <PaymentForm />
            </TabsContent>
            <TabsContent value="billing">
              <BillingForm />
            </TabsContent>
            <TabsContent value="notifications">
              <NotificationsForm />
            </TabsContent>
            <TabsContent value="preferences">
              <PreferencesForm />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
