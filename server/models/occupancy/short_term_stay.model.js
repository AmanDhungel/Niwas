import mongoose from "mongoose";

const short_term_stay_schema = new mongoose.Schema(
  {
    /* ================= GUEST INFORMATION ================= */
    guest_info: {
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
      place_of_birth: {
        type: String,
      },
      phone_number: {
        type: String,
      },
      email: {
        type: String,
      },
      alternate_phone: {
        type: String,
      },
      relationship_to_tenant: {
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

    /* ================= IDENTIFICATION ================= */
    identification: {
      id_type: {
        type: String,
        required: true,
        enum: ["passport", "national_id", "drivers_license", "residence_permit", "other"],
      },
      id_number: {
        type: String,
        required: true,
      },
      id_document: {
        type: String,    // file path
      },
    },

    /* ================= ADDITIONAL GUESTS ================= */
    additional_guests: [
      {
        id_document: {
          type: String,  // file path
        },
      },
    ],

    /* ================= STAY DETAILS ================= */
    stay_details: {
      check_in_date: {
        type: Date,
        required: true,
      },
      check_out_date: {
        type: Date,
        required: true,
      },
      purpose_category: {
        type: String,
        required: true,
        enum: ["family_visit", "business", "tourism", "medical", "education", "other"],
      },
      detailed_purpose: {
        type: String,
        required: true,
      },
      urgency_level: {
        type: String,
        required: true,
        enum: ["low", "medium", "high"],
        default: "low",
      },
    },

    /* ================= SPECIAL REQUIREMENTS ================= */
    special_requirements: {
      requirements_notes: {
        type: String,
      },
      parking_space_required: {
        type: Boolean,
        default: false,
      },
      extra_bedding_needed: {
        type: Boolean,
        default: false,
      },
    },

    /* ================= EMERGENCY CONTACT ================= */
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

    /* ================= PREVIOUS VISITS & DEPOSIT ================= */
    visit_info: {
      has_stayed_before: {
        type: Boolean,
        default: false,
      },
      willing_to_pay_security_deposit: {
        type: Boolean,
        default: false,
      },
      additional_notes: {
        type: String,
      },
    },

    /* ================= POLICY & AGREEMENT ================= */
    agreement: {
      policy_acknowledged: {
        type: Boolean,
        required: true,
        default: false,
      },
      acknowledged_at: {
        type: Date,
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

const short_term_stay_model = mongoose.model("short_term_stay", short_term_stay_schema);

export default short_term_stay_model;