// attendance.controller.js
import employee_model from "../../../models/employee.model.js";
import attendance_model from "../../../models/hrm/attendance/attendance.model.js";
import user_model from "../../../models/user.model.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const diff_minutes = (start, end) =>
  Math.round((new Date(end) - new Date(start)) / 60000);

const today_string = () => new Date().toISOString().split("T")[0];

/* ================= HELPER: Auth from cookie ================= */
const get_user_from_cookie = async (req) => {
  const { user_token } = req.cookies;
  const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
  const user_id = verify_token.user_id;
  const user = await user_model.findById(user_id);
  return { user, user_id };
};

/* ================= GET ATTENDANCES OF AN EMPLOYEE ================= */
export const handle_get_employee_attendances = async (req, res) => {
  try {
    const { user, user_id } = await get_user_from_cookie(req);
    if (!user) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const attendances = await attendance_model
      .find({ employee: new mongoose.Types.ObjectId(user_id) })
      .populate("employee")
      .populate("shift")
      .sort({ attendance_date: -1 });

    return res.status(200).json({
      status: "success",
      message: "Employee attendances fetched successfully",
      data: attendances,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching employee attendances",
      error: error.message,
    });
  }
};

/* ================= GET ATTENDANCE STATS OF AN EMPLOYEE ================= */
export const handle_get_employee_attendance_stats = async (req, res) => {
  try {
    const { user, user_id } = await get_user_from_cookie(req);
    if (!user) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const employee_oid = new mongoose.Types.ObjectId(user_id);

    const now = new Date();
    const today = today_string();

    const start_of_week = new Date(now);
    start_of_week.setDate(now.getDate() - now.getDay());
    start_of_week.setHours(0, 0, 0, 0);

    const start_of_month = new Date(now.getFullYear(), now.getMonth(), 1);
    const yesterday_str = new Date(now - 86400000).toISOString().split("T")[0];
    const last_week_start = new Date(start_of_week);
    last_week_start.setDate(last_week_start.getDate() - 7);
    const last_week_end = new Date(start_of_week);
    const last_month_start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last_month_end = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      today_record,
      week_records,
      month_records,
      yesterday_record,
      last_week_records,
      last_month_records,
    ] = await Promise.all([
      attendance_model.findOne({
        employee: employee_oid,
        attendance_date: today,
      }),
      attendance_model.find({
        employee: employee_oid,
        attendance_date: {
          $gte: start_of_week.toISOString().split("T")[0],
          $lte: today,
        },
      }),
      attendance_model.find({
        employee: employee_oid,
        attendance_date: {
          $gte: start_of_month.toISOString().split("T")[0],
          $lte: today,
        },
      }),
      attendance_model.findOne({
        employee: employee_oid,
        attendance_date: yesterday_str,
      }),
      attendance_model.find({
        employee: employee_oid,
        attendance_date: {
          $gte: last_week_start.toISOString().split("T")[0],
          $lt: last_week_end.toISOString().split("T")[0],
        },
      }),
      attendance_model.find({
        employee: employee_oid,
        attendance_date: {
          $gte: last_month_start.toISOString().split("T")[0],
          $lt: last_month_end.toISOString().split("T")[0],
        },
      }),
    ]);

    const sum = (records, field) =>
      records.reduce((acc, r) => acc + (r[field] || 0), 0);
    const to_hrs = (minutes) => parseFloat((minutes / 60).toFixed(2));
    const pct = (curr, prev) =>
      prev > 0 ? parseFloat((((curr - prev) / prev) * 100).toFixed(1)) : null;

    /* -------- Live working minutes if still punched in -------- */
    let live_working_minutes = today_record?.total_working_minutes || 0;

    if (today_record?.check_in && !today_record?.check_out) {
      const elapsed = diff_minutes(today_record.check_in, now);
      const breaks = today_record.break_minutes || 0;
      const ongoing_break =
        today_record.break_start && !today_record.break_end
          ? diff_minutes(today_record.break_start, now)
          : 0;
      live_working_minutes = Math.max(0, elapsed - breaks - ongoing_break);
    }

    const total_hours_today = to_hrs(live_working_minutes);
    const yesterday_hours = to_hrs(
      yesterday_record?.total_working_minutes || 0,
    );
    const total_hours_week = to_hrs(sum(week_records, "total_working_minutes"));
    const last_week_hours = to_hrs(
      sum(last_week_records, "total_working_minutes"),
    );
    const total_hours_month = to_hrs(
      sum(month_records, "total_working_minutes"),
    );
    const last_month_hours = to_hrs(
      sum(last_month_records, "total_working_minutes"),
    );
    const overtime_hours_month = to_hrs(sum(month_records, "overtime_minutes"));
    const last_month_overtime_hours = to_hrs(
      sum(last_month_records, "overtime_minutes"),
    );

    const is_on_break = !!today_record?.break_start && !today_record?.break_end;
    const is_punched_in = !!today_record?.check_in;
    const is_punched_out = !!today_record?.check_out;

    return res.status(200).json({
      status: "success",
      message: "Attendance stats fetched successfully",
      data: {
        total_hours_today: {
          value: total_hours_today,
          vs_yesterday_pct: pct(total_hours_today, yesterday_hours),
        },
        total_hours_week: {
          value: total_hours_week,
          vs_last_week_pct: pct(total_hours_week, last_week_hours),
        },
        total_hours_month: {
          value: total_hours_month,
          vs_last_month_pct: pct(total_hours_month, last_month_hours),
        },
        overtime_hours_month: {
          value: overtime_hours_month,
          vs_last_month_pct: pct(
            overtime_hours_month,
            last_month_overtime_hours,
          ),
        },
        today_breakdown: {
          total_working_minutes: live_working_minutes,
          productive_minutes: live_working_minutes,
          break_minutes: today_record?.break_minutes || 0,
          overtime_minutes: today_record?.overtime_minutes || 0,
        },
        punch_state: {
          is_punched_in,
          is_punched_out,
          is_on_break,
          check_in: today_record?.check_in || null,
          check_out: today_record?.check_out || null,
          break_start: today_record?.break_start || null,
          break_end: today_record?.break_end || null,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching attendance stats",
      error: error.message,
    });
  }
};

/* ================= PUNCH IN ================= */
export const handle_punch_in = async (req, res) => {
  try {
    const { user, user_id } = await get_user_from_cookie(req);
    if (!user) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const { check_in_note } = req.body;
    const date = today_string();

    const existing = await attendance_model.findOne({
      employee: new mongoose.Types.ObjectId(user_id),
      attendance_date: date,
    });

    if (existing) {
      return res.status(400).json({
        status: "error",
        message: "You have already punched in today",
      });
    }

    const attendance = await attendance_model.create({
      employee: new mongoose.Types.ObjectId(user_id),
      attendance_type: "regular",
      attendance_date: date,
      check_in: new Date(),
      check_in_note: check_in_note || undefined,
      attendance_status: "present",
      is_late: false,
      late_minutes: 0,
      break_minutes: 0,
      break_start: null,
      break_end: null,
    });

    return res.status(201).json({
      status: "success",
      message: "Punched in successfully",
      data: attendance,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while punching in",
      error: error.message,
    });
  }
};

/* ================= PUNCH OUT ================= */
export const handle_punch_out = async (req, res) => {
  try {
    const { user, user_id } = await get_user_from_cookie(req);
    if (!user) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const { check_out_note } = req.body;
    const date = today_string();

    const attendance = await attendance_model.findOne({
      employee: new mongoose.Types.ObjectId(user_id),
      attendance_date: date,
    });

    if (!attendance) {
      return res.status(404).json({
        status: "error",
        message: "No punch-in found for today. Please punch in first.",
      });
    }

    if (attendance.check_out) {
      return res.status(400).json({
        status: "error",
        message: "You have already punched out today",
      });
    }

    if (attendance.break_start && !attendance.break_end) {
      return res.status(400).json({
        status: "error",
        message: "Please end your break before punching out",
      });
    }

    const now = new Date();
    const break_minutes = attendance.break_minutes || 0;
    const total_working_minutes = diff_minutes(attendance.check_in, now);
    const productive_minutes = Math.max(
      0,
      total_working_minutes - break_minutes,
    );

    let overtime_minutes = 0;
    if (attendance.expected_check_out) {
      const expected_out = new Date(attendance.expected_check_out);
      if (now > expected_out) {
        overtime_minutes = diff_minutes(expected_out, now);
      }
    }

    const updated_attendance = await attendance_model.findByIdAndUpdate(
      attendance._id,
      {
        $set: {
          check_out: now,
          check_out_note: check_out_note || undefined,
          total_working_minutes,
          productive_minutes,
          overtime_minutes,
        },
      },
      { new: true },
    );

    return res.status(200).json({
      status: "success",
      message: "Punched out successfully",
      data: updated_attendance,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while punching out",
      error: error.message,
    });
  }
};

/* ================= START BREAK ================= */
export const handle_start_break = async (req, res) => {
  try {
    const { user, user_id } = await get_user_from_cookie(req);
    if (!user) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const date = today_string();
    const attendance = await attendance_model.findOne({
      employee: new mongoose.Types.ObjectId(user_id),
      attendance_date: date,
    });

    if (!attendance) {
      return res.status(404).json({
        status: "error",
        message: "No punch-in found for today. Please punch in first.",
      });
    }

    if (attendance.check_out) {
      return res.status(400).json({
        status: "error",
        message: "Cannot start break after punching out",
      });
    }

    if (attendance.break_start && !attendance.break_end) {
      return res.status(400).json({
        status: "error",
        message: "You are already on a break",
      });
    }

    const updated_attendance = await attendance_model.findByIdAndUpdate(
      attendance._id,
      { $set: { break_start: new Date(), break_end: null } },
      { new: true },
    );

    return res.status(200).json({
      status: "success",
      message: "Break started successfully",
      data: updated_attendance,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while starting break",
      error: error.message,
    });
  }
};

/* ================= END BREAK ================= */
export const handle_end_break = async (req, res) => {
  try {
    const { user, user_id } = await get_user_from_cookie(req);
    if (!user) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const date = today_string();
    const attendance = await attendance_model.findOne({
      employee: new mongoose.Types.ObjectId(user_id),
      attendance_date: date,
    });

    if (!attendance) {
      return res.status(404).json({
        status: "error",
        message: "No punch-in found for today.",
      });
    }

    if (!attendance.break_start) {
      return res.status(400).json({
        status: "error",
        message: "No active break found",
      });
    }

    if (attendance.break_end) {
      return res.status(400).json({
        status: "error",
        message: "Break has already ended",
      });
    }

    const now = new Date();
    const this_break_minutes = diff_minutes(attendance.break_start, now);
    const total_break_minutes =
      (attendance.break_minutes || 0) + this_break_minutes;

    const updated_attendance = await attendance_model.findByIdAndUpdate(
      attendance._id,
      { $set: { break_end: now, break_minutes: total_break_minutes } },
      { new: true },
    );

    return res.status(200).json({
      status: "success",
      message: "Break ended successfully",
      data: updated_attendance,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while ending break",
      error: error.message,
    });
  }
};

export const handle_get_todays_attendance_admin = async (req, res) => {
  try {
    const today = today_string();
    const present_attendances = await attendance_model
      .find({ attendance_date: today })
      .populate("employee")
      .populate("shift")
      .sort({ createdAt: -1 });

    const present_employee_ids = present_attendances.map((a) =>
      a.employee._id.toString(),
    );
    const absent_employees = await employee_model
      .find({
        _id: { $nin: present_employee_ids },
      })
      .populate("company");

    return res.status(200).json({
      status: "success",
      message: "Today's attendances fetched successfully",
      data: {
        present_attendances,
        absent_employees,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching today's attendances",
      error: error.message,
    });
  }
};
