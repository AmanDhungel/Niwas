export interface Booking {
  id: string;
  propertyTitle: string;
  status: "Confirmed" | "Pending" | "Cancelled";
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalCost: number;
  bookedOn: string;
}

export interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}
