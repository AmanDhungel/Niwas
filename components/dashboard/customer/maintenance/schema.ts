// types/maintenance.ts
export type Priority = "Low" | "Medium" | "High" | "Urgent";
export type RequestStatus = "Scheduled" | "Pending" | "Completed";

export interface MaintenanceRequest {
  id: string;
  serviceType: string;
  status: RequestStatus;
  priority: Priority;
  propertyAddress: string;
  description: string;
  requestedDate: string;
  scheduledDate?: string;
  estimatedCost: string;
}

export const MOCK_REQUEST: MaintenanceRequest = {
  id: "MAINT-001",
  serviceType: "General Inspection",
  status: "Scheduled",
  priority: "Medium",
  propertyAddress: "Spacious 3BR Family Home, Brooklyn",
  description: "Pre-lease property inspection before signing",
  requestedDate: "2025-01-25",
  scheduledDate: "2025-02-04",
  estimatedCost: "$150",
};
