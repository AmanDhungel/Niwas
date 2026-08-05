import mongoose from "mongoose";

const employee_schema = new mongoose.Schema(
  {
    employee_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    join_date: {
      type: Date,
      required: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    date_of_birth: {
      type: Date,
    },
    address: {
      address: {
        type: String,
        trim: true,
        required: true,
      },
      country: {
        type: String,
        trim: true,
        required: true,
      },
      state: {
        type: String,
        trim: true,
        required: true,
      },
      city: {
        type: String,
        trim: true,
        required: true,
      },
      zip_code: {
        type: String,
        trim: true,
        required: true,
      },
    },
    passport_number: {
      type: String,
      trim: true,
    },
    passport_expiry_date: {
      type: Date,
    },
    nationality: {
      type: String,
      trim: true,
    },
    religion: {
      type: String,
      trim: true,
    },
    marital_status: {
      type: String,
      enum: ["single", "married", "divorced", "widowed"],
    },
    employment_of_spouse: {
      type: Boolean,
      default: false,
    },
    no_of_children: {
      type: Number,
      default: 0,
    },
    // company: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "company",
    //   required: true,
    // },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "department",
      required: true,
    },
    designation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "designation",
      required: true,
    },
    about: {
      type: String,
      trim: true,
    },
    bank_info: {
      bank_name: {
        type: String,
        trim: true,
      },
      account_number: {
        type: String,
        trim: true,
      },
      ifsc_code: {
        type: String,
        trim: true,
      },
      branch: {
        type: String,
        trim: true,
      },
    },
    family_info: [
      {
        name: {
          type: String,
          trim: true,
        },
        relationship: {
          type: String,
          trim: true,
        },
        date_of_birth: {
          type: Date,
        },
        contact_number: {
          type: String,
          trim: true,
        },
      },
    ],
    education: [
      {
        university: {
          type: String,
          trim: true,
        },
        degree: {
          type: String,
          trim: true,
        },
        from_year: {
          type: Number,
        },
        to_year: {
          type: Number,
        },
      },
    ],
    experience: [
      {
        company_name: {
          type: String,
          trim: true,
        },
        position: {
          type: String,
          trim: true,
        },
        from_date: {
          type: Date,
        },
        to_date: {
          type: Date,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const employee_model = mongoose.model("employee", employee_schema);

export default employee_model;
