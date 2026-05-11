"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  Heart,
  Star,
  MapPin,
  BedDouble,
  Bath,
  Square,
  Home,
  Clock,
  Filter,
  Eye,
  CalendarDays,
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
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

// --- Mock Data ---
const RENTALS = [
  {
    id: 1,
    type: "short",
    title: "Modern Downtown Apartment",
    location: "Manhattan, NY",
    beds: 2,
    baths: 2,
    sqft: 950,
    tags: ["WiFi", "Kitchen", "Parking"],
    price: 150,
    rating: 4.9,
    reviews: 127,
    featured: true,
    img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: 2,
    type: "short",
    title: "Luxury Beach House",
    location: "Miami, FL",
    beds: 4,
    baths: 3,
    sqft: 2500,
    tags: ["Ocean View", "Pool", "WiFi"],
    price: 350,
    rating: 5,
    reviews: 89,
    featured: true,
    img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: 3,
    type: "short",
    title: "Cozy Studio in Arts District",
    location: "Los Angeles, CA",
    beds: 1,
    baths: 1,
    sqft: 450,
    tags: ["WiFi", "Kitchen", "Pet Friendly"],
    price: 85,
    rating: 4.7,
    reviews: 234,
    featured: false,
    img: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: 4,
    type: "long",
    title: "Spacious 3BR Family Home",
    location: "Brooklyn, NY",
    beds: 3,
    baths: 2,
    sqft: 1800,
    duration: "12 months minimum",
    price: 3200,
    rating: 4.8,
    reviews: 45,
    img: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: 5,
    type: "long",
    title: "Modern 2BR with City Views",
    location: "Chicago, IL",
    beds: 2,
    baths: 2,
    sqft: 1200,
    duration: "6-12 months",
    price: 2400,
    rating: 4.9,
    reviews: 67,
    img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=800",
  },
];

export default function BrowseRentals() {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter Logic: Filter by title or location
  const filteredRentals = useMemo(() => {
    return RENTALS.filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery]);

  const shortTerm = filteredRentals.filter((r) => r.type === "short");
  const longTerm = filteredRentals.filter((r) => r.type === "long");

  return (
    <div className="w-full min-h-screen bg-white p-6 md:p-10 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Browse Rentals</h1>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="flex items-center gap-1">
                  <Home className="h-3 w-3" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-slate-500">
                  Browse Rentals
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="pt-4">
            <h2 className="text-xl font-bold text-slate-900">
              Browse Rental Properties
            </h2>
            <p className="text-sm text-slate-500">
              Find your perfect short-term or long-term rental
            </p>
          </div>
        </div>
        <Button className="bg-[#F26522] hover:bg-[#d95a1e] text-white gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Advanced Filters
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            className="pl-10 h-11 border-slate-200 focus-visible:ring-[#F26522]"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          className="h-11 px-4 gap-2 text-slate-600 border-slate-200">
          Filter <Filter className="h-4 w-4" />
        </Button>
      </div>

      <section className="space-y-6">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <Clock className="h-5 w-5 text-[#F26522]" />
          Short-term Rentals
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shortTerm.map((rental) => (
            <ShortTermCard key={rental.id} rental={rental} />
          ))}
          {shortTerm.length === 0 && (
            <p className="text-slate-400 italic">
              No short-term rentals found matching your search.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-6 pb-20">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <Home className="h-5 w-5 text-[#F26522]" />
          Long-term Rentals
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {longTerm.map((rental) => (
            <LongTermCard key={rental.id} rental={rental} />
          ))}
          {longTerm.length === 0 && (
            <p className="text-slate-400 italic">
              No long-term rentals found matching your search.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function ShortTermCard({ rental }: any) {
  return (
    <Card className="overflow-hidden border-slate-100 shadow-sm group hover:shadow-md transition-shadow">
      <div className="relative h-56 w-full">
        <Image
          width={1000}
          height={1000}
          src={rental.img}
          alt={rental.title}
          className="w-full h-full object-cover"
        />
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-3 left-3 h-8 w-8 rounded-full bg-white/90 backdrop-blur">
          <Heart className="h-4 w-4 text-slate-600" />
        </Button>
        {rental.featured && (
          <Badge className="absolute top-3 right-3 bg-[#F26522] hover:bg-[#F26522] text-[10px]">
            Featured
          </Badge>
        )}
      </div>
      <CardContent className="p-5 space-y-4">
        <div className="space-y-1">
          <h3 className="font-bold text-slate-900 text-lg leading-tight">
            {rental.title}
          </h3>
          <p className="text-sm text-slate-500 flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {rental.location}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <BedDouble className="h-3 w-3" /> {rental.beds}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3 w-3" /> {rental.baths}
          </span>
          <span className="flex items-center gap-1">
            <Square className="h-3 w-3" /> {rental.sqft} sqft
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {rental.tags.map((tag: string) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-slate-50 text-slate-500 font-normal text-[10px] px-2 h-5 border-slate-100">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
          <div className="text-xl font-bold text-[#F26522]">
            ${rental.price}
            <span className="text-sm font-normal text-slate-400">/night</span>
          </div>
          <div className="flex items-center gap-1 text-sm font-bold">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {rental.rating}{" "}
            <span className="font-normal text-slate-400">
              ({rental.reviews})
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            variant="outline"
            className="w-full text-slate-600 border-slate-200 h-9 gap-2">
            <Eye className="h-4 w-4" /> View
          </Button>
          <Button className="w-full bg-[#F26522] hover:bg-[#d95a1e] h-9 gap-2">
            Book
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LongTermCard({ rental }: any) {
  return (
    <Card className="overflow-hidden border-slate-100 shadow-sm flex flex-col md:flex-row group hover:shadow-md transition-shadow">
      <div className="relative w-full md:w-56 h-48 md:h-auto">
        <Image
          width={1000}
          height={1000}
          src={rental.img}
          alt={rental.title}
          className="w-full h-full object-cover"
        />
      </div>
      <CardContent className="p-5 flex-1 space-y-4 relative">
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-4 right-4 h-8 w-8 rounded-full text-slate-400 hover:text-red-500">
          <Heart className="h-5 w-5" />
        </Button>
        <div className="space-y-1">
          <h3 className="font-bold text-slate-900 text-lg leading-tight">
            {rental.title}
          </h3>
          <p className="text-sm text-slate-500 flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {rental.location}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <BedDouble className="h-3 w-3" /> {rental.beds}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="h-3 w-3" /> {rental.baths}
          </span>
          <span className="flex items-center gap-1">
            <Square className="h-3 w-3" /> {rental.sqft} sqft
          </span>
        </div>
        <Badge
          variant="secondary"
          className="bg-slate-50 text-slate-500 font-medium text-[11px] px-2 py-0 h-6 border-slate-100">
          {rental.duration}
        </Badge>
        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
          <div className="text-xl font-bold text-[#F26522]">
            ${rental.price}
            <span className="text-sm font-normal text-slate-400">/month</span>
          </div>
          <div className="flex items-center gap-1 text-sm font-bold">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {rental.rating}{" "}
            <span className="font-normal text-slate-400">
              ({rental.reviews})
            </span>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 text-slate-600 border-slate-200 h-9 gap-2">
            <Eye className="h-4 w-4" /> View Details
          </Button>
          <Button className="flex-1 bg-[#F26522] hover:bg-[#d95a1e] h-9 gap-2">
            <CalendarDays className="h-4 w-4" /> Schedule Tour
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
