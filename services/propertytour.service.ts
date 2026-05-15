import { useFetcher } from "@/lib/generic.service";
import { ApiResponseType } from "./apitypes";
import { useMutation } from "@tanstack/react-query";
import { Post } from "@/lib/action";

export const useGetPropertyTour = () => {
  return useFetcher<ApiResponseType<any[]>>(
    "property-tour",
    null,
    `/client_api/ecommerce_property_tour/user_requests`,
  );
};

export const useCreatePropertyTour = () => {
  return useMutation<ApiResponseType<any>, any, any>({
    mutationKey: ["createLongTermOccupany"],
    mutationFn: (data: any) =>
      Post<any, ApiResponseType<any>>({
        url: "/client_api/ecommerce_property_tour/create",
        data: data,
      }),
  });
};

export const useCancelPropertyTour = () => {
  return useMutation<ApiResponseType<any>, any, any>({
    mutationKey: ["createLongTermOccupany"],
    mutationFn: (data: any) =>
      Post<any, ApiResponseType<any>>({
        url: `/client_api/ecommerce_property_tour/cancel/${data._id}`,
        data: data,
      }),
  });
};
