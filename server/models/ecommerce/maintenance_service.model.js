import mongoose from "mongoose";

const maintenance_service_schema = new mongoose.Schema(
  {
    requestor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    service_type: {
      type: String,
      enum: ["scheduled", "recurring", "reported", "emergency"],
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "property",
    },
    description: {
      type: String,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    preferred_service_date: {
      type: Date,
    },
    contact_phone_number: {
      type: String,
    },
    photos: [
      {
        key: {
          type: String,
        },
        url: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const maintenance_service_model = mongoose.model(
  "maintenance_service",
  maintenance_service_schema,
);

export default maintenance_service_model;
