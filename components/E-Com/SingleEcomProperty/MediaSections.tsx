// components/property/MediaSections.tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Play } from "lucide-react";
import PropertyVideo from "./PropertyVideo";
import Image from "next/image";

export const MediaSections = ({ data }: { data: any }) => (
  <div className="space-y-16">
    <section>
      <h3 className="text-2xl font-bold text-orange-600 mb-6">Floor Plans</h3>
      <Accordion
        type="single"
        collapsible
        className="w-full bg-slate-50 border rounded-xl overflow-hidden">
        <AccordionItem value="ground" className="border-none">
          <AccordionTrigger className="px-8 py-6 hover:no-underline">
            <div className="flex justify-between w-full text-slate-700 font-bold pr-8">
              <span>Ground Floor</span>
              <span className="text-sm font-normal text-slate-400">
                4800 sq ft | 3 Bedrooms |{" "}
                <span className="text-green-600 font-bold">$6,570.00</span>
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-8 bg-white">
            <p className="text-slate-500 mb-6">
              Detailed floor plan description as seen in design.
            </p>
            <Image
              width={1000}
              height={1000}
              src={data.media_and_files.floor_plans_and_layouts[0]?.url}
              className="w-full rounded-lg"
              alt="Floorplan"
              onError={(e: any) => {
                e.target.src = "/no-image.png";
              }}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>

    <section>
      <PropertyVideo data={data} />
    </section>
  </div>
);
