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

export const useUpdatePassword = () => {
  return useMutation<ApiResponseType<any>, any, any>({
    mutationKey: ["updatePassword"],
    mutationFn: (data: any) =>
      Post<any, ApiResponseType<any>>({
        url: "/client_api/ecommerce_user/password/change_password",
        data: data,
      }),
  });
};

export const useCreatePayment = () => {
  return useMutation<ApiResponseType<any>, any, any>({
    mutationKey: ["createPaymnet"],
    mutationFn: (data: any) =>
      Post<any, ApiResponseType<any>>({
        url: data._id
          ? `/client_api/ecommerce_user/profile/edit/${data._id}`
          : "/client_api/ecommerce_user/payment/add",
        data: data,
      }),
  });
};

export const useUpdatePaymentPreferences = () => {
  return useMutation<ApiResponseType<any>, any, any>({
    mutationKey: ["updatePaymentPreferences"],
    mutationFn: (data: any) =>
      Post<any, ApiResponseType<any>>({
        url: "/client_api/ecommerce_user/payment/preferences/update",
        data: data,
      }),
  });
};

export const useUpdateNotification = () => {
  return useMutation<ApiResponseType<any>, any, any>({
    mutationKey: ["updateNotification"],
    mutationFn: (data: any) =>
      Post<any, ApiResponseType<any>>({
        url: "/client_api/ecommerce_user/notifications/update",
        data: data,
      }),
  });
};

export const useUpdatePreferences = () => {
  return useMutation<ApiResponseType<any>, any, any>({
    mutationKey: ["updatePreferences"],
    mutationFn: (data: any) =>
      Post<any, ApiResponseType<any>>({
        url: "/client_api/ecommerce_user/preferences/update",
        data: data,
      }),
  });
};
