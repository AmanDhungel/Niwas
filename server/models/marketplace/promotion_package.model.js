import mongoose from "mongoose";

const promotion_package_schema = new mongoose.Schema(
  {
    /* ================= BASIC INFO ================= */
    name: {
      type: String,
      required: true,
    },
    package_type: {
      type: String,
      required: true,
      enum: ["basic", "standard", "premium", "enterprise"],
    },
    description: {
      type: String,
      required: true,
    },

    /* ================= PRICING & DURATION ================= */
    duration_days: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    priority_level: {
      type: Number,
      default: 4,
    },

    /* ================= PLACEMENT ZONES ================= */
    placement_zones: {
      homepage_hero: {
        type: Boolean,
        default: false,
      },
      homepage_grid: {
        type: Boolean,
        default: false,
      },
      category_top: {
        type: Boolean,
        default: false,
      },
      search_results: {
        type: Boolean,
        default: false,
      },
      sidebar_featured: {
        type: Boolean,
        default: false,
      },
    },

    /* ================= PACKAGE FEATURES ================= */
    features: [
      {
        type: String,
      },
    ],

    /* ================= STATUS ================= */
    is_enabled: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "inactive",
    },
  },
  {
    timestamps: true,
  },
);

const promotion_package_model = mongoose.model(
  "promotion_package",
  promotion_package_schema,
);

export default promotion_package_model;
