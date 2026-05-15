import { useFetcher } from "@/lib/generic.service";
import { ApiResponseType } from "./apitypes";
import { useMutation } from "@tanstack/react-query";
import { Post } from "@/lib/action";

export const useGetMaintenance = () => {
  return useFetcher<ApiResponseType<any[]>>(
    "maintenance",
    null,
    `/client_api/ecommerce_maintenance_service/user_requests`,
  );
};

export const useCreateMaintenance = () => {
  return useMutation<ApiResponseType<any>, any, FormData>({
    mutationKey: ["createLongTermOccupany"],
    mutationFn: (data: FormData) =>
      Post<FormData, ApiResponseType<any>>({
        url: "/client_api/ecommerce_maintenance_service/create",
        data: data,
      }),
  });
};
