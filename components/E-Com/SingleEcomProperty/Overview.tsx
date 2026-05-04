// components/property/Overview.tsx
import { Bed, Bath, Square, Share2, Heart, Printer, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Overview = ({ data }: { data: any }) => (
  <div className="space-y-12">
    <div className="flex justify-between items-center border-b pb-6">
      <span className="text-slate-500 font-medium">
        Property ID:{" "}
        <span className="text-orange-600">{data.basic_info.code}</span>
      </span>
      <div className="flex gap-3">
        {[Share2, Heart, Printer].map((Icon, i) => (
          <Button
            key={i}
            variant="outline"
            size="icon"
            className="rounded-full text-slate-400 hover:text-orange-600">
            <Icon size={18} />
          </Button>
        ))}
      </div>
    </div>

    <div className="flex gap-16">
      <div className="flex items-center gap-4">
        <div className="p-4 bg-orange-100 rounded-lg text-orange-600">
          <Bed size={32} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-semibold">Bedrooms</p>
          <p className="text-2xl font-bold">3</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="p-4 bg-orange-100 rounded-lg text-orange-600">
          <Bath size={32} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-semibold">Bathrooms</p>
          <p className="text-2xl font-bold">3</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="p-4 bg-orange-100 rounded-lg text-orange-600">
          <Square size={32} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-semibold">Area</p>
          <p className="text-2xl font-bold">
            {data.property_details.room_size} Sq Ft
          </p>
        </div>
      </div>
    </div>

    <section>
      <h3 className="text-2xl font-bold text-orange-600 mb-6 underline underline-offset-[12px] decoration-orange-600/30">
        Description
      </h3>
      <p className="text-slate-600 leading-relaxed text-lg">
        {data.basic_info.description}
      </p>
    </section>

    <section className="bg-slate-50 p-10 rounded-2xl">
      <h3 className="text-xl font-bold text-orange-600 mb-8">
        Additional Details
      </h3>
      <div className="grid grid-cols-2 gap-x-20 gap-y-4">
        {[
          ["Built In", "2003"],
          ["Flooring", "Ceramic Floor"],
          ["View", "Ocean View"],
          ["Parking", "2 Spaces"],
        ].map(([k, v]) => (
          <div
            key={k}
            className="flex justify-between border-b border-slate-200 pb-2">
            <span className="font-bold text-slate-800">{k}:</span>
            <span className="text-slate-500">{v}</span>
          </div>
        ))}
      </div>
    </section>
  </div>
);
