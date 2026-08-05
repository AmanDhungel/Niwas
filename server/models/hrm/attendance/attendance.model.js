// attendance.model.js
import mongoose from "mongoose";

const attendance_schema = new mongoose.Schema(
  {
    /* ================= CORE ================= */
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employee",
      required: true,
    },
    attendance_type: {
      type: String,
      enum: ["regular", "overtime", "on_duty", "work_from_home"],
      default: "regular",
    },

    /* ================= DATE ================= */
    attendance_date: {
      type: String,
      required: true,
    },

    /* ================= PUNCH IN ================= */
    check_in: {
      type: Date,
    },
    check_in_note: {
      type: String,
    },

    /* ================= PUNCH OUT ================= */
    check_out: {
      type: Date,
    },
    check_out_note: {
      type: String,
    },

    /* ================= COMPUTED DURATIONS (minutes) ================= */
    total_working_minutes: {
      type: Number,
      default: 0,
    },
    break_minutes: {
      type: Number,
      default: 0,
    },
    productive_minutes: {
      type: Number,
      default: 0,
    },
    overtime_minutes: {
      type: Number,
      default: 0,
    },
    late_minutes: {
      type: Number,
      default: 0,
    },

    /* ================= BREAK TRACKING ================= */
    break_start: {
      type: Date,
      default: null,
    },
    break_end: {
      type: Date,
      default: null,
    },

    /* ================= STATUS ================= */
    attendance_status: {
      type: String,
      enum: ["present", "absent", "half_day", "on_leave", "holiday"],
      default: "present",
    },
    is_late: {
      type: Boolean,
      default: false,
    },

    /* ================= SHIFT REFERENCE ================= */
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "shift",
    },
    expected_check_in: {
      type: Date,
    },
    expected_check_out: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

/* ---- One attendance record per employee per day ---- */
attendance_schema.index(
  { employee: 1, attendance_date: 1 },
  { unique: true },
);

const attendance_model = mongoose.model("attendance", attendance_schema);

export default attendance_model;