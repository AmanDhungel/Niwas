"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useGetECom } from "@/services/e-com.service";
import {
  MapPin,
  Search,
  SlidersHorizontal,
  BedDouble,
  Bath,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Heart,
  Zap,
  Eye,
  X,
  Building2,
  Home,
  Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Some property_photos arrive as char-indexed objects instead of strings */
function resolvePhotoUrl(photo: any): string | null {
  if (!photo) return null;
  if (typeof photo === "string") return photo;
  if (photo.url) return photo.url;
  // char-indexed object → reconstruct string
  if (typeof photo === "object" && "0" in photo) {
    const chars = Object.keys(photo)
      .filter((k) => k !== "_id" && !isNaN(Number(k)))
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => photo[k]);
    const path = chars.join("");
    return path.startsWith("http") ? path : `/${path}`;
  }
  return null;
}

function getFirstPhoto(property: any): string | null {
  const photos = property?.media_and_files?.property_photos;
  if (!photos?.length) return null;
  return resolvePhotoUrl(photos[0]);
}

function getPricingBadge(property: any) {
  const cfg = property?.publishing?.pricing_configuration;
  if (!cfg) return null;
  if (cfg.rent?.active)
    return {
      label: `${cfg.rent.currency} ${cfg.rent.amount?.toLocaleString()}/mo`,
      type: "rent",
    };
  if (cfg.sale?.active)
    return {
      label: `${cfg.sale.currency} ${cfg.sale.amount?.toLocaleString()}`,
      type: "sale",
    };
  if (cfg.lease?.active)
    return {
      label: `${cfg.lease.currency} ${cfg.lease.amount?.toLocaleString()}/mo`,
      type: "lease",
    };
  return null;
}

const MapView = dynamic(() => import("./PropertyMapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-gray-400 text-sm animate-pulse">Loading map…</div>
    </div>
  ),
});

const LISTING_TYPES = ["Sales", "Rentals", "Lease"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price Low → High" },
  { value: "price_desc", label: "Price High → Low" },
];

