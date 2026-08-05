import mongoose from "mongoose";

const appraisal_schema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employee",
      required: true,
    },
    appraisal_date: {
      type: Date,
      required: true,
    },
    technical_competencies: {
      customer_experience: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
      },
      marketing: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
      },
      management: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
      },
      administration: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
      },
      presentation_skills: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
      },
      quality_of_work: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
      },
      efficiency: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
      },
    },
    organizational_competencies: {
      integrity: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
      },
      professionalism: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
      },
      teamwork: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
      },
      critical_thinking: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
      },
      conflict_management: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
      },
      attendance: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
      },
      ability_to_meet_deadlines: {
        type: String,
        enum: ["beginner", "intermediate", "advanced", "expert"],
      },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

const appraisal_model = mongoose.model("appraisal", appraisal_schema);

export default appraisal_model;
