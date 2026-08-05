import mongoose from "mongoose";

const workorder_schema = new mongoose.Schema(
  {
    basic_info: {
      work_order_details: {
        title: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          trim: true,
        },
        category: {
          type: String,
        },
        subcategory: {
          type: String,
        },
        problem_type: {
          type: String,
        },
        priority: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
          default: "medium",
        },
      },
      location_information: {
        property: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "property",
        },
        unit: {
          type: mongoose.Schema.Types.ObjectId,
        },
        specific_location: {
          type: String,
        },
      },
      requester_information: {
        requester: {
          type: String,
          enum: ["tenant", "property_staff", "system"],
        },
        requester_name: {
          type: String,
        },
        requester_contact_info: {
          type: String,
        },
      },
      sla_targets: {
        acknowledgment: {
          type: Number,
        },
        response: {
          type: Number,
        },
        completion: {
          type: Number,
        },
      },
    },
    assignment: {
      vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "workorder_vendor",
      },
      scheduling: {
        scheduled_date: {
          type: Date,
        },
        scheduled_time: {
          type: String,
        },
        estimated_duration: {
          type: Number,
        },
      },
      access_and_requirements: {
        tenant_access_required: {
          type: Boolean,
          default: false,
        },
        post_completion_inspection_required: {
          type: Boolean,
          default: false,
        },
        requires_management_approval_before_starting: {
          type: Boolean,
          default: false,
        },
      },
    },
    cost_estimate: {
      cost_breakdown: {
        labor_cost: {
          type: Number,
          default: 0,
        },
        materials_cost: {
          type: Number,
          default: 0,
        },
        equipment_cost: {
          type: Number,
          default: 0,
        },
        additional_costs: {
          type: Number,
          default: 0,
        },
      },
      estimate_requires_approval_before_work_can_begin: {
        type: Boolean,
        default: false,
      },
      tenant_chargeback: {
        enabled: {
          type: Boolean,
          default: false,
        },
        chargeback_amount: {
          type: Number,
          default: 0,
        },
        reason: {
          type: String,
        },
        description: {
          type: String,
        },
      },
    },
    documentation: {
      before_photos: [
        // {
        //   type: String,
        // },
        {
          key: { type: String, required: true },
          url: { type: String, required: true },
        },
      ],
      after_photos: [
        // {
        //   type: String,
        // },
        {
          key: { type: String, required: true },
          url: { type: String, required: true },
        },
      ],
    },
  },
  {
    timestamps: true,
  },
);

const workorder_model = mongoose.model("workorder", workorder_schema);

export default workorder_model;