function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const active = searchParams.get("listing_type") ?? "Rentals";
  const city = searchParams.get("city") ?? "";
  const sort = searchParams.get("sort_by") ?? "newest";

  const push = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    p.set("page", "1");
    router.push(`${pathname}?${p.toString()}`);
  };

  return (
    <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
      <div className="max-w-[1600px] mx-auto px-4 py-3 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {LISTING_TYPES.map((t) => (
            <button
              key={t}
              onClick={() =>
                push("listing_type", t === active ? "" : t.toLowerCase())
              }
              className={cn(
                "px-5 py-2 rounded-full text-sm font-semibold transition-all",
                active?.toLowerCase() === t.toLowerCase()
                  ? "bg-[#E8540A] text-white shadow"
                  : "border border-[#E8540A] text-[#E8540A] hover:bg-orange-50",
              )}>
              {t}
            </button>
          ))}

          {/* City search */}
          <div className="relative ml-auto flex-1 min-w-[180px] max-w-xs">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9 rounded-full border-gray-200 text-sm h-9"
              placeholder="City / Location…"
              defaultValue={city}
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  push("city", (e.target as HTMLInputElement).value);
              }}
            />
          </div>

          {/* Sort */}
          <Select value={sort} onValueChange={(v) => push("sort_by", v)}>
            <SelectTrigger className="w-44 h-9 rounded-full border-gray-200 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Extra filters row */}
        <div className="flex flex-wrap gap-2 items-center text-sm">
          <FilterSelect
            label="Property Type"
            queryKey="property_type"
            options={["residential", "commercial", "land"]}
          />
          <FilterSelect
            label="Bedrooms"
            queryKey="bed_type"
            options={["Single", "Double", "Twin", "Studio", "Penthouse"]}
          />
          <FilterSelect
            label="Status"
            queryKey="current_status"
            options={["available", "occupied", "under_maintenance"]}
          />
          <Button
            size="sm"
            className="rounded-full bg-[#E8540A] hover:bg-[#d14a09] text-white gap-1.5 ml-auto"
            onClick={() => router.push(pathname)}>
            <Search className="h-3.5 w-3.5" />
            Search
          </Button>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  queryKey,
  options,
}: {
  label: string;
  queryKey: string;
  options: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get(queryKey) ?? "";

  const push = (v: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (v && v !== "__all__") p.set(queryKey, v);
    else p.delete(queryKey);
    p.set("page", "1");
    router.push(`${pathname}?${p.toString()}`);
  };

  return (
    <Select value={current || "__all__"} onValueChange={push}>
      <SelectTrigger className="h-8 rounded-full border-gray-200 text-xs min-w-[120px]">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">All {label}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o.charAt(0).toUpperCase() + o.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PropertyCard({
  property,
  index,
  highlighted,
  onHover,
}: {
  property: any;
  index: number;
  highlighted: boolean;
  onHover: (id: string | null) => void;
}) {
  const [saved, setSaved] = useState(false);
  const photo = getFirstPhoto(property);
  const pricing = getPricingBadge(property);
  const info = property.basic_info;
  const loc = property.location;
  const details = property.property_details;
  const features = property.publishing?.publishing_features;

  return (
    <div
      className={cn(
        "group bg-white rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer",
        highlighted
          ? "border-[#E8540A] shadow-lg shadow-orange-100 scale-[1.01]"
          : "border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200",
      )}
      onMouseEnter={() => onHover(property._id)}
      onMouseLeave={() => onHover(null)}>
      {/* Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {photo ? (
          <Image
            src={photo}
            alt={info.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-gray-100">
            <Building2 className="h-12 w-12 text-gray-300" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <span
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide",
              info.status === "active"
                ? "bg-green-500 text-white"
                : "bg-gray-500 text-white",
            )}>
            {info.status}
          </span>
          {features?.instant_booking && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8540A] text-white flex items-center gap-1">
              <Zap className="h-2.5 w-2.5" /> Instant
            </span>
          )}
        </div>

        {/* Number marker */}
        <div className="absolute top-3 right-10 bg-[#E8540A] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow">
          {index + 1}
        </div>

        {/* Save */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSaved((s) => !s);
          }}
          className="absolute top-3 right-3 bg-white/90 rounded-full p-1.5 shadow transition hover:scale-110">
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              saved ? "fill-red-500 text-red-500" : "text-gray-400",
            )}
          />
        </button>

        {/* Pricing overlay */}
        {pricing && (
          <div className="absolute bottom-3 left-3 bg-white/95 rounded-lg px-2.5 py-1 shadow text-xs font-bold text-[#E8540A]">
            {pricing.label}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-2">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-1">
            {info.name}
          </h3>
          <span className="text-[10px] text-gray-400 font-mono shrink-0">
            {info.code}
          </span>
        </div>

        <p className="text-xs text-gray-500 flex items-center gap-1 line-clamp-1">
          <MapPin className="h-3 w-3 shrink-0 text-[#E8540A]" />
          {loc.address_line_1}, {loc.city}
        </p>

        {/* Details */}
        <div className="flex items-center gap-3 text-xs text-gray-600 pt-1">
          {details.bed_type && (
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5 text-gray-400" />
              {details.bed_type}
            </span>
          )}
          {details.attached_bathroom && (
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5 text-gray-400" />
              Bath
            </span>
          )}
          {details.room_size && (
            <span className="flex items-center gap-1">
              <Maximize2 className="h-3.5 w-3.5 text-gray-400" />
              {details.room_size.toLocaleString()} sqft
            </span>
          )}
        </div>

        {/* Tags */}
        {property.publishing?.property_tags?.length > 0 && (
          <div className="flex gap-1 flex-wrap pt-1">
            {property.publishing.property_tags
              .slice(0, 3)
              .map((tag: string) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 bg-orange-50 text-[#E8540A] rounded-full font-medium">
                  {tag}
                </span>
              ))}
          </div>
        )}

        {/* Virtual tour */}
        {features?.virtual_tours && (
          <div className="flex items-center gap-1 text-[10px] text-indigo-500 font-medium pt-0.5">
            <Eye className="h-3 w-3" />
            Virtual Tour Available
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 py-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition">
        <ChevronLeft className="h-4 w-4" />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={cn(
            "w-8 h-8 rounded-full text-sm font-semibold transition",
            p === currentPage
              ? "bg-[#E8540A] text-white"
              : "border border-gray-200 text-gray-600 hover:bg-gray-50",
          )}>
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function BrowsePropertiesPage() {
  const { data, isLoading } = useGetECom();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false); // mobile map toggle

  const currentPage = data?.data.pagination?.page || 1;
  const totalPages = data?.data.pagination?.total_pages || 1;
  const total = data?.data.pagination?.total || 0;
  const properties: any[] = data?.data.properties || [];

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  // Scroll to card when map pin clicked
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  useEffect(() => {
    if (selectedId && cardRefs.current[selectedId]) {
      cardRefs.current[selectedId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedId]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <FilterBar />

      {/* Mobile map toggle */}
      <div className="lg:hidden flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100 text-sm">
        <span className="text-gray-500">
          <span className="font-bold text-gray-900">{total}</span> properties
        </span>
        <button
          onClick={() => setMapOpen((v) => !v)}
          className="flex items-center gap-1.5 text-[#E8540A] font-semibold text-xs border border-[#E8540A] px-3 py-1.5 rounded-full">
          <MapPin className="h-3.5 w-3.5" />
          {mapOpen ? "Show List" : "Show Map"}
        </button>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: property list ── */}
        <div
          className={cn(
            "flex flex-col overflow-hidden",
            // desktop: always visible; mobile: toggle with map
            mapOpen ? "hidden lg:flex lg:w-[52%]" : "flex w-full lg:w-[52%]",
          )}>
          {/* Result count */}
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              <span className="font-bold text-gray-900">{total}</span> results
              found
            </p>
          </div>

          {/* Cards grid */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-64 bg-gray-200 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                <Home className="h-12 w-12" />
                <p className="text-sm font-medium">No properties found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {properties.map((p, i) => (
                  <div
                    key={p._id}
                    ref={(el) => {
                      cardRefs.current[p._id] = el;
                    }}
                    onClick={() =>
                      setSelectedId((cur) => (cur === p._id ? null : p._id))
                    }>
                    <PropertyCard
                      property={p}
                      index={i}
                      highlighted={hoveredId === p._id || selectedId === p._id}
                      onHover={setHoveredId}
                    />
                  </div>
                ))}
              </div>
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>

        <div
          className={cn(
            "flex-1 relative",
            mapOpen ? "flex flex-col" : "hidden lg:flex lg:flex-col",
          )}>
          <MapView
            properties={properties}
            highlightedId={hoveredId ?? selectedId}
            onPinClick={(id) => {
              setSelectedId((cur) => (cur === id ? null : id));
              // on mobile, switch to list view to see the card
              if (mapOpen) setMapOpen(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}
