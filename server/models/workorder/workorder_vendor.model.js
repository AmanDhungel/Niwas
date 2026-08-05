import mongoose from "mongoose";

const workorder_vendor_schema = new mongoose.Schema(
  {
    business_name: {
      type: String,
      required: true,
      trim: true,
    },
    contact_name: {
      type: String,
      required: true,
      trim: true,
    },
    phone_number: {
      type: String,
      required: true,
      trim: true,
    },
    email_address: {
      type: String,
      required: true,
      trim: true,
    },
    business_address: {
      type: String,
      trim: true,
    },
    license_number: {
      type: String,
      trim: true,
    },
    license_expiration_date: {
      type: Date,
    },
    insurance_provider: {
      type: String,
      trim: true,
    },
    coverage_amount: {
      type: Number,
    },
    insurance_expiration_date: {
      type: Date,
    },
    domain_workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "domain_workspace",
      required: true,
    },
    service_areas: [
      {
        type: String,
        trim: true,
      },
    ],
    emergency_service_available: {
      type: Boolean,
      default: false,
    },
    hourly_rate: {
      type: Number,
    },
    minimum_charge: {
      type: Number,
    },
    emergency_multiplier: {
      type: Number,
    },
    specializations: [
      {
        type: String,
        trim: true,
      },
    ],
    certifications: [
      {
        type: String,
        trim: true,
      },
    ],
    contract_start_date: {
      type: Date,
    },
    contract_end_date: {
      type: Date,
    },
    payment_terms: {
      type: String,
      trim: true,
    },
    scope_of_work: [
      {
        type: String,
        trim: true,
      },
    ],
    document_status: {
      license_document: {
        type: Boolean,
        default: false,
      },
      insurance_certificate: {
        type: Boolean,
        default: false,
      },
      w9_form: {
        type: Boolean,
        default: false,
      },
      signed_contract: {
        type: Boolean,
        default: false,
      },
    },
    preferred_vendor: {
      type: Boolean,
      default: false,
    },
    last_review_date: {
      type: Date,
    },
    next_review_date: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending", "suspended"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

const workorder_vendor_model = mongoose.model(
  "workorder_vendor",
  workorder_vendor_schema,
);

export default workorder_vendor_model;
