import mongoose from "mongoose";

const property_tour_schema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ["in_person", "virtual"],
      required: true,
    },
    preferred_date: {
      type: Date,
      required: true,
    },
    preferred_time: {
      type: String,
      required: true,
    },
    additional_notes: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

const property_tour_model = mongoose.model(
  "property_tour",
  property_tour_schema,
);

export default property_tour_model;
