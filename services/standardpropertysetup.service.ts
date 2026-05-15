import { useMutation } from "@tanstack/react-query";
import { ApiResponseType } from "./apitypes";
import { Post } from "@/lib/action";
import { useFetcher } from "@/lib/generic.service";

export interface PropertyGetData {
  _id: string;
  basic_info: {
    name: string;
    status: "active" | "inactive" | "pending";
    code: string;
    description: string;
    type: "residential" | "commercial" | "industrial";
  };
  location: {
    location: {
      latitude: number;
      longitude: number;
    };
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  property_details: {
    room_size: number;
    bed_type: string;
    attached_bathroom: boolean;
    air_conditioning: boolean;
    furnished: boolean;
    floor_number: number;
    custom_building_attributes: any[];
  };
  property_ownership: any;
  media_and_files: {
    media_organization: {
      add_watermark: boolean;
      auto_resize_images: boolean;
      public_gallery: boolean;
      tenant_access: boolean;
    };
    property_photos: {
      key: string;
      url: string;
      type: string;
    }[];
    property_videos: {
      key: string;
      url: string;
      type: string;
    }[];
    floor_plans_and_layouts: {
      key: string;
      url: string;
      type: string;
    }[];
    legal_documents: {
      key: string;
      url: string;
      type: string;
    }[];
    insurance_papers: {
      key: string;
      url: string;
      type: string;
    }[];
  };
  publishing: {
    publishing_channels: {
      rentchain_platform: boolean;
      partner_portals: boolean;
      internal_only: boolean;
    };
    publishing_features: {
      instant_booking: boolean;
      virtual_tours: boolean;
      contact_info_visible: boolean;
      auto_renewal: boolean;
    };
    pricing_configuration: {
      sale: { active: boolean };
      rent: { active: boolean };
      lease: { active: boolean };
    };
    property_tags: string[];
    publishing_status: "published" | "draft" | "archived";
    available_from: string;
    available_to: string;
  };
  parking_management: {
    enabled: boolean;
    spaces: any[];
  };
  amenities: Array<{
    _id: string;
    available_areas: any[];
    [key: number]: string;
  }>;
  unit_structure: Array<{
    floor: {
      name: string;
      number: number;
      furniture_images: string[];
      floor_images: string[];
    };
    common_areas: Array<{
      _id: string;
      area_name: string;
      area_type: string;
      area_size: number;
      capacity: number;
      chargeable: boolean;
      usage_fee_per_unit: number;
    }>;
    apartments: {
      _id: string;
      name: string;
      type: string;
      area: number;
      capacity: number;
      occupancy_status: string;
      furnished_status: boolean;
      rent_pricing: boolean;
      baseline_rent: number;
      minimum_rent: number;
      maximum_rent: number;
      rooms: Array<{
        _id: string;
        name: string;
        type: string;
        area: number;
        sharing_type: string;
        rent_pricing: boolean;
        baseline_rent: number;
        minimum_rent: number;
        maximum_rent: number;
        bedspaces: Array<{
          _id: string;
          number_of_beds: number;
          default_bed_type: string;
        }>;
      }>;
    }[];
    _id: string;
  }>;
  financial: any;
  utilities_assignment: Array<{
    _id: string;
    meter_type: string;
    utility_type: string;
    provider_name: string;
    meter_serial: string;
    billing_responsibility: string;
    assigned_to: string | null;
    billing_split_configuration: {
      tenant_percentage: number;
      owner_percentage: number;
    };
  }>;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export const useGetProperties = () => {
  return useFetcher<ApiResponseType<PropertyGetData[]>>(
    "property",
    null,
    `/client_api/property`,
  );
};

export const useDeleteProperty = () => {
  return useMutation<ApiResponseType<{ id: string }>, any, { id: string }>({
    mutationKey: ["deleteTaxes"],
    mutationFn: (data: { id: string }) =>
      Post<{ id: string }, ApiResponseType<{ id: string }>>({
        url: `/client_api/property/delete/${data.id}`,
        data: { id: data.id },
      }),
  });
};
