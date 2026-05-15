import { useMutation } from "@tanstack/react-query";
import { ApiResponseType } from "./apitypes";
import { Post } from "@/lib/action";
import { useFetcher } from "@/lib/generic.service";

export const useUpdateProfile = () => {
  return useMutation<ApiResponseType<any>, any, FormData>({
    mutationKey: ["createLongTermOccupany"],
    mutationFn: (data: FormData) =>
      Post<FormData, ApiResponseType<any>>({
        url: "/client_api/ecommerce_user/profile/update",
        data: data,
      }),
  });
};

export const useGetProfile = () => {
  return useFetcher<ApiResponseType<any>>(
    "profile",
    null,
    `/client_api/ecommerce_user/profile`,
  );
};
