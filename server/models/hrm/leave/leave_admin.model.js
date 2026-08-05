import mongoose from "mongoose";

const leave_admin_schema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employee",
      required: true,
    },
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
        "unplanned_leave",
      ],
    },
    from_date: {
      type: Date,
      required: true,
    },
    to_date: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["full_day", "half_day"],
    },
    reason: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    rejected_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  {
    timestamps: true,
  },
);

const leave_admin_model = mongoose.model("leave_admin", leave_admin_schema);

export default leave_admin_model;
