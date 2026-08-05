import mongoose from "mongoose";

const estimate_schema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "contact",
      required: true,
    },
    project: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    tax: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tax",
      required: true,
    },
    client_address: {
      type: String,
      required: true,
    },
    billing_address: {
      type: String,
      required: true,
    },
    estimate_date: {
      type: Date,
      required: true,
    },
    expiry_date: {
      type: Date,
      required: true,
    },
    items: [
      {
        item: {
          type: String,
        },
        description: {
          type: String,
          trim: true,
        },
        unit_cost: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
      },
    ],
    total_amount: {
      type: Number,
      required: true,
    },
    tax_amount: {
      type: Number,
      required: true,
    },
    discount_percentage: {
      type: Number,
      default: 0,
    },
    grand_total: {
      type: Number,
      required: true,
    },
    other_information: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const estimate_model = mongoose.model("estimate", estimate_schema);

export default estimate_model;
