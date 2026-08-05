import { ApiResponseLogin, ApiResponseType } from "./apitypes";
import { useMutator } from "@/lib/generic.service";

export const useLogin = () => {
  return useMutator<ApiResponseLogin<any>, any>(
    "/client_api/ecommerce_user/signin",
  );
};

export const useSignup = () => {
  return useMutator<ApiResponseLogin<any>, any>(
    "/client_api/ecommerce_user/signup",
  );
};

export const useVerifyToken = () => {
  return useMutator<ApiResponseLogin<any>, any>(
    "/client_api/auth/verify_token",
  );
};

export interface ForgotPasswordPayload {
  user_email: string;
}

export const useForgotPassword = () => {
  return useMutator<ApiResponseType<null>, ForgotPasswordPayload>(
    "/client_api/ecommerce_user/password/forgot_password",
  );
};

export interface ResetPasswordPayload {
  user_email: string;
  token: string;
  new_password: string;
  confirm_password: string;
}

export const useResetPassword = () => {
  return useMutator<ApiResponseType<null>, ResetPasswordPayload>(
    "/client_api/ecommerce_user/password/reset_password",
  );
};
