"use client";
import { useGetSingleEcom } from "@/services/e-com.service";
import { useParams } from "next/navigation";
import React from "react";

import { Hero } from "./PropertHero";
import { Overview } from "./Overview";
import { MediaSections } from "./MediaSections";
import { MortgageCalculator } from "./MortgageCalculator";
import { ContactSidebar } from "./ContactSidebar";
import { Check } from "lucide-react";
import dynamic from "next/dynamic";
const PropertyMap = dynamic(() => import("./PropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center rounded-3xl">
      <p className="text-slate-400 font-medium">Loading Map Interface...</p>
    </div>
  ),
});

const SingleEcomProperty = () => {
  const params = useParams();
  const { data: response, isLoading } = useGetSingleEcom(params.id as string);

  if (isLoading || !response)
    return (
      <div className="p-20 text-center font-bold">
        Loading Property Details...
      </div>
    );

  const propertyData = response?.data;

  return (
    <div className="min-h-screen bg-white">
      <Hero data={propertyData} />

      <main className="container mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-20">
          <Overview data={propertyData} />

          <section className="bg-slate-50/50 p-10 rounded-3xl">
            <h3 className="text-xl font-bold text-orange-600 mb-8">Features</h3>
            <div className="grid grid-cols-3 gap-y-6">
              {propertyData.amenities.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-4">
                  {propertyData.amenities.map((item: any) => (
                    <div
                      key={item._id}
                      className="flex items-center gap-3 font-medium text-slate-700 hover:text-black transition-colors">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center text-[#ff6b35]">
                        <Check size={14} strokeWidth={4} />
                      </div>
                      <span className="capitalize ">
                        {item.name || "Standard Amenity"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 italic py-4">
                  No specific amenities listed for this property.
                </div>
              )}
            </div>
          </section>

          <MediaSections data={propertyData} />

          <section className="mt-12">
            <h3 className="text-2xl font-bold text-[#ff6b35] mb-6">
              Property on Map
            </h3>

            <div className="w-full h-[350px] md:h-[500px] lg:h-[600px] rounded-3xl overflow-hidden shadow-lg border-4 border-white relative z-0">
              <PropertyMap data={propertyData} />
            </div>
          </section>

          <MortgageCalculator />
        </div>

        <aside className="space-y-10">
          <ContactSidebar />
        </aside>
      </main>
    </div>
  );
};

export default SingleEcomProperty;
