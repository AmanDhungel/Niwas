import mongoose from "mongoose";

const utility_provider_schema = new mongoose.Schema(
  {
    basic_info: {
      name: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        required: true,
        enum: ["electricity", "water", "gas", "internet"],
      },
    },
    contact_info: {
      email: {
        type: String,
      },
      phone: {
        type: String,
      },
      website_url: {
        type: String,
      },
      emergency_phone: {
        type: String,
      },
      customer_service_hours: {
        type: String,
      },
      street_address: {
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
    service_areas: [
      {
        type: String,
      },
    ],
    payment_terms: {
      method: {
        type: String,
        enum: ["credit_card", "bank_transfer", "check", "cash"],
      },
      due_days: {
        type: Number,
      },
      late_fee_policy: {
        type: String,
      },
      deposit_requirements: {
        enabled: {
          type: Boolean,
        },
        amount: {
          type: Number,
        },
      },
    },
    service_metrics: {
      reliability: {
        type: Number,
      },
      average_response_time: {
        type: Number,
      },
      customer_satisfaction_rating: {
        type: Number,
      },
    },
    billing_configuration: {
      cycle: {
        type: String,
        enum: ["monthly", "quarterly", "annually"],
      },
      type: {
        type: String,
        enum: ["automatic", "manual"],
      },
      estimation_policy: {
        type: String,
      },
      adjustment_policy: {
        type: String,
      },
    },
    contract_details: {
      id: {
        type: String,
      },
      start_date: {
        type: Date,
      },
      end_date: {
        type: Date,
      },
      renewal_terms: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  },
);

const utility_provider_model = mongoose.model(
  "utility_provider",
  utility_provider_schema,
);

export default utility_provider_model;
