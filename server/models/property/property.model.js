import mongoose from "mongoose";

const property_schema = new mongoose.Schema(
  {
    is_draft: {
      type: Boolean,
      default: false,
    },
    basic_info: {
      name: {
        type: String,
      },
      status: {
        type: String,
        enum: ["active", "occupied", "inactive"],
      },
      code: {
        type: String,
      },
      description: {
        type: String,
      },
      type: {
        type: String,
        enum: ["residential", "commercial"],
      },
    },
    location: {
      location: {
        latitude: {
          type: Number,
        },
        longitude: {
          type: Number,
        },
      },
      address_line_1: {
        type: String,
      },
      address_line_2: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      postal_code: {
        type: String,
      },
      country: {
        type: String,
      },
    },
    property_details: {
      room_size: { type: Number },
      bed_type: { type: String },
      attached_bathroom: { type: Boolean, default: false },
      air_conditioning: { type: Boolean, default: false },
      furnished: { type: Boolean, default: false },
      floor_number: { type: Number },
      custom_building_attributes: [
        {
          title: { type: String },
          content_type: { type: String },
          value: { type: String },
        },
      ],
    },
    media_and_files: {
      property_photos: [{ key: { type: String }, url: { type: String } }],
      property_videos: [{ key: { type: String }, url: { type: String } }],
      floor_plans_and_layouts: [{ key: { type: String }, url: { type: String } }],
      legal_documents: [{ key: { type: String }, url: { type: String } }],
      insurance_papers: [{ key: { type: String }, url: { type: String } }],
      media_organization: {
        add_watermark: { type: Boolean, default: false },
        auto_resize_images: { type: Boolean, default: false },
        public_gallery: { type: Boolean, default: false },
        tenant_access: { type: Boolean, default: false },
      },
    },
    amenities: [
      {
        amenity: { type: String },
        available_areas: [
          {
            building: { type: String },
            floor: { type: String },
            apartment: { type: String },
          },
        ],
      },
    ],
    publishing: {
      publishing_status: {
        type: String,
        enum: ["draft", "published", "archived"],
        default: "draft",
      },
      publishing_channels: {
        rentchain_platform: { type: Boolean, default: true },
        partner_portals: { type: Boolean, default: false },
        internal_only: { type: Boolean, default: false },
      },
      available_from: { type: Date },
      available_to: { type: Date },
      publishing_features: {
        instant_booking: { type: Boolean, default: false },
        virtual_tours: { type: Boolean, default: false },
        contact_info_visible: { type: Boolean, default: false },
        auto_renewal: { type: Boolean, default: false },
      },
      property_tags: [{ type: String }],
      booking_limit_from: { type: Number },
      booking_limit_to: { type: Number },
      advance_booking_limit_from: { type: Number },
      advance_booking_limit_to: { type: Number },
      current_status: {
        type: String,
        enum: ["available", "booked", "pending", "unavailable"],
      },
      blackout_dates_from: { type: Date },
      blackout_dates_to: { type: Date },
      pricing_configuration: {
        sale: {
          amount: { type: Number },
          duration_terms: { type: String },
          currency: { type: String },
          active: { type: Boolean, default: false },
        },
        rent: {
          amount: { type: Number },
          duration_terms: { type: String },
          currency: { type: String },
          active: { type: Boolean, default: false },
        },
        lease: {
          amount: { type: Number },
          duration_terms: { type: String },
          currency: { type: String },
          active: { type: Boolean, default: false },
        },
      },
    },
    property_ownership: {
      entity_type: { type: String, enum: ["individual", "company"] },
      ownership_percentage: { type: Number },
      first_name: { type: String },
      last_name: { type: String },
      email: { type: String },
      phone: { type: String },
      tax_id_ssn: { type: String },
      address: {
        street: { type: String },
        city: { type: String },
        zip_code: { type: String },
      },
      management_rights: {
        can_lease: { type: Boolean },
        can_sell: { type: Boolean },
        can_modify_property: { type: Boolean },
        can_manage_tenants: { type: Boolean },
        set_as_primary_owner: { type: Boolean },
      },
      property_manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    },
    financial: {
      acquisition_date: { type: Date },
      property_valuation: { type: Number },
      monthly_target_revenue: { type: Number },
    },
    legal_and_insurance: {
      insurance_policy_number: { type: String },
      insurance_expiry_date: { type: Date },
      permit_license_number: { type: String },
      permit_expiry_date: { type: Date },
      tax_zone_code: { type: String },
    },
    unit_structure: [
      {
        floor: {
          name: { type: String },
          number: { type: Number },
          description: { type: String },
          furniture_images: [{ key: { type: String }, url: { type: String } }],
          floor_images: [{ key: { type: String }, url: { type: String } }],
        },
        common_areas: [
          {
            area_name: { type: String },
            area_type: {
              type: String,
              enum: ["lobby", "hallway", "gym", "laundry", "other"],
            },
            area_size: { type: Number },
            capacity: { type: Number },
            chargeable: { type: Boolean, default: false },
            usage_fee_per_unit: { type: Number },
          },
        ],
        apartments: [
          {
            name: { type: String },
            type: {
              type: String,
              enum: ["studio", "1-bedroom", "2-bedroom", "3-bedroom"],
            },
            area: { type: Number },
            capacity: { type: Number },
            occupancy_status: {
              type: String,
              enum: ["vacant", "occupied", "reserved"],
            },
            furnished_status: { type: Boolean, default: false },
            rent_pricing: { type: Boolean, default: false },
            baseline_rent: { type: Number },
            minimum_rent: { type: Number },
            maximum_rent: { type: Number },
            rooms: [
              {
                name: { type: String },
                type: {
                  type: String,
                  enum: ["bedroom", "living room", "kitchen", "bathroom"],
                },
                area: { type: Number },
                sharing_type: { type: String, enum: ["private", "shared"] },
                rent_pricing: { type: Boolean, default: false },
                baseline_rent: { type: Number },
                minimum_rent: { type: Number },
                maximum_rent: { type: Number },
                bedspaces: [
                  {
                    number_of_beds: { type: Number },
                    default_bed_type: {
                      type: String,
                      enum: ["single", "double", "queen", "king"],
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    parking_management: {
      enabled: { type: Boolean, default: false },
      spaces: [
        {
          space_id: { type: String },
          space_type: { type: String, enum: ["covered", "uncovered", "garage"] },
          vehicle_type: { type: String, enum: ["car", "motorcycle", "bicycle"] },
          billing_frequency: { type: String, enum: ["hourly", "daily", "monthly"] },
          amount: { type: Number },
          currency: { type: String },
          assignment_type: { type: String },
          assigned_to: { type: mongoose.Schema.Types.Mixed },
          access_method: { type: String },
          location_description: { type: String },
        },
      ],
    },
    utilities_assignment: [
      {
        meter_type: { type: String, enum: ["existing", "new", "manual", "smart"] },
        utility_type: {
          type: String,
          enum: ["electricity", "water", "gas", "internet"],
        },
        provider_name: { type: String },
        meter_serial: { type: String },
        billing_responsibility: {
          type: String,
          enum: ["landlord", "tenant", "shared"],
        },
        billing_split_configuration: {
          tenant_percentage: { type: Number },
          owner_percentage: { type: Number },
        },
        assigned_to: { type: mongoose.Schema.Types.Mixed },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const property_model = mongoose.model("property", property_schema);

export default property_model;