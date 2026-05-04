// components/property/PropertySpecs.tsx
import { Bed, Bath, Square, Share2, Heart, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PropertySpecs = ({ data }: { data: any }) => {
  const details = data.property_details;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b pb-6">
        <span className="text-slate-500 text-lg">
          Property ID :{" "}
          <span className="text-orange-600 font-semibold">
            {data.basic_info.code}
          </span>
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="rounded-full">
            <Share2 size={18} />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full">
            <Heart size={18} />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full">
            <Printer size={18} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8 py-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-orange-50 rounded-lg text-orange-600">
            <Bed size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Bedrooms</p>
            <p className="text-xl font-bold">3</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="p-4 bg-orange-50 rounded-lg text-orange-600">
            <Bath size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Bathrooms</p>
            <p className="text-xl font-bold">3</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="p-4 bg-orange-50 rounded-lg text-orange-600">
            <Square size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Area</p>
            <p className="text-xl font-bold">{details.room_size} Sq Ft</p>
          </div>
        </div>
      </div>

      <section>
        <h3 className="text-2xl font-bold text-orange-600 mb-4">Description</h3>
        <p className="text-slate-600 leading-relaxed text-lg">
          {data.basic_info.description}
        </p>
      </section>
    </div>
  );
};
