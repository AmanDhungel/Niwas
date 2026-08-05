import mongoose from "mongoose";

const ab_test_schema = new mongoose.Schema(
  {
    /* ================= BASIC INFO ================= */
    test_name: {
      type: String,
      required: true,
    },
    test_type: {
      type: String,
      required: true,
      enum: [
        "ranking_weights",
        "search_filters",
        "result_ordering",
        "personalization",
        "ui_layout",
      ],
    },

    /* ================= VARIANTS ================= */
    variant_a: {
      label: {
        type: String,
        default: "Variant A (Control)",
      },
      description: {
        type: String,
        default: "Current algorithm configuration",
      },
      config: {
        type: mongoose.Schema.Types.Mixed,
      },
    },
    variant_b: {
      label: {
        type: String,
        default: "Variant B (Test)",
      },
      description: {
        type: String,
        default: "Modified algorithm weights",
      },
      config: {
        type: mongoose.Schema.Types.Mixed,
      },
    },

    /* ================= TRAFFIC ================= */
    traffic_allocation_percentage: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
      default: 10,
    },

    /* ================= STATUS ================= */
    test_status: {
      type: String,
      enum: ["draft", "running", "paused", "completed", "cancelled"],
      default: "draft",
    },

    /* ================= RESULTS (populated later) ================= */
    results: {
      variant_a_impressions: { type: Number, default: 0 },
      variant_b_impressions: { type: Number, default: 0 },
      variant_a_conversions: { type: Number, default: 0 },
      variant_b_conversions: { type: Number, default: 0 },
      winner: {
        type: String,
        enum: ["variant_a", "variant_b", "inconclusive", null],
        default: null,
      },
    },

    /* ================= DATES ================= */
    started_at: {
      type: Date,
    },
    ended_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

const ab_test_model = mongoose.model("ab_test", ab_test_schema);

export default ab_test_model;