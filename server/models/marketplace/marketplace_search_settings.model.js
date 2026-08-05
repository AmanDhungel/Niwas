import mongoose from "mongoose";

const marketplace_search_settings_schema = new mongoose.Schema(
  {
    /* ================= SINGLETON GUARD ================= */
    // Ensures only one document ever exists in this collection
    singleton_key: {
      type: String,
      default: "global",
      unique: true,
      immutable: true,
    },

    /* ================= RANKING FACTORS ================= */
    ranking_factors: {
      relevance_factors: [
        {
          key: {
            type: String,
            required: true,
            enum: ["exact_match_score", "partial_match_score"],
          },
          label: { type: String },
          description: { type: String },
          impact: {
            type: String,
            enum: ["high", "medium", "low"],
          },
          weight: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
          },
          enabled: {
            type: Boolean,
            default: true,
          },
        },
      ],
      quality_factors: [
        {
          key: {
            type: String,
            required: true,
            enum: [
              "property_rating",
              "listing_completeness",
              "number_of_photos",
              "response_time",
            ],
          },
          label: { type: String },
          description: { type: String },
          impact: {
            type: String,
            enum: ["high", "medium", "low"],
          },
          weight: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
          },
          enabled: {
            type: Boolean,
            default: true,
          },
        },
      ],
      popularity_factors: [
        {
          key: {
            type: String,
            required: true,
            enum: ["total_views", "inquiry_rate"],
          },
          label: { type: String },
          description: { type: String },
          impact: {
            type: String,
            enum: ["high", "medium", "low"],
          },
          weight: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
          },
          enabled: {
            type: Boolean,
            default: true,
          },
        },
      ],
      recency_factors: [
        {
          key: {
            type: String,
            required: true,
            enum: ["listing_age", "last_updated"],
          },
          label: { type: String },
          description: { type: String },
          impact: {
            type: String,
            enum: ["high", "medium", "low"],
          },
          weight: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
          },
          enabled: {
            type: Boolean,
            default: true,
          },
        },
      ],
      location_factors: [
        {
          key: {
            type: String,
            required: true,
            enum: ["location_proximity"],
          },
          label: { type: String },
          description: { type: String },
          impact: {
            type: String,
            enum: ["high", "medium", "low"],
          },
          weight: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
          },
          enabled: {
            type: Boolean,
            default: true,
          },
        },
      ],
      price_factors: [
        {
          key: {
            type: String,
            required: true,
            enum: ["price_competitiveness"],
          },
          label: { type: String },
          description: { type: String },
          impact: {
            type: String,
            enum: ["high", "medium", "low"],
          },
          weight: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
          },
          enabled: {
            type: Boolean,
            default: true,
          },
        },
      ],
    },

    /* ================= FILTER CONFIGURATION ================= */
    filter_configuration: [
      {
        key: {
          type: String,
          required: true,
          enum: [
            "price_range",
            "property_type",
            "bedrooms",
            "bathrooms",
            "square_feet",
            "location",
            "amenities",
            "listing_type",
            "availability",
            "verified_only",
            "virtual_tour_available",
            "minimum_rating",
          ],
        },
        label: { type: String },
        category: { type: String },
        filter_type: {
          type: String,
          enum: ["range", "select", "multiselect", "boolean", "location"],
        },
        enabled: {
          type: Boolean,
          default: true,
        },
        required_filter: {
          type: Boolean,
          default: false,
        },
        // For range filters
        range_min: { type: Number },
        range_max: { type: Number },
        // For select/multiselect filters
        options: [{ type: String }],
        // For boolean filters
        default_value: { type: mongoose.Schema.Types.Mixed },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const marketplace_search_settings_model = mongoose.model(
  "marketplace_search_settings",
  marketplace_search_settings_schema,
);

export default marketplace_search_settings_model;