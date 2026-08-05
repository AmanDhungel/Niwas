import mongoose from "mongoose";

const task_form_field_subschema = new mongoose.Schema(
  {
    field_key: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    field_type: {
      type: String,
      required: true,
    },
    required: {
      type: Boolean,
      default: false,
    },
    hidden: {
      type: Boolean,
      default: false,
    },
    options: [
      {
        value: { type: String, required: true },
        label: { type: String, required: true },
      },
    ],
    placeholder: {
      type: String,
    },
    help_text: {
      type: String,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const task_form_response_subschema = new mongoose.Schema(
  {
    submitted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    submitted_at: {
      type: Date,
      default: new Date(),
    },
    values: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  { _id: false },
);

const task_subschema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "ram",
        "complaints",
        "crm",
        "hrm",
        "administration",
        "invoice",
        "general",
        "ticket",
      ],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    comments: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          auto: true,
        },
        comment: {
          type: String,
        },
        created_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
        created_at: {
          type: Date,
          default: new Date(),
        },
      },
    ],
    label: {
      label: {
        type: String,
      },
      color_code: {
        type: String,
      },
    },
    priority: {
      type: String,
    },
    checklists: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },
        items: [
          {
            text: {
              type: String,
              required: true,
              trim: true,
            },
            completed: {
              type: Boolean,
              default: false,
            },
            files: [
              {
                type: String,
              },
            ],
            file_keys: { type: [String], default: [] },
            item_deadline: {
              type: Date,
            },
            contacts: [
              {
                type: mongoose.Schema.Types.ObjectId,
                ref: "contact",
              },
            ],
          },
        ],
      },
    ],
    attendance: [
      {
        type: {
          type: String,
          enum: ["appointment", "schedule_visit"],
        },
        date: {
          type: Date,
        },
        time: {
          type: String,
        },
      },
    ],
    clock_in_out: [
      {
        clock_in: {
          type: Date,
        },
        clock_in_time: {
          type: String,
        },
        clock_out: {
          type: Date,
        },
        clock_out_time: {
          type: String,
        },
      },
    ],
    contacts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "contact",
      },
    ],
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "employee",
      },
    ],
    companies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "company",
      },
    ],
    deadline: {
      deadline: {
        type: Date,
      },
      reminder: {
        type: String,
      },
    },
    attachments: [
      {
        filename: {
          type: String,
        },
        uploaded_on: {
          type: Date,
          default: new Date(),
        },
        key: { type: String, default: null },
      },
    ],
    custom_fields: [
      {
        field_name: {
          type: String,
          required: true,
        },
        field_type: {
          type: String,
          required: true,
        },
        field_value: {
          type: mongoose.Schema.Types.Mixed,
        },
        field_options: [
          {
            value: {
              type: String,
              required: true,
            },
            label: {
              type: String,
              required: true,
            },
          },
        ],
      },
    ],
    invoices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "invoice",
      },
    ],
    location: {
      type: {
        type: String,
        enum: ["attendance", "site_visit", "meeting"],
        default: "site_visit",
      },
      date: {
        type: Date,
      },
      time: {
        type: String,
      },
      address: {
        type: String,
      },
      city: {
        type: String,
      },
      zip_code: {
        type: String,
      },
      photos: [
        {
          type: String,
        },
      ],
      photo_keys: { type: [String], default: [] },
    },
    form_definition: {
      enabled: {
        type: Boolean,
        default: false,
      },
      title: {
        type: String,
      },
      description: {
        type: String,
      },
      fields: {
        type: [task_form_field_subschema],
        default: [],
      },
      allow_multiple_submissions: {
        type: Boolean,
        default: false,
      },
    },
    form_responses: {
      type: [task_form_response_subschema],
      default: [],
    },
    activity_log: [
      {
        entity: {
          type: String,
        },
        action: {
          type: String,
        },
        performed_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
        performed_at: {
          type: Date,
          default: new Date(),
        },
        changes: [
          {
            previous_value: {
              type: mongoose.Schema.Types.Mixed,
            },
            new_value: {
              type: mongoose.Schema.Types.Mixed,
            },
          },
        ],
      },
    ],
    origin: {
      type: String,
      enum: ["deal", "lead", "ticket", "complaint", "ram", "general"],
      default: "general",
    },
    deal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "deal",
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "lead",
    },
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ticket",
    },
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "complaint",
    },
    ram: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ram",
    },
    meta: {
      created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
      created_at: {
        type: Date,
        default: new Date(),
      },
      initial_board: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "board",
      },
      initial_board_backup: {
        type: mongoose.Schema.Types.Mixed,
      },
      initial_tasklist: {
        type: mongoose.Schema.Types.ObjectId,
      },
      initial_tasklist_backup: {
        type: mongoose.Schema.Types.Mixed,
      },
    },
  },
  {
    timestamps: true,
  },
);

const task_list_subschema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    locked: {
      type: Boolean,
      default: false,
    },
    assigned_users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    tasks: [task_subschema],
    meta: {
      created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
      created_at: {
        type: Date,
        default: new Date(),
      },
      initial_board: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "board",
      },
      initial_board_backup: {
        type: mongoose.Schema.Types.Mixed,
      },
    },
  },
  {
    timestamps: true,
  },
);

const board_schema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "domain_workspace",
      required: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "vendor_workspace",
      required: true,
    },
    background_images: [{ type: String }],
    background_image_keys: { type: [String], default: [] },
    background_color: {
      type: String,
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    },
    task_lists: [task_list_subschema],
    assigned_users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    activity_log: [
      {
        entity: {
          type: String,
        },
        action: {
          type: String,
        },
        performed_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
        performed_at: {
          type: Date,
          default: new Date(),
        },
        changes: [
          {
            previous_value: {
              type: mongoose.Schema.Types.Mixed,
            },
            new_value: {
              type: mongoose.Schema.Types.Mixed,
            },
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  },
);

const board_model = mongoose.model("board", board_schema);

export default board_model;
