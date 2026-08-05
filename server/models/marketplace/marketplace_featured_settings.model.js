import mongoose from "mongoose";

const marketplace_featured_settings_schema = new mongoose.Schema(
  {
    /* ================= SINGLETON GUARD ================= */
    // Ensures only one document ever exists in this collection
    singleton_key: {
      type: String,
      default: "global",
      unique: true,
      immutable: true,
    },

    general_settings: {
      maximum_featured_listing_per_user: {
        type: Number,
        min: 1,
        default: 1,
      },
      featured_badge_display: {
        type: String,
      },
      auto_renew_featured_listing: {
        type: Boolean,
        default: false,
      },
      send_expiration_reminders: {
        type: Boolean,
        default: true,
      },
      allow_manual_position_selection: {
        type: Boolean,
        default: false,
      },
    },

    display_preferences: {
      homepage_featured_grid_size: {
        type: Number,
        min: 1,
        max: 20,
        default: 4,
      },
      rotation_frequency: {
        type: Number,
        min: 1,
        max: 24,
        default: 6,
      },
      show_package_type_badge: {
        type: Boolean,
        default: true,
      },
      highlight_feature_in_search: {
        type: Boolean,
        default: true,
      },
      track_analytics_automatically: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

const marketplace_featured_settings_model = mongoose.model(
  "marketplace_featured_settings",
  marketplace_featured_settings_schema,
);

export default marketplace_featured_settings_model;
