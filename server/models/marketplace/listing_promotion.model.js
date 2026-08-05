import mongoose from "mongoose";

const listing_promotion_schema = new mongoose.Schema(
  {
    /* ================= RELATIONS ================= */
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "property",
      required: true,
    },
    promotion_package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "promotion_package",
      required: true,
    },

    /* ================= SNAPSHOT FROM PACKAGE AT TIME OF PURCHASE ================= */
    package_snapshot: {
      name: { type: String },
      package_type: { type: String },
      description: { type: String },
      duration_days: { type: Number },
      price: { type: Number },
      priority_level: { type: Number },
      placement_zones: {
        homepage_hero: { type: Boolean, default: false },
        homepage_grid: { type: Boolean, default: false },
        category_top: { type: Boolean, default: false },
        search_results: { type: Boolean, default: false },
        sidebar_featured: { type: Boolean, default: false },
      },
      features: [{ type: String }],
    },

    /* ================= DURATION & DATES ================= */
    duration_type: {
      type: String,
      required: true,
      enum: ["one_time", "recurring"],
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
    },

    /* ================= STATUS ================= */
    promotion_status: {
      type: String,
      enum: ["active", "scheduled", "expired", "cancelled"],
      default: "scheduled",
    },
  },
  {
    timestamps: true,
  },
);

const listing_promotion_model = mongoose.model(
  "listing_promotion",
  listing_promotion_schema,
);

export default listing_promotion_model;
