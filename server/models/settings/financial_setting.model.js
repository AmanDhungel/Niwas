import mongoose from "mongoose";

const financial_setting_currency_schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    symbol: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      enum: ["before", "after"],
      default: "before",
    },
    code: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { _id: true },
);

const financial_setting_tax_rate_schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    rate: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    _id: true,
  },
);

const financial_setting_schema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    payment_gateways: {
      paypal: {
        enabled: {
          type: Boolean,
          default: false,
        },
        api_key: {
          type: String,
        },
        secret_key: {
          type: String,
        },
      },
      stripe: {
        enabled: {
          type: Boolean,
          default: false,
        },
        api_key: {
          type: String,
        },
        secret_key: {
          type: String,
        },
      },
      skrill: {
        enabled: {
          type: Boolean,
          default: false,
        },
        api_key: {
          type: String,
        },
        secret_key: {
          type: String,
        },
      },
    },
    tax_rates: [financial_setting_tax_rate_schema],
    currencies: [financial_setting_currency_schema],
  },
  {
    timestamps: true,
  },
);

const financial_setting_model = mongoose.model(
  "financial_setting",
  financial_setting_schema,
);

export default financial_setting_model;
