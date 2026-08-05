import mongoose from "mongoose";

const long_term_occupant_schema = new mongoose.Schema(
  {
    /* ================= STEP 1: PERSONAL & CONTACT INFO ================= */
    personal_info: {
      profile_image: {
        type: String,
      },
      first_name: {
        type: String,
        required: true,
      },
      last_name: {
        type: String,
        required: true,
      },
      date_of_birth: {
        type: Date,
        required: true,
      },
      nationality: {
        type: String,
        required: true,
      },
      government_id_number: {
        type: String,
      },
      place_of_birth: {
        type: String,
      },
    },

    /* ================= CONTACT INFO ================= */
    contact_info: {
      phone_number: {
        type: String,
      },
      email: {
        type: String,
      },
      alternate_phone: {
        type: String,
      },
    },

    /* ================= SOCIAL MEDIA ================= */
    social_media: {
      facebook: {
        type: String,
      },
      instagram: {
        type: String,
      },
      twitter: {
        type: String,
      },
      whatsapp: {
        type: String,
      },
      pinterest: {
        type: String,
      },
      linkedin: {
        type: String,
      },
    },

    /* ================= STEP 2: RELATIONSHIP & STAY DETAILS ================= */
    relationship_details: {
      relationship_to_tenant: {
        type: String,
        required: true,
        enum: [
          "spouse",
          "parent",
          "sibling",
          "child",
          "relative",
          "friend",
          "colleague",
          "other",
        ],
      },
    },

    stay_info: {
      planned_move_in_date: {
        type: Date,
        required: true,
      },
      expected_stay_duration: {
        type: String,
        enum: [
          "1_month",
          "3_months",
          "6_months",
          "1_year",
          "2_years",
          "indefinite",
        ],
      },
      reason_for_stay: {
        type: String,
      },
      urgency_level: {
        type: String,
        required: true,
        enum: ["low", "medium", "high"],
        default: "low",
      },
    },

    /* ================= EMPLOYMENT INFO ================= */
    employment_info: {
      occupation: {
        type: String,
      },
      employer: {
        type: String,
      },
    },

    /* ================= STEP 3: EMERGENCY CONTACT & HEALTH ================= */
    emergency_contact: {
      name: {
        type: String,
        required: true,
      },
      relationship: {
        type: String,
        required: true,
      },
      phone_number: {
        type: String,
        required: true,
      },
      address: {
        type: String,
      },
    },

    health_info: {
      medical_conditions: {
        type: String,
      },
      special_requirements: {
        type: String,
      },
    },

    /* ================= STEP 4: DOCUMENTS ================= */
    documents: {
      government_id: {
        type: String, // file path - required
      },
      proof_of_income: {
        type: String, // file path - optional
      },
      health_certificate: {
        type: String, // file path - optional
      },
    },

    /* ================= RELATIONS ================= */
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "tenant",
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "property",
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "property",
    },

    /* ================= STATUS ================= */
    request_status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

const long_term_occupant_model = mongoose.model(
  "long_term_occupant",
  long_term_occupant_schema,
);

export default long_term_occupant_model;
