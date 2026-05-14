import { ApiResponseLogin } from "./apitypes";
import { useMutator } from "@/lib/generic.service";

export const useLogin = () => {
  return useMutator<ApiResponseLogin<any>, any>("/client_api/auth/signin");
};

export const useSignup = () => {
  return useMutator<ApiResponseLogin<any>, any>("/client_api/auth/signup");
};

export const useVerifyToken = () => {
  return useMutator<ApiResponseLogin<any>, any>(
    "/client_api/auth/verify_token",
  );
};
