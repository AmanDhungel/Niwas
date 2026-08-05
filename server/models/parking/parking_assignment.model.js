import mongoose from "mongoose";

const parking_assignment_schema = new mongoose.Schema(
  {
    assignment_type: {
      type: String,
      required: true,
      enum: [
        "property_wide_allocation",
        "unit_specific_assignment",
        "direct_tenant_assignment",
        "visitor_parking_pool",
      ],
    },
    targets: {
      properties: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "property",
        },
      ],
      units: [
        {
          type: mongoose.Schema.Types.ObjectId,
        },
      ],
      tenants: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "tenant",
        },
      ],
    },
    spaces: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    configuration: {
      duration_type: {
        type: String,
        enum: ["permanent", "temporary", "flexible"],
        required: true,
      },
      duration_start_date: {
        type: Date,
      },
      duration_end_date: {
        type: Date,
      },
      override_default_pricing: {
        type: Boolean,
        default: false,
      },
      custom_rate: {
        type: Number,
      },
      billing_frequency: {
        type: String,
        enum: ["monthly", "quarterly", "annually"],
      },
      include_visitor_parking_rights: {
        type: Boolean,
        default: false,
      },
      number_of_visitor_spots: {
        type: Number,
      },
      access_hours: {
        type: String,
        enum: ["24_7", "business_hours", "custom"],
        required: true,
      },
      access_start: {
        type: String,
      },
      access_end: {
        type: String,
      },
      priority_level: {
        type: String,
        enum: ["high", "medium", "low"],
        required: true,
      },
      additional_notes: {
        type: String,
      },
      auto_renewal_for_temporary_assignments: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  },
);

const parking_assignment_model = mongoose.model(
  "parking_assignment",
  parking_assignment_schema,
);

export default parking_assignment_model;
