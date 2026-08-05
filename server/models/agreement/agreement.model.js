import mongoose from "mongoose";

const agreement_schema = new mongoose.Schema(
  {
    basic_info: {
      property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "property",
        required: true,
      },
      agreement_status: {
        type: String,
        required: true,
        enum: ["active", "terminated", "pending", "draft", "expired"],
      },
      start_date: {
        type: Date,
        required: true,
      },
      end_date: {
        type: Date,
        required: true,
      },
      notice_period: {
        type: Number,
        required: true,
      },
      renew_options: {
        type: String,
        required: true,
        enum: ["manual", "automatic"],
      },
    },
    parties: [
      {
        role: {
          type: String,
          required: true,
          enum: ["owner", "tenant"],
        },
        entity: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "parties.role",
          required: true,
        },
        status: {
          type: String,
          required: true,
          enum: ["active", "terminated", "pending"],
        },
        name_organization: {
          type: String,
        },
        email: {
          type: String,
        },
        phone_number: {
          type: String,
        },
        share_percentage: {
          type: Number,
          required: true,
        },
      },
    ],
    units_and_spaces: [
      {
        selected_unit: {
          type: mongoose.Schema.Types.ObjectId,
        },
        unit_type: {
          type: String,
          required: true,
          enum: ["floor", "apartment", "room", "bedspace", "common_area"],
        },
        occupancy_limit: {
          type: Number,
        },
        area_size: {
          type: Number,
        },
        furnishing_level: {
          type: String,
          enum: ["unfurnished", "partially_furnished", "fully_furnished"],
        },
        furniture_list: [
          {
            type: {
              type: String,
              enum: ["furniture", "appliance", "fixture"],
            },
            name: {
              type: String,
            },
            status: {
              type: String,
              enum: ["good", "fair", "poor"],
            },
          },
        ],
        property_condition: {
          walls: {
            type: String,
            enum: ["good", "fair", "poor"],
          },
          flooring: {
            type: String,
            enum: ["good", "fair", "poor"],
          },
          plumbing: {
            type: String,
            enum: ["good", "fair", "poor"],
          },
          electrical: {
            type: String,
            enum: ["good", "fair", "poor"],
          },
          windows_doors: {
            type: String,
            enum: ["good", "fair", "poor"],
          },
          fixtures: {
            type: String,
            enum: ["good", "fair", "poor"],
          },
          inspection_date: {
            type: Date,
          },
          inspected_by: {
            type: String,
          },
          additional_notes: {
            type: String,
          },
        },
      },
    ],
    rent_and_deposit: {
      rent_schedule: {
        payment_frequency: {
          type: String,
          required: true,
          enum: ["monthly", "quarterly", "annually"],
        },
        base_rent_amount: {
          type: Number,
          required: true,
        },
        currency: {
          type: String,
          required: true,
        },
        due_day_of_month: {
          type: Number,
          required: true,
        },
        grace_period_days: {
          type: Number,
          required: true,
        },
      },
      rent_escalation: {
        escalation_percentage: {
          type: Number,
          required: true,
        },
        escalation_frequency: {
          type: String,
          required: true,
          enum: ["annually", "biennially"],
        },
      },
      late_fee_policy: {
        late_fee_type: {
          type: String,
          required: true,
          enum: ["fixed", "percentage"],
        },
        late_fee_amount: {
          type: Number,
          required: true,
        },
        maximum_cap: {
          type: Number,
        },
      },
    },
    utilities_and_services: [
      {
        type: {
          type: String,
          required: true,
          enum: ["electricity", "water", "gas", "internet", "maintenance"],
        },
        billing_type: {
          type: String,
          required: true,
          enum: ["included", "separate", "shared"],
        },
        payment_responsibility: {
          type: String,
          required: true,
          enum: ["owner", "tenant", "shared"],
        },
        due_day_of_month: {
          type: Number,
        },
        grace_period_days: {
          type: Number,
        },
        utility_deposit_required: {
          type: Boolean,
          required: true,
        },
        deposit_amount: {
          type: Number,
        },
        connection_fee: {
          type: Number,
        },
        disconnection_terms: {
          type: String,
        },
      },
    ],
    sla_and_terms: {
      slas: [
        {
          category: {
            type: String,
            required: true,
            enum: [
              "maintenance_response",
              "emergency_response",
              "general_inquiry",
            ],
          },
          availability: {
            type: String,
            required: true,
            enum: ["24/7", "business_hours", "weekends"],
          },
          description: {
            type: String,
          },
          response_time_hours: {
            type: Number,
            required: true,
          },
          resolution_time_hours: {
            type: Number,
            required: true,
          },
          escalation_procedures: {
            type: String,
          },
          contact_person: {
            type: String,
          },
          contact_phone: {
            type: String,
          },
          emergency_contact: {
            type: String,
          },
          penalty_clause: {
            type: String,
          },
        },
      ],
      agreement_terms_and_conditions: {
        termination_clause: {
          type: String,
        },
        renewal_terms: {
          type: String,
        },
        modification_policy: {
          type: String,
        },
        dispute_resolution: {
          type: String,
        },
        governing_law: {
          type: String,
        },
        force_majeure: {
          type: String,
        },
      },
    },
    clauses_and_compliance: {
      clauses: [
        {
          type: {
            type: String,
            required: true,
            enum: [
              "house_rules",
              "pet_policy",
              "subletting_policy",
              "noise_restrictions",
              "parking_rules",
              "others"
            ],
          },
          other_clause_name: {
            type: String,
          },
          clause_text: {
            type: String,
            required: true,
          },
        },
      ],
      compliance_requirements: [
        {
          type: {
            type: String,
            required: true,
            enum: ["legal", "regulatory", "industry_standard"],
          },
          description: {
            type: String,
            required: true,
          },
          compliance_deadline: {
            type: Date,
          },
          responsible_party: {
            type: String,
            enum: ["owner", "tenant"],
          },
          documentation_required: {
            type: Boolean,
            default: false,
          },
        },
      ],
    },
  },
  {
    timestamps: true,
  },
);

const agreement_model = mongoose.model("agreement", agreement_schema);

export default agreement_model;