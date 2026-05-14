import { useMutation } from "@tanstack/react-query";
import { Post } from "@/lib/action";
import { useFetcher } from "@/lib/generic.service";
import { ApiResponseType } from "./apitypes";

export interface ShortTermOccupancyGetValue {
  _id: string;
  guest_info: GuestInfo;
  identification: Identification;
  stay_details: StayDetails;
  special_requirements: SpecialRequirements;
  emergency_contact: EmergencyContact;
  visit_info: VisitInfo;
  social_media: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    whatsapp?: string;
    linkedin?: string;
  };
  agreement: Agreement;
  unit: any;
  additional_guests: any[];
  tenant: Tenant;
  property: any;
  request_status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface GuestInfo {
  profile_image: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  nationality: string;
  place_of_birth: string;
  phone_number: string;
  email: string;
  relationship_to_tenant: string;
}

interface Identification {
  id_type: "passport" | "national_id" | "license";
  id_number: string;
  id_document: string;
}

interface StayDetails {
  check_in_date: string;
  check_out_date: string;
  purpose_category: string;
  detailed_purpose: string;
  urgency_level: "low" | "medium" | "high";
}

interface SpecialRequirements {
  parking_space_required: boolean;
  extra_bedding_needed: boolean;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone_number: string;
  address: string;
}

interface VisitInfo {
  has_stayed_before: boolean;
  willing_to_pay_security_deposit: boolean;
  additional_notes: string;
}

interface Agreement {
  policy_acknowledged: boolean;
  acknowledged_at: string;
}

interface Tenant {
  _id: string;
  basic_info: {
    profile_image: string;
    first_name: string;
    last_name: string;
    type: "individual" | "organization";
    company_name?: string;
    email: string;
    phone_number: string;
    date_of_birth: string;
    about: string;
    tags: string[];
    source: string;
    ratings: number;
    industry: string;
    currency: string;
    language: string;
  };
  contact_info: {
    emergency_contact_name: string;
    relationship: string;
    emergency_contact_phone: string;
  };
  address: {
    address: string;
    country: string;
    state: string;
    city: string;
    zipcode: string;
  };
  employment: {
    employer: string;
    job_title: string;
    income_range: string;
  };
  preferences: {
    tenant_status: string;
    pref_language: string;
    payment_method: string;
    auto_pay_enabled: boolean;
    sublease_enabled: boolean;
  };
  status: string;
}

export const useCreateShortTermOccupany = () => {
  return useMutation<ApiResponseType<any>, any, FormData>({
    mutationKey: ["createShortTermOccupany"],
    mutationFn: (data: FormData) =>
      Post<FormData, ApiResponseType<any>>({
        url: data.get("_id")
          ? `/client_api/occupancy/short_term_stay/edit/${data.get("_id")}`
          : "/client_api/occupancy/short_term_stay/add",
        data: data,
      }),
  });
};
export const useCreateLongTermOccupany = () => {
  return useMutation<ApiResponseType<any>, any, FormData>({
    mutationKey: ["createLongTermOccupany"],
    mutationFn: (data: FormData) =>
      Post<FormData, ApiResponseType<any>>({
        url: data.get("_id")
          ? `/client_api/occupancy/long_term_occupant/edit/${data.get("_id")}`
          : "/client_api/occupancy/long_term_occupant/add",
        data: data,
      }),
  });
};

export const useGetShortTermOccupany = () => {
  return useFetcher<ApiResponseType<ShortTermOccupancyGetValue[]>>(
    "short-term-occupancy",
    null,
    "/client_api/occupancy/short_term_stay",
  );
};
export const useGetLongTermOccupany = () => {
  return useFetcher<ApiResponseType<any[]>>(
    "long-term-occupancy",
    null,
    "/client_api/occupancy/long_term_occupant",
  );
};

export const useGetSingleLongTermOccupany = ({ id }: { id: string }) => {
  return useFetcher<ApiResponseType<any>>(
    "single-long-term-occupancy",
    null,
    `/client_api/occupancy/long_term_occupant/${id}`,
  );
};

export const useGetSingleShortTermOccupany = ({ id }: { id: string }) => {
  return useFetcher<ApiResponseType<ShortTermOccupancyGetValue>>(
    "single-short-term-occupancy",
    null,
    `/client_api/occupancy/short_term_stay/${id}`,
  );
};

export const useHandleLongTermOccupanyStatus = () => {
  return useMutation<
    ApiResponseType<{ request_status: string; _id: string }>,
    any,
    { request_status: string; _id: string }
  >({
    mutationFn: (data: { request_status: string; _id: string }) =>
      Post<
        { request_status: string; _id: string },
        ApiResponseType<{ request_status: string; _id: string }>
      >({
        url: `/client_api/occupancy/long_term_occupant/update_status/${data._id}`,
        data: data,
      }),
  });
};
export const useHandleShortTermOccupanyStatus = () => {
  return useMutation<
    ApiResponseType<{ request_status: string; _id: string }>,
    any,
    { request_status: string; _id: string }
  >({
    mutationFn: (data: { request_status: string; _id: string }) =>
      Post<
        { request_status: string; _id: string },
        ApiResponseType<{ request_status: string; _id: string }>
      >({
        url: `/client_api/occupancy/short_term_stay/update_status/${data._id}`,
        data: data,
      }),
  });
};

export const useDeleteShortTermOccupany = () => {
  return useMutation<ApiResponseType<{ id: string }>, any, { id: string }>({
    mutationKey: ["deleteShorttermOcc"],
    mutationFn: (data: { id: string }) =>
      Post<{ id: string }, ApiResponseType<{ id: string }>>({
        url: `/client_api/occupancy/short_term_stay/delete/${data.id}`,
        data: { id: data.id },
      }),
  });
};
export const useDeleteLongTermOccupany = () => {
  return useMutation<ApiResponseType<{ id: string }>, any, { id: string }>({
    mutationKey: ["deleteLongtermOcc"],
    mutationFn: (data: { id: string }) =>
      Post<{ id: string }, ApiResponseType<{ id: string }>>({
        url: `/client_api/occupancy/long_term_occupant/delete/${data.id}`,
        data: { id: data.id },
      }),
  });
};
