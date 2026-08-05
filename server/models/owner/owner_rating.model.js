import mongoose from "mongoose";

const owner_rating_schema = new mongoose.Schema(
  {
    owner_and_property_information: {
      owner_name: {
        type: String,
      },
      property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "property",
      },
      unit: {
        type: mongoose.Schema.Types.ObjectId,
      },
      tenancy_duration: {
        type: String,
      },
    },
    performance_ratings: {
      communication: {
        type: Number,
        min: 1,
        max: 5,
      },
      responsiveness: {
        type: Number,
        min: 1,
        max: 5,
      },
      maintenance_support: {
        type: Number,
        min: 1,
        max: 5,
      },
      professionalism: {
        type: Number,
        min: 1,
        max: 5,
      },
      fairness: {
        type: Number,
        min: 1,
        max: 5,
      },
      overall: {
        type: Number,
        min: 1,
        max: 5,
      },
    },
    written_review: {
      overall_review: {
        type: String,
      },
      positive_aspects: [
        {
          type: String,
        },
      ],
      areas_for_improvement: [
        {
          type: String,
        },
      ],
    },
    additional_settings: {
      recommend_owner: {
        type: Boolean,
      },
      make_rating_public: {
        type: Boolean,
      },
    },
  },
  {
    timestamps: true,
  },
);

const owner_rating_model = mongoose.model("owner_rating", owner_rating_schema);

export default owner_rating_model;
