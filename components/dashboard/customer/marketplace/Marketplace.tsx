import React from "react";
import {
  Search,
  SlidersHorizontal,
  DollarSign,
  FileText,
  TrendingUp,
  Building2,
  MapPin,
  Calendar,
  Bookmark,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PropertyDetailsDialog } from "./PropertyDetailsDialog";
import { ScheduleVisitDialog } from "./ScheduleVisitDialog";
import { MakeOfferDialog } from "./MakeOfferDialog";

// types/property.ts
export interface Property {
  id: string;
  title: string;
  location: string;
  category: "Retail" | "Office" | "Industrial";
  price: string;
  priceLabel: "sale" | "investment" | "month";
  sqft: string;
  roi?: string;
  image: string;
  isFeatured: boolean;
  tag: string;
}

export const MOCK_PROPERTIES: Property[] = [
  {
    id: "1",
    title: "Prime Retail Space - Times Square",
    location: "New York, NY",
    category: "Retail",
    price: "$4.5M",
    priceLabel: "sale",
    sqft: "3,500",
    roi: "8.5%",
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop",
    isFeatured: true,
    tag: "Commercial Sale",
  },
  {
    id: "2",
    title: "Office Building Investment",
    location: "San Francisco, CA",
    category: "Office",
    price: "$12.0M",
    priceLabel: "investment",
    sqft: "25,000",
    roi: "12.3%",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop",
    isFeatured: true,
    tag: "Investment Opportunity",
  },
  {
    id: "3",
    title: "Industrial Warehouse Complex",
    location: "Houston, TX",
    category: "Industrial",
    price: "$0.0M",
    priceLabel: "month",
    sqft: "50,000",
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1000&auto=format&fit=crop",
    isFeatured: false,
    tag: "Commercial Lease",
  },
];

const MarketplacePage = () => {
  return (
    <div className="min-h-screen w-full  p-6 md:p-10 font-sans">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Building2 size={14} /> / Marketplace
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Commercial Marketplace
        </h1>
        <p className="text-muted-foreground mt-1">
          Buy, sell, and invest in commercial properties
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="For Sale"
          count="45"
          icon={<DollarSign className="text-emerald-500" />}
          bgColor="bg-emerald-50"
        />
        <StatCard
          label="For Lease"
          count="32"
          icon={<FileText className="text-blue-500" />}
          bgColor="bg-blue-50"
        />
        <StatCard
          label="Investment"
          count="28"
          icon={<TrendingUp className="text-orange-500" />}
          bgColor="bg-orange-50"
        />
        <StatCard
          label="Development"
          count="12"
          icon={<Building2 className="text-purple-500" />}
          bgColor="bg-purple-50"
        />
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2 mb-10">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input className="pl-10 bg-white" placeholder="Search..." />
        </div>
        <Button variant="outline" className="flex gap-2">
          Filter <SlidersHorizontal size={16} />
        </Button>
      </div>

      {/* Property List */}
      <section>
        <h2 className="text-xl font-semibold mb-6">
          Featured Commercial Properties
        </h2>
        <div className="space-y-6">
          {MOCK_PROPERTIES.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>
    </div>
  );
};

// Sub-component for Stats
const StatCard = ({
  label,
  count,
  icon,
  bgColor,
}: {
  label: string;
  count: string;
  icon: React.ReactNode;
  bgColor: string;
}) => (
  <Card className="border-none shadow-sm">
    <CardContent className="p-6 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold mt-1">{count}</p>
      </div>
      <div className={`p-4 rounded-xl ${bgColor}`}>{icon}</div>
    </CardContent>
  </Card>
);

// Sub-component for Property Row
const PropertyCard = ({ property }: { property: Property }) => (
  <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow">
    <div className="flex flex-col md:flex-row">
      {/* Image Container */}
      <div className="w-full md:w-[320px] h-[240px] relative">
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content Container */}
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900">
                {property.title}
              </h3>
              {property.isFeatured && (
                <Badge
                  variant="secondary"
                  className="bg-orange-500 text-white hover:bg-orange-600 border-none rounded-sm px-2 text-[10px] uppercase">
                  Featured
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground h-8 w-8">
              <Bookmark size={18} />
            </Button>
          </div>

          <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
            <MapPin size={14} /> {property.location}
          </div>

          <Badge
            variant="outline"
            className="mt-3 bg-slate-50 text-slate-500 font-medium">
            {property.category}
          </Badge>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-8 mt-6">
            <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="text-lg font-bold text-emerald-600">
                {property.price}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  {property.priceLabel}
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Square Feet</p>
              <p className="text-lg font-bold">
                {property.sqft}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  sqft
                </span>
              </p>
            </div>
            {property.roi && (
              <div>
                <p className="text-xs text-muted-foreground">Expected ROI</p>
                <p className="text-lg font-bold text-orange-600">
                  {property.roi}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    annually
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-6 border-t border-slate-100 gap-4">
          <Badge
            variant="secondary"
            className="bg-blue-50 text-blue-600 border-none rounded-full px-4 py-1">
            {property.tag}
          </Badge>
          <div className="flex gap-2 w-full sm:w-auto">
            <PropertyDetailsDialog property={property} />
            <ScheduleVisitDialog />
            <MakeOfferDialog property={property} />
          </div>
        </div>
      </div>
    </div>
  </Card>
);

export default MarketplacePage;
