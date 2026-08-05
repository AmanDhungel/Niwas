import mongoose from "mongoose";

const app_settings_leave_type = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
    },
    days: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    _id: true,
  },
);

const app_settings_custom_field = new mongoose.Schema(
  {
    module: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "number", "date", "dropdown"],
      required: true,
    },
    default_value: {
      type: String,
    },
    options: [
      {
        key: {
          type: String,
        },
        value: {
          type: String,
        },
      },
    ],
    required: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    _id: true,
  },
);

const app_setting_schema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    salary_settings: {
      da_percentage: {
        type: Number,
        default: 0,
      },
      hra_percentage: {
        type: Number,
        default: 0,
      },
      provident_fund: {
        employee_share_percentage: {
          type: Number,
          default: 0,
        },
        organization_share_percentage: {
          type: Number,
          default: 0,
        },
      },
      esi: {
        employee_share_percentage: {
          type: Number,
          default: 0,
        },
        organization_share_percentage: {
          type: Number,
          default: 0,
        },
      },
      tds_annual_salary: {
        salary_from: {
          type: Number,
          default: 0,
        },
        salary_to: {
          type: Number,
          default: 0,
        },
        tds_percentage: {
          type: Number,
          default: 0,
        },
      },
    },
    approval_settings: {
      expense_approval: {
        type: {
          type: String,
          enum: ["sequence_chain", "simultaneous"],
        },
        approvers: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
          },
        ],
      },
      leave_approval: {
        type: {
          type: String,
          enum: ["sequence_chain", "simultaneous"],
        },
        approvers: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
          },
        ],
      },
      offer_approval: {
        type: {
          type: String,
          enum: ["sequence_chain", "simultaneous"],
        },
      },
    },
    invoice_settings: {
      logo: {
        key: {
          type: String,
        },
        url: {
          type: String,
        },
      },
      invoice_prefix: {
        type: String,
        default: "INV",
      },
      invoice_due_days: {
        type: Number,
        default: 30,
      },
      invoice_round_off: {
        enabled: {
          type: Boolean,
          default: false,
        },
        method: {
          type: String,
          enum: ["up", "down", "nearest"],
        },
      },
      show_company_details: {
        type: Boolean,
        default: true,
      },
      invoice_terms: {
        type: String,
      },
    },
    leave_types: [app_settings_leave_type],
    custom_fields: [app_settings_custom_field],
  },
  {
    timestamps: true,
  },
);

const app_setting_model = mongoose.model("app_setting", app_setting_schema);

export default app_setting_model;
