"use client";
import { Button } from "@/components/ui/button";
import { Badge, MessageSquare, Wrench } from "lucide-react";
import { RequestMaintenanceForm } from "./RequestMaintenanceForm";
import { MaintenanceDetailsDialog } from "./MaintenanceDetailsDialog";
import { MOCK_REQUEST } from "./schema";
import { useState } from "react";

export default function MaintenanceDashboard() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Maintenance & Repair Services
          </h1>
          <p className="text-slate-500">
            Request inspections and repair services
          </p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          <Wrench className="h-4 w-4" /> New Request
        </Button>
      </div>

      {/* Simplified Stats Section */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {/* Stats Cards here (For Sale, Lease, etc.) */}
      </div>

      <div className="bg-white rounded-xl border p-6 mb-8">
        <h2 className="font-bold text-slate-800 mb-4">Available Services</h2>
        <div className="grid grid-cols-4 gap-4">
          {[
            "Property Inspection",
            "General Repairs",
            "HVAC Service",
            "Plumbing",
          ].map((service) => (
            <div
              key={service}
              className="p-6 border rounded-xl text-center hover:border-orange-500 cursor-pointer transition-colors">
              <p className="font-bold text-sm text-slate-800">{service}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-bold text-slate-800 mb-4">
          My Maintenance Requests
        </h2>
        <div className="border rounded-lg p-6 flex justify-between items-center bg-white shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800">
                {MOCK_REQUEST.serviceType}
              </h3>
              <Badge className="bg-blue-100 text-blue-600">
                {MOCK_REQUEST.status}
              </Badge>
              <Badge className="bg-yellow-100 text-yellow-600">
                {MOCK_REQUEST.priority}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">
              Considering: {MOCK_REQUEST.propertyAddress}
            </p>
            <p className="text-xs text-slate-400">
              Request ID: {MOCK_REQUEST.id}
            </p>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" /> Contact
            </Button>
            <Button
              onClick={() => setIsDetailsOpen(true)}
              className="bg-orange-500 text-white"
              size="sm">
              View Details
            </Button>
          </div>
        </div>
      </div>

      <RequestMaintenanceForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
      <MaintenanceDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        request={MOCK_REQUEST}
      />
    </div>
  );
}
