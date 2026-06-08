import { useMutation } from "@tanstack/react-query";
import { api } from "./api";

interface RequestOTPResponse {
  message: string;
}

interface VerifyOTPResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    name: string;
    phone: string;
    role: string;
    clinic_id: string;
  };
}

export function useRequestOTP() {
  return useMutation({
    mutationFn: (phone: string) =>
      api.post<RequestOTPResponse>("/api/auth/request-otp", { phone }),
  });
}

export function useVerifyOTP() {
  return useMutation({
    mutationFn: ({ phone, otp }: { phone: string; otp: string }) =>
      api.post<VerifyOTPResponse>("/api/auth/verify-otp", { phone, otp }),
  });
}
