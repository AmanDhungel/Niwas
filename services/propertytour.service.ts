import { useFetcher } from "@/lib/generic.service";
import { ApiResponseType } from "./apitypes";
import { useMutation } from "@tanstack/react-query";
import { Post } from "@/lib/action";

export const useGetPropertyTour = () => {
  return useFetcher<ApiResponseType<any[]>>(
    "property",
    null,
    `/client_api/property`,
  );
};

export const useCreatePropertyTour = () => {
  return useMutation<ApiResponseType<any>, any, FormData>({
    mutationKey: ["createLongTermOccupany"],
    mutationFn: (data: FormData) =>
      Post<FormData, ApiResponseType<any>>({
        url: "/client_api/ecommerce_user/profile/update",
        data: data,
      }),
  });
};
