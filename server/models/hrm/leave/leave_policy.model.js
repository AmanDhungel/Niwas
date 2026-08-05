import mongoose from "mongoose";

const leave_policy_schema = new mongoose.Schema(
  {
    leave_type: {
      type: String,
      required: true,
      enum: [
        "sick_leave",
        "casual_leave",
        "earned_leave",
        "maternity_leave",
        "paternity_leave",
        "bereavement_leave",
      ],
    },
    policy_name: {
      type: String,
      required: true,
      trim: true,
    },
    no_of_days: {
      type: Number,
      required: true,
    },
    status: {
      type: Boolean,
      required: true,
    },
    employees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "employee",
      },
    ],
  },
  {
    timestamps: true,
  },
);

const leave_policy_model = mongoose.model("leave_policy", leave_policy_schema);

export default leave_policy_model;
