export type RequestType = "Tour" | "Maintenance";
export type RequestStatus = "Confirmed" | "Pending" | "Scheduled";

export interface BaseRequest {
  id: string;
  propertyTitle: string;
  type: RequestType;
  subType: string; // e.g., "In-Person", "Virtual", "Medium"
  status: RequestStatus;
  requestId: string;
}

export const MOCK_REQUESTS: BaseRequest[] = [
  {
    id: "1",
    propertyTitle: "Spacious 3BR Family Home",
    type: "Tour",
    subType: "In-Person",
    status: "Confirmed",
    requestId: "TOUR-001",
  },
  {
    id: "2",
    propertyTitle: "Luxury Beach House",
    type: "Tour",
    subType: "Virtual",
    status: "Pending",
    requestId: "TOUR-002",
  },
  {
    id: "3",
    propertyTitle: "General Inspection",
    type: "Maintenance",
    subType: "Medium",
    status: "Scheduled",
    requestId: "MAINT-001",
  },
];
