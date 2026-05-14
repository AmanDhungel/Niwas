"use client";
import Link from "next/link";
import {
  Search,
  Calendar,
  Heart,
  CheckCircle2,
  Zap,
  ShoppingCart,
  Wrench,
  Star,
  MapPin,
  BedDouble,
  Bath,
  Square,
  ChevronRight,
  Home,
  Clock,
} from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  useGetLongTermOccupany,
  useGetShortTermOccupany,
} from "@/services/occupancy.service";

export default function OverviewPage() {
  const { data: LongTerm, isLoading: LongTermloading } =
    useGetLongTermOccupany();
  const { data: shortTerm, isLoading: ShortTermloading } =
    useGetShortTermOccupany();

  console.log(LongTerm, shortTerm);

  if (LongTermloading || ShortTermloading) return <div>Loading...</div>;
  return (
    <div className="w-full min-h-screen bg-white p-6 md:p-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <Breadcrumb className="mt-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="flex items-center gap-1">
                <Home className="h-3 w-3" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-slate-500">
                Overview
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-[#F26522] p-8 text-white">
        <div className="relative z-10 space-y-4">
          <h2 className="text-3xl font-bold">Welcome to RentChain!</h2>
          <p className="text-orange-50/90 max-w-md text-sm">
            Discover your perfect rental, book property tours, and access our
            marketplace
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              variant="secondary"
              className="bg-white text-[#F26522] hover:bg-orange-50 gap-2">
              <Search className="h-4 w-4" />
              Browse Properties
            </Button>
            <Button
              variant="outline"
              className="border-white text-white hover:bg-white/10 gap-2">
              <Calendar className="h-4 w-4" />
              Schedule Tour
            </Button>
          </div>
        </div>
        <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-20">
          <Zap className="h-32 w-32" strokeWidth={1} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Saved Properties"
          value="12"
          sub="Your favorites"
          icon={Heart}
          iconBg="bg-pink-50"
          iconColor="text-pink-500"
        />
        <StatCard
          title="Scheduled Tours"
          value="3"
          sub="Upcoming visits"
          icon={Calendar}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
        />
        <StatCard
          title="Active Bookings"
          value="1"
          sub="Confirmed"
          icon={CheckCircle2}
          iconBg="bg-green-50"
          iconColor="text-green-500"
        />
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <Zap className="h-4 w-4 text-[#F26522]" />
          Quick Actions
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href={"/dashboard/customer/browse-rental"}>
            <QuickAction
              icon={Search}
              label="Browse Rentals"
              color="text-orange-500"
            />
          </Link>
          <Link href={"/dashboard/customer/property-tour"}>
            <QuickAction
              icon={Calendar}
              label="Book Tour"
              color="text-blue-500"
            />
          </Link>
          <Link href={"/dashboard/customer/marketplace"}>
            <QuickAction
              icon={ShoppingCart}
              label="Marketplace"
              color="text-green-500"
            />
          </Link>
          <Link href={"/dashboard/customer/maintenance"}>
            <QuickAction
              icon={Wrench}
              label="Request Service"
              color="text-purple-500"
            />
          </Link>
        </div>
      </section>

      {/* --- Featured Rentals --- */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <Clock className="h-4 w-4 text-[#F26522]" />
            Featured Short-term Rentals
          </div>
          <Link
            href="#"
            className="text-sm font-medium flex items-center hover:underline">
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {shortTerm?.data.map((rental) => (
            <RentalCard
              key={rental?._id}
              title={rental?.property?.basic_info?.name ?? "N/A"}
              location={rental?.property?.location?.address_line_1 ?? "N/A"}
              price={
                rental?.property?.publishing?.pricing_configuration?.rent
                  ?.amount
                  ? (
                      rental.property.publishing.pricing_configuration.rent
                        .amount / 30
                    ).toFixed(2)
                  : "N/A"
              }
              rating="4.9"
              reviews="127"
              // beds={2}
              // baths={2}
              sqft={rental?.property?.property_details?.room_size ?? "N/A"}
              img={rental?.property?.media_and_files.property_photos[0] ?? ""}
            />
          ))}
        </div>
      </section>

      {/* --- Upcoming Property Tours --- */}
      <section className="space-y-4 pb-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <Calendar className="h-4 w-4 text-blue-500" />
            Upcoming Property Tours
          </div>
          <Link
            href="#"
            className="text-sm font-medium flex items-center hover:underline">
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        <Card className="border-slate-100 shadow-none">
          <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full">
              <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">
                  Spacious 3BR Family Home
                </h4>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Brooklyn, NY
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> 2025-02-05 @ 2:00 PM
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-green-50 text-green-600 hover:bg-green-50 text-[10px] h-5">
                    Confirmed
                  </Badge>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="bg-slate-900 text-white hover:bg-slate-800 w-full md:w-auto gap-2">
              View Details <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// --- Helper Components ---

function StatCard({ title, value, sub, icon: Icon, iconBg, iconColor }: any) {
  return (
    <Card className="border-slate-100 shadow-sm">
      <CardContent className="p-6 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
            <Icon className={`h-3 w-3 ${iconColor}`} /> {sub}
          </div>
        </div>
        <div
          className={`h-12 w-12 rounded-full ${iconBg} flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ icon: Icon, label, color }: any) {
  return (
    <Card className="border-slate-100 hover:border-slate-300 transition-colors cursor-pointer group shadow-none">
      <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
        <Icon
          className={`h-5 w-5 ${color} group-hover:scale-110 transition-transform`}
        />
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      </CardContent>
    </Card>
  );
}

function RentalCard({
  title,
  location,
  price,
  rating,
  reviews,
  beds,
  baths,
  sqft,
  img,
}: any) {
  return (
    <Card className="overflow-hidden border-slate-100 shadow-none group pt-0">
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          width={1000}
          height={1000}
          src={img}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e: any) => (e.target.src = "/no-image.png")}
        />
        <div className="absolute top-3 left-3">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-full bg-white/90 backdrop-blur shadow-sm">
            <Heart className="h-4 w-4 text-slate-600" />
          </Button>
        </div>
        <div className="absolute top-3 right-3">
          <Badge className="bg-[#F26522] hover:bg-[#F26522] text-white text-[10px]">
            Featured
          </Badge>
        </div>
      </div>
      <CardContent className="p-5 space-y-3">
        <div className="space-y-1">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500 flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {location}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          {/* <span className="flex items-center gap-1">
            <BedDouble className="h-3 w-3" /> {beds}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3 w-3" /> {baths}
          </span> */}
          <span className="flex items-center gap-1">
            <Square className="h-3 w-3" /> {sqft} sqft
          </span>
        </div>
        <div className="pt-2 flex items-center justify-between">
          <div className="text-xl font-bold text-[#F26522]">
            ${price}
            <span className="text-sm font-normal text-slate-400">/night</span>
          </div>
          {/* <div className="flex items-center gap-1 text-sm font-bold">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {rating}{" "}
            <span className="font-normal text-slate-400">({reviews})</span>
          </div> */}
        </div>
      </CardContent>
    </Card>
  );
}
