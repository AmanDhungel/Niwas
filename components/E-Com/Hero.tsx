"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation"; // Added for routing
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Hero() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    listing_type: searchParams.get("listing_type") || "sale",
    category: searchParams.get("category") || "",
    city: searchParams.get("city") || "",
    apartment_type: searchParams.get("apartment_type") || "",
    price_max: searchParams.get("price_max") || "",
    available_from: searchParams.get("available_from") || "",
    available_to: searchParams.get("available_to") || "",
  });

  // Dynamic URL Updater
  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());

    // Iterate through state and update params
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value.toString());
      } else {
        params.delete(key); // Remove empty filters from URL
      }
    });

    // Reset page to 1 on new search
    params.set("page", "1");

    // Push to the current path with new query strings
    router.push(`${pathname}?${params.toString()}`);
  };

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')`,
        }}>
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 w-full max-w-6xl px-4 text-center text-white">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Find Your Perfect Place To Call Home
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-12 opacity-90">
          Exceptional results through dedication and a seamless experience.
        </p>

        <Tabs
          defaultValue={filters.listing_type}
          className="w-full"
          onValueChange={(v) => updateFilter("listing_type", v)}>
          <div className="flex justify-center mb-0">
            <TabsList className="bg-white/20 backdrop-blur-sm p-1 h-auto border-b-0">
              <TabsTrigger
                value="sale"
                className="data-[state=active]:bg-[#ff6b35] px-10 py-3 font-semibold">
                Sales
              </TabsTrigger>
              <TabsTrigger
                value="rent"
                className="data-[state=active]:bg-[#ff6b35] px-10 py-3 font-semibold">
                Rentals
              </TabsTrigger>
              <TabsTrigger
                value="lease"
                className="data-[state=active]:bg-[#ff6b35] px-10 py-3 font-semibold">
                Invest
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="bg-white rounded-xl shadow-2xl p-6 text-black">
            {/* SALES TAB CONTENT */}
            <TabsContent value="sale" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="text-left">
                  <Label>Categories</Label>
                  <Select
                    value={filters.category}
                    onValueChange={(v) => updateFilter("category", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Property Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-left">
                  <Label>City</Label>
                  <Select
                    value={filters.city}
                    onValueChange={(v) => updateFilter("city", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Property City" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Paphos">Paphos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-left">
                  <Label>Beds & Baths</Label>
                  <Select
                    value={filters.apartment_type}
                    onValueChange={(v) => updateFilter("apartment_type", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Beds | Baths" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2-bedroom">2 Bed | 2 Bath</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-left">
                  <Label>Price</Label>
                  <Select
                    value={filters.price_max}
                    onValueChange={(v) => updateFilter("price_max", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sale Price" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="500000">Up to €500,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleSearch}
                  className="bg-[#ff6b35] hover:bg-[#e85a20] h-11 w-full gap-2 font-bold uppercase">
                  <Search className="w-4 h-4" /> Search
                </Button>
              </div>
            </TabsContent>

            {/* RENTALS TAB CONTENT */}
            <TabsContent value="rent" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
                <div className="text-left">
                  <Label>Categories</Label>
                  <Select onValueChange={(v) => updateFilter("category", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                  </Select>
                </div>
                <div className="text-left">
                  <Label>Cities</Label>
                  <Select onValueChange={(v) => updateFilter("city", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="City" />
                    </SelectTrigger>
                  </Select>
                </div>
                <div className="text-left">
                  <Label>Beds & Baths</Label>
                  <Select
                    onValueChange={(v) => updateFilter("apartment_type", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Beds" />
                    </SelectTrigger>
                  </Select>
                </div>
                <div className="text-left">
                  <Label>Check-In</Label>
                  <Input
                    type="date"
                    className="h-10 text-xs"
                    onChange={(e) =>
                      updateFilter("available_from", e.target.value)
                    }
                  />
                </div>
                <div className="text-left">
                  <Label>Check-Out</Label>
                  <Input
                    type="date"
                    className="h-10 text-xs"
                    onChange={(e) =>
                      updateFilter("available_to", e.target.value)
                    }
                  />
                </div>
                <div className="text-left">
                  <Label>Price</Label>
                  <Select onValueChange={(v) => updateFilter("price_max", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Rental Price" />
                    </SelectTrigger>
                  </Select>
                </div>
                <Button
                  onClick={handleSearch}
                  className="bg-[#ff6b35] hover:bg-[#e85a20] h-11 w-full font-bold uppercase">
                  <Search className="w-4 h-4" /> Search
                </Button>
              </div>
            </TabsContent>

            {/* INVEST TAB CONTENT */}
            <TabsContent value="lease" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-5 text-left">
                  <Label>Type Location</Label>
                  <Input
                    placeholder="Enter address..."
                    className="h-10"
                    onChange={(e) => updateFilter("city", e.target.value)}
                  />
                </div>
                <div className="md:col-span-3 text-left">
                  <Label>Beds & Baths</Label>
                  <Select
                    onValueChange={(v) => updateFilter("apartment_type", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Beds" />
                    </SelectTrigger>
                  </Select>
                </div>
                <div className="md:col-span-2 text-left">
                  <Label>Price</Label>
                  <Select onValueChange={(v) => updateFilter("price_max", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Price" />
                    </SelectTrigger>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Button
                    onClick={handleSearch}
                    className="bg-[#ff6b35] hover:bg-[#e85a20] h-11 w-full font-bold uppercase">
                    <Search className="w-4 h-4" /> Search
                  </Button>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </section>
  );
}
