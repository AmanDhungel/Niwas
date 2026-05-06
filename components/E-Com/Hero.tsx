"use client";

import { useState } from "react";
import { Search, Calendar } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
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

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value.toString());
      else params.delete(key);
    });
    params.set("page", "1");
    router.push(`/search?${params.toString()}`);
  };

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden font-sans">
      {/* Background Overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')`,
        }}>
        <div className="absolute inset-0 bg-black/45" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 w-full max-w-6xl px-4 flex flex-col items-center text-center text-white">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight drop-shadow-xl">
          Find Your Perfect Place
          <br /> To Call Home
        </h1>
        <p className="text-base md:text-xl max-w-3xl mx-auto mb-12 text-gray-200 opacity-90 leading-relaxed">
          We go beyond expectations by delivering exceptional results through
          dedication, a seamless experience, and outstanding service.
        </p>

        {/* Unified Search Bar Container */}
        <div className="w-full">
          <Tabs
            value={filters.listing_type}
            onValueChange={(v) => updateFilter("listing_type", v)}
            className="w-full flex flex-col items-center">
            {/* Tabs Trigger - Floating Pill */}
            <TabsList className="flex bg-white/10 backdrop-blur-md p-1 rounded-t-2xl h-auto gap-1 border border-white/20 border-b-0">
              {[
                { value: "sale", label: "Sales" },
                { value: "rent", label: "Rentals" },
                { value: "lease", label: "Invest" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="px-8 py-3 text-xs md:text-sm font-bold uppercase tracking-widest rounded-xl transition-all
                             data-[state=active]:bg-[#E8540A] data-[state=active]:text-white 
                             data-[state=inactive]:text-white hover:bg-white/20">
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Main White Search Card (The Pill) */}
            <div className="w-full bg-white rounded-2xl md:rounded-full shadow-2xl p-4 md:pl-10 md:pr-4 md:py-3 text-black">
              {/* --- SALES CONTENT --- */}
              <TabsContent value="sale" className="mt-0 outline-none">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="w-full md:flex-[1.5] border-b md:border-b-0 md:border-r border-gray-100 py-2 md:py-0">
                    <FilterField label="Categories">
                      <Select
                        value={filters.category}
                        onValueChange={(v) => updateFilter("category", v)}>
                        <SelectTrigger className="border-none focus:ring-0 px-0 h-8 text-sm md:text-base shadow-none font-medium">
                          <SelectValue placeholder="Property Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="villa">Villa</SelectItem>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                        </SelectContent>
                      </Select>
                    </FilterField>
                  </div>
                  <div className="w-full md:flex-1 border-b md:border-b-0 md:border-r border-gray-100 py-2 md:py-0">
                    <FilterField label="City">
                      <Input
                        placeholder="Search City..."
                        className="border-none focus-visible:ring-0 px-0 h-8 text-sm md:text-base placeholder:text-gray-400 font-medium"
                        onChange={(e) => updateFilter("city", e.target.value)}
                      />
                    </FilterField>
                  </div>
                  <div className="w-full md:flex-1 border-b md:border-b-0 md:border-r border-gray-100 py-2 md:py-0">
                    <FilterField label="Beds & Baths">
                      <Select
                        value={filters.apartment_type}
                        onValueChange={(v) =>
                          updateFilter("apartment_type", v)
                        }>
                        <SelectTrigger className="border-none focus:ring-0 px-0 h-8 text-sm md:text-base shadow-none font-medium">
                          <SelectValue placeholder="Beds | Baths" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-bedroom">
                            1 Bed | 1 Bath
                          </SelectItem>
                          <SelectItem value="2-bedroom">
                            2 Bed | 2 Bath
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FilterField>
                  </div>
                  <div className="w-full md:flex-1 py-2 md:py-0">
                    <FilterField label="Price">
                      <Select
                        value={filters.price_max}
                        onValueChange={(v) => updateFilter("price_max", v)}>
                        <SelectTrigger className="border-none focus:ring-0 px-0 h-8 text-sm md:text-base shadow-none font-medium">
                          <SelectValue placeholder="Max Price" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10000000">Up to 1Cr</SelectItem>
                          <SelectItem value="50000000">Up to 5Cr</SelectItem>
                        </SelectContent>
                      </Select>
                    </FilterField>
                  </div>
                  <SearchButton onClick={handleSearch} />
                </div>
              </TabsContent>

              {/* --- RENTALS CONTENT --- */}
              <TabsContent value="rent" className="mt-0 outline-none">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="w-full md:flex-[1.2] border-b md:border-b-0 md:border-r border-gray-100 py-2 md:py-0">
                    <FilterField label="City Location">
                      <Input
                        placeholder="Where are you going?"
                        className="border-none focus-visible:ring-0 px-0 h-8 text-sm md:text-base placeholder:text-gray-400 font-medium"
                        onChange={(e) => updateFilter("city", e.target.value)}
                      />
                    </FilterField>
                  </div>
                  <div className="w-full md:flex-1 border-b md:border-b-0 md:border-r border-gray-100 py-2 md:py-0">
                    <FilterField label="Check-In">
                      <Input
                        type="date"
                        className="border-none focus-visible:ring-0 px-0 h-8 text-sm md:text-base font-medium cursor-pointer"
                        onChange={(e) =>
                          updateFilter("available_from", e.target.value)
                        }
                      />
                    </FilterField>
                  </div>
                  <div className="w-full md:flex-1 border-b md:border-b-0 md:border-r border-gray-100 py-2 md:py-0">
                    <FilterField label="Check-Out">
                      <Input
                        type="date"
                        className="border-none focus-visible:ring-0 px-0 h-8 text-sm md:text-base font-medium cursor-pointer"
                        onChange={(e) =>
                          updateFilter("available_to", e.target.value)
                        }
                      />
                    </FilterField>
                  </div>
                  <div className="w-full md:flex-1 py-2 md:py-0">
                    <FilterField label="Price">
                      <Select
                        value={filters.price_max}
                        onValueChange={(v) => updateFilter("price_max", v)}>
                        <SelectTrigger className="border-none focus:ring-0 px-0 h-8 text-sm md:text-base shadow-none font-medium">
                          <SelectValue placeholder="Monthly Budget" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="20000">Up to 20k</SelectItem>
                          <SelectItem value="50000">Up to 50k</SelectItem>
                        </SelectContent>
                      </Select>
                    </FilterField>
                  </div>
                  <SearchButton onClick={handleSearch} />
                </div>
              </TabsContent>

              {/* --- INVEST CONTENT --- */}
              <TabsContent value="lease" className="mt-0 outline-none">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="w-full md:flex-[2] border-b md:border-b-0 md:border-r border-gray-100 py-2 md:py-0">
                    <FilterField label="Type Location">
                      <Input
                        placeholder="Enter address or area..."
                        className="border-none focus-visible:ring-0 px-0 h-8 text-sm md:text-base placeholder:text-gray-400 font-medium"
                        onChange={(e) => updateFilter("city", e.target.value)}
                      />
                    </FilterField>
                  </div>
                  <div className="w-full md:flex-1 border-b md:border-b-0 md:border-r border-gray-100 py-2 md:py-0">
                    <FilterField label="Beds & Baths">
                      <Select
                        value={filters.apartment_type}
                        onValueChange={(v) =>
                          updateFilter("apartment_type", v)
                        }>
                        <SelectTrigger className="border-none focus:ring-0 px-0 h-8 text-sm md:text-base shadow-none font-medium">
                          <SelectValue placeholder="Beds | Baths" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-bedroom">
                            1 Bed | 1 Bath
                          </SelectItem>
                          <SelectItem value="2-bedroom">
                            2 Bed | 2 Bath
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FilterField>
                  </div>
                  <div className="w-full md:flex-1 py-2 md:py-0">
                    <FilterField label="Price">
                      <Select
                        value={filters.price_max}
                        onValueChange={(v) => updateFilter("price_max", v)}>
                        <SelectTrigger className="border-none focus:ring-0 px-0 h-8 text-sm md:text-base shadow-none font-medium">
                          <SelectValue placeholder="Investment Range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1000000">Up to 10L</SelectItem>
                          <SelectItem value="5000000">Up to 50L</SelectItem>
                        </SelectContent>
                      </Select>
                    </FilterField>
                  </div>
                  <SearchButton onClick={handleSearch} />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </section>
  );
}

// Reusable Components to keep UI consistent
function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col text-left px-2">
      <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SearchButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      className="w-full md:w-auto px-8 md:px-10 py-6 md:py-7 bg-[#E8540A] hover:bg-[#d14a09] text-white rounded-full font-bold uppercase text-sm md:text-base flex gap-2 items-center transition-all shadow-lg active:scale-95">
      <Search className="w-5 h-5" />
      Search
    </Button>
  );
}
