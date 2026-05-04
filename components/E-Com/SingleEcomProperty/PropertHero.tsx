// components/property/Hero.tsx
import { MapPin, ChevronRight } from "lucide-react";
import Image from "next/image";

export const Hero = ({ data }: { data: any }) => (
  <section className="relative h-[700px] w-full text-white overflow-hidden">
    <Image
      width={1000}
      height={1000}
      src={data.media_and_files.property_photos[0]?.url}
      className="absolute inset-0 w-full h-full object-cover"
      alt="Hero"
      onError={(e: any) => {
        e.target.src = "/no-image.png";
      }}
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

    <div className="container relative mx-auto h-full flex flex-col justify-end pb-12 px-6">
      <div className="flex justify-between items-end">
        <div className="space-y-4">
          <nav className="flex items-center gap-2 text-sm opacity-80 font-medium">
            Home <ChevronRight size={14} /> {data.location.city}
          </nav>
          <h1 className="text-5xl font-bold">{data.basic_info.name}</h1>
          <p className="flex items-center gap-2 text-lg opacity-90">
            <MapPin size={20} className="text-orange-500" />{" "}
            {data.location.address_line_1}, {data.location.city},{" "}
            {data.location.state}
          </p>
        </div>
        <div className="text-right">
          <span className="text-sm font-semibold uppercase tracking-widest">
            For Sale
          </span>
          <div className="text-6xl font-bold mt-1 text-white">$825,000.00</div>
        </div>
      </div>

      <div className="flex gap-3 mt-10 overflow-x-auto no-scrollbar">
        {data.media_and_files.property_photos.map((photo: any) => (
          <Image
            width={1000}
            height={1000}
            alt="floor plan"
            key={photo._id}
            src={photo.url || "/no-image.png"}
            className="h-24 w-40 object-cover rounded-md border-2 border-white/20 hover:border-white transition-all cursor-pointer"
            onError={(e: any) => {
              e.target.src = "/no-image.png";
            }}
          />
        ))}
      </div>
    </div>
  </section>
);
