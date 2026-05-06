"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Star,
  Users,
  Bed,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { useGetECom } from "@/services/e-com.service";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function FeaturedProperties() {
  const { data, isLoading } = useGetECom();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = data?.data.pagination?.page || 1;
  const totalPages = data?.data.pagination?.total_pages || 1;

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  if (isLoading)
    return <div className="py-10 text-center">Loading properties...</div>;

  const properties = data?.data.properties || [];

  return (
    <section className="py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {properties.map((prop: any) => {
          const mainImage =
            prop.media_and_files?.property_photos?.[0]?.url || "/no-image.png";

          // const pricing = prop.publishing?.pricing_configuration;
          // const price = pricing?.sale?.active
          //   ? pricing.sale.amount
          //   : pricing?.rent?.active
          //     ? pricing.rent.amount
          //     : pricing?.lease?.active
          //       ? pricing.lease.amount
          //       : 0;

          // const priceLabel = pricing?.sale?.active ? "" : "/night";

          return (
            <Card
              key={prop._id}
              className=" shadow-none!  group cursor-pointer border-none! ring-0 p-0"
              onClick={() => router.push(`/e-com/single-property/${prop._id}`)}>
              <div className="relative aspect-[4/3] overflow-hidden  rounded-xl bg-gray-100">
                <Image
                  width={600}
                  height={450}
                  src={mainImage}
                  alt={prop.basic_info?.name}
                  className="object-cover w-full h-full transition-transform group-hover:scale-110"
                  onError={(e: any) => {
                    e.target.src = "/no-image.png";
                  }}
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  {prop.basic_info?.status === "active" && (
                    <Badge className="bg-[#ff6b35] text-[10px] uppercase">
                      Active
                    </Badge>
                  )}
                  {prop.publishing?.publishing_features?.instant_booking && (
                    <Badge className="bg-blue-500 text-[10px] uppercase">
                      Instant
                    </Badge>
                  )}
                </div>
                <button className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-red-500 transition-colors">
                  <Heart className="w-4 h-4" />
                </button>
              </div>

              <CardContent className="px-0 py-4 border-none! outline-none!">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-lg truncate w-full pr-2">
                    {prop.basic_info?.name}
                  </h3>
                  <div className="flex items-center gap-1 text-sm shrink-0">
                    <Star className="w-4 h-4 fill-black" /> 5.0
                  </div>
                </div>

                <p className="text-gray-500 text-sm mb-2 capitalize">
                  {prop.basic_info?.type} • {prop.location?.city}
                </p>

                <div className="flex gap-3 text-gray-500 text-xs mb-3">
                  <span className="flex items-center gap-1">
                    <Bed className="w-3 h-3" />{" "}
                    {prop.property_details?.bed_type || "Standard"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />{" "}
                    {prop.property_details?.room_size} sqft
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-12">
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="icon"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </section>
  );
}
