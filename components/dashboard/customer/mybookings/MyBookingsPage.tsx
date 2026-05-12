import React from "react";
import {
  Building2,
  FileText,
  TrendingUp,
  LayoutGrid,
  MapPin,
  Calendar,
  Users,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Booking } from "./schema";

const MyBookingsPage = () => {
  const stats = [
    {
      label: "For Sale",
      value: 45,
      icon: <Building2 className="text-green-600" />,
      bgColor: "bg-green-100",
    },
    {
      label: "For Lease",
      value: 32,
      icon: <FileText className="text-blue-600" />,
      bgColor: "bg-blue-100",
    },
    {
      label: "Investment",
      value: 28,
      icon: <TrendingUp className="text-orange-600" />,
      bgColor: "bg-orange-100",
    },
    {
      label: "Development",
      value: 12,
      icon: <LayoutGrid className="text-purple-600" />,
      bgColor: "bg-purple-100",
    },
  ];

  const bookings: Booking[] = [
    {
      id: "BOOK-001",
      propertyTitle: "Modern Downtown Apartment",
      status: "Confirmed",
      location: "Manhattan, NY",
      checkIn: "2025-02-15",
      checkOut: "2025-02-20",
      guests: 2,
      totalCost: 750,
      bookedOn: "2025-01-20",
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      {/* Breadcrumb & Header */}
      <div className="space-y-1">
        <div className="flex items-center text-xs text-muted-foreground gap-1">
          <span>🏠</span> / <span>My Bookings</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">My Bookings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your rental bookings and reservations
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm">
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                {stat.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bookings List Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">
          Active & Upcoming Bookings
        </h2>

        {bookings.map((booking) => (
          <BookingCard key={booking.id} booking={booking} />
        ))}
      </div>
    </div>
  );
};

export default MyBookingsPage;

const BookingCard = ({ booking }: { booking: Booking }) => {
  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <CardContent className="p-6 space-y-6">
        {/* Top Row: Title, Status, Price */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">
                {booking.propertyTitle}
              </h3>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-2 py-0">
                {booking.status}
              </Badge>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1" />
              {booking.location}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Booking ID: {booking.id}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-slate-900">
              ${booking.totalCost}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
              Total Cost
            </p>
          </div>
        </div>

        {/* Middle Row: Check-in, Check-out, Guests */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50/50 rounded-lg border border-slate-100">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase">
                Check-In
              </p>
              <p className="text-sm font-bold">{booking.checkIn}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase">
                Check-Out
              </p>
              <p className="text-sm font-bold">{booking.checkOut}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase">
                Guests
              </p>
              <p className="text-sm font-bold">{booking.guests} guests</p>
            </div>
          </div>
        </div>

        {/* Footer Row: Booked Date & Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
          <p className="text-[10px] text-muted-foreground">
            Booked on {booking.bookedOn}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs h-9">
              <MessageSquare className="h-3.5 w-3.5 mr-2" />
              Contact Host
            </Button>
            <Button className="bg-[#f26522] hover:bg-[#d4561b] text-white text-xs h-9 px-4">
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
