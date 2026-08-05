import mongoose from "mongoose";

const owner_lease_schema = new mongoose.Schema(
  {
    owner:  {
      type: mongoose.Schema.Types.ObjectId,
      ref: "owner",
      required: true,
    },
    type: {
      type: String,
      enum: ["new", "existing"],
      required: true,
    },
    existing_lease: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "agreement",
    },
    new_lease: {
      property_name: {
        type: String,
      },
      unit_name_number: {
        type: String,
      },
      property_address: {
        type: String,
      },
      lease_terms: {
        start_date: {
          type: Date,
        },
        end_date: {
          type: Date,
        },
        notice_period: {
          type: String,
        },
        rent_schedule: {
          type: String,
        },
      },
      financial_terms: {
        monthly_rent: {
          type: Number,
        },
        security_deposit: {
          type: Number,
        },
      },
    },
  },
  {
    timestamps: true,
  },
);

const owner_lease_model = mongoose.model("owner_lease", owner_lease_schema);

export default owner_lease_model;