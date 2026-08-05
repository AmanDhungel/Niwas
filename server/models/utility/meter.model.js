import mongoose from "mongoose";

const meter_schema = new mongoose.Schema(
  {
    /* ================= BASIC INFO ================= */
    basic_info: {
      meter_number: {
        type: String,
        required: true,
      },
      utility_type: {
        type: String,
        required: true,
        enum: ["electricity", "water", "gas", "internet"],
      },
      meter_type: {
        type: String,
        required: true,
        enum: ["manual", "smart"],
      },
      brand: {
        type: String,
      },
      model: {
        type: String,
      },
      installation_date: {
        type: Date,
        required: true,
      },
    },

    /* ================= LOCATION ================= */
    location: {
      property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "property",
      },
      unit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "property",
      },
      specific_location: {
        type: String,
      },
      access_instructions: {
        type: String,
      },
    },

    /* ================= TECHNICAL SPECS ================= */
    technical_specs: {
      capacity: {
        type: String,
      },
      measurement_units: {
        type: String,
      },
      accuracy_class: {
        type: String,
      },
      is_smart_meter: {
        type: Boolean,
        default: false,
      },
      has_digital_display: {
        type: Boolean,
        default: false,
      },
      is_remote_reading_capable: {
        type: Boolean,
        default: false,
      },
    },

    /* ================= CONFIGURATION ================= */
    configuration: {
      initial_reading: {
        type: Number,
        required: true,
      },
      multiplier_factor: {
        type: Number,
        default: 1,
      },
      billing_rate_structure: {
        type: String,
      },
      base_service_fee: {
        type: Number,
      },
      per_unit_rate: {
        type: Number,
      },
    },

    /* ================= SETTINGS ================= */
    settings: {
      enable_billing: {
        type: Boolean,
        default: false,
      },
      tenant_access: {
        type: Boolean,
        default: false,
      },
      automatic_calculation: {
        type: Boolean,
        default: false,
      },
      usage_alerts: {
        type: Boolean,
        default: false,
      },
    },

    /* ================= MISC ================= */
    additional_notes: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
    },
  },
  {
    timestamps: true,
  },
);

const meter_model = mongoose.model("meter", meter_schema);

export default meter_model;
