import { useFetcher } from "@/lib/generic.service";
import { ApiResponseType } from "./apitypes";
import { useSearchParams } from "next/navigation";

export const useGetECom = () => {
  const searchParams = useSearchParams();

  const queryKey = ["ecom", searchParams.toString()];

  const params = new URLSearchParams();

  const validKeys = [
    "listing_type",
    "property_type",
    "category",
    "city",
    "state",
    "country",
    "price_min",
    "price_max",
    "currency",
    "bed_type",
    "room_size_min",
    "room_size_max",
    "furnished",
    "air_conditioning",
    "attached_bathroom",
    "available_from",
    "available_to",
    "current_status",
    "instant_booking",
    "virtual_tours",
    "tags",
    "apartment_type",
    "sort_by",
    "page",
    "limit",
  ];

  validKeys.forEach((key) => {
    const value = searchParams.get(key);
    if (value) {
      params.append(key, value);
    }
  });

  if (!params.has("page")) params.append("page", "1");
  if (!params.has("limit")) params.append("limit", "12");

  return useFetcher<ApiResponseType<{ properties: any[]; pagination: any }>>(
    queryKey,
    null,
    `/client_api/ecommerce_property?${params.toString()}`,
  );
};

export const useGetSingleEcom = (id: string) =>
  useFetcher<ApiResponseType<any>>(
    ["ecom", id],
    null,
    `/client_api/ecommerce_property/${id}`,
  );
