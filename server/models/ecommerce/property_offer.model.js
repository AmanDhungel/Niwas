import mongoose from "mongoose";

const property_offer_schema = new mongoose.Schema(
  {
    requestor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "property",
      required: true,
    },
    offer_amount: {
      type: Number,
      required: true,
    },
    financing_type: {
      type: String,
      enum: ["cash", "financing", "mixed"],
      required: true,
    },
    contingencies: {
      property_inspection: {
        type: Boolean,
        default: false,
      },
      financing_approval: {
        type: Boolean,
        default: false,
      },
      environmental_assessment: {
        type: Boolean,
        default: false,
      },
      title_review: {
        type: Boolean,
        default: false,
      },
      zoning_verification: {
        type: Boolean,
        default: false,
      },
    },
    proposed_closing_date: {
      type: Date,
    },
    additional_notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const property_offer_model = mongoose.model(
  "property_offer",
  property_offer_schema,
);

export default property_offer_model;
