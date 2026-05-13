"use client";

import React, { useState } from "react";
import { Property, OfferFormValues, VisitFormValues } from "./schema";
import { PropertyDetailsDialog } from "./PropertyDetailsDialog";
import { MakeOfferDialog } from "./MakeOfferDialog";
import { ScheduleVisitDialog } from "./ScheduleVisitDialog";
import { Button } from "@/components/ui/button";

const MOCK_PROPERTY: Property = {
  id: "COM-001",
  title: "Prime Retail Space - Times Square",
  location: "New York, NY",
  price: "$4.5M",
  sqft: "3,500",
  roi: "8.5%",
  type: "Retail",
  category: "Commercial Sale",
  image: "/api/placeholder/800/400",
};

export default function Marketplace() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const [activeDialog, setActiveDialog] = useState<
    "details" | "offer" | "visit" | null
  >(null);

  const handleOpenDetails = (p: Property) => {
    setSelectedProperty(p);
    setActiveDialog("details");
  };

  const handleOpenOffer = (p: Property) => {
    setSelectedProperty(p);
    setActiveDialog("offer");
  };

  const handleOpenVisit = (p: Property) => {
    setSelectedProperty(p);
    setActiveDialog("visit");
  };

  return (
    <div className="p-8 space-y-6  min-h-screen">
      <div className="flex gap-4">
        <Button onClick={() => handleOpenDetails(MOCK_PROPERTY)}>
          Details
        </Button>
        <Button
          onClick={() => handleOpenOffer(MOCK_PROPERTY)}
          className="bg-[#f26522]">
          Make Offer
        </Button>
      </div>

      <PropertyDetailsDialog
        property={selectedProperty}
        isOpen={activeDialog === "details"}
        onClose={() => setActiveDialog(null)}
        onAction={(type) => setActiveDialog(type)}
      />

      <MakeOfferDialog
        property={selectedProperty}
        isOpen={activeDialog === "offer"}
        onClose={() => setActiveDialog(null)}
      />

      <ScheduleVisitDialog
        property={selectedProperty}
        isOpen={activeDialog === "visit"}
        onClose={() => setActiveDialog(null)}
      />
    </div>
  );
}
