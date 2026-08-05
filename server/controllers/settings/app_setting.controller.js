import jwt from "jsonwebtoken";
import user_model from "../../models/user.model.js";
import app_setting_model from "../../models/settings/app_setting.model.js";
import {
  build_s3_key,
  delete_file_from_s3,
  upload_file_to_s3,
  clear_temp_files,
} from "../../utils/s3.util.js";

/* ================= GET SALARY SETTINGS ================= */
export const handle_get_salary_settings = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    let app_setting = await app_setting_model.findOne({ user_id });

    if (!app_setting) {
      app_setting = await app_setting_model.create({ user_id });
    }

    return res.status(200).json({
      status: "success",
      message: "Salary settings fetched successfully",
      data: app_setting.salary_settings || {},
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching salary settings",
      error: error.message,
    });
  }
};

/* ================= UPDATE SALARY SETTINGS ================= */
export const handle_update_salary_settings = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    const {
      da_percentage,
      hra_percentage,
      provident_fund,
      esi,
      tds_annual_salary,
    } = req.body;

    const update = {};

    if (da_percentage !== undefined)
      update["salary_settings.da_percentage"] = Number(da_percentage);

    if (hra_percentage !== undefined)
      update["salary_settings.hra_percentage"] = Number(hra_percentage);

    /* -------- provident_fund -------- */
    if (provident_fund !== undefined) {
      const parsed =
        typeof provident_fund === "string"
          ? JSON.parse(provident_fund)
          : provident_fund;

      if (parsed?.employee_share_percentage !== undefined)
        update["salary_settings.provident_fund.employee_share_percentage"] =
          Number(parsed.employee_share_percentage);

      if (parsed?.organization_share_percentage !== undefined)
        update["salary_settings.provident_fund.organization_share_percentage"] =
          Number(parsed.organization_share_percentage);
    }

    /* -------- esi -------- */
    if (esi !== undefined) {
      const parsed = typeof esi === "string" ? JSON.parse(esi) : esi;

      if (parsed?.employee_share_percentage !== undefined)
        update["salary_settings.esi.employee_share_percentage"] = Number(
          parsed.employee_share_percentage,
        );

      if (parsed?.organization_share_percentage !== undefined)
        update["salary_settings.esi.organization_share_percentage"] = Number(
          parsed.organization_share_percentage,
        );
    }

    /* -------- tds_annual_salary -------- */
    if (tds_annual_salary !== undefined) {
      const parsed =
        typeof tds_annual_salary === "string"
          ? JSON.parse(tds_annual_salary)
          : tds_annual_salary;

      if (parsed?.salary_from !== undefined)
        update["salary_settings.tds_annual_salary.salary_from"] = Number(
          parsed.salary_from,
        );

      if (parsed?.salary_to !== undefined)
        update["salary_settings.tds_annual_salary.salary_to"] = Number(
          parsed.salary_to,
        );

      if (parsed?.tds_percentage !== undefined)
        update["salary_settings.tds_annual_salary.tds_percentage"] = Number(
          parsed.tds_percentage,
        );
    }

    const updated_setting = await app_setting_model.findOneAndUpdate(
      { user_id },
      { $set: update },
      { new: true, upsert: true },
    );

    return res.status(200).json({
      status: "success",
      message: "Salary settings updated successfully",
      data: updated_setting.salary_settings || {},
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating salary settings",
      error: error.message,
    });
  }
};

/* ================= GET APPROVAL SETTINGS ================= */
export const handle_get_approval_settings = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    let app_setting = await app_setting_model.findOne({ user_id });

    if (!app_setting) {
      app_setting = await app_setting_model.create({ user_id });
    }

    const populated = await app_setting_model
      .findOne({ user_id })
      .populate("approval_settings.expense_approval.approvers", "name email")
      .populate("approval_settings.leave_approval.approvers", "name email");

    return res.status(200).json({
      status: "success",
      message: "Approval settings fetched successfully",
      data: populated.approval_settings || {},
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching approval settings",
      error: error.message,
    });
  }
};

/* ================= UPDATE APPROVAL SETTINGS ================= */
export const handle_update_approval_settings = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    const { expense_approval, leave_approval, offer_approval } = req.body;

    const VALID_TYPES = ["sequence_chain", "simultaneous"];

    const parse = (val) => (typeof val === "string" ? JSON.parse(val) : val);

    /* -------- validation -------- */
    if (expense_approval !== undefined) {
      const parsed = parse(expense_approval);
      if (parsed?.type !== undefined && !VALID_TYPES.includes(parsed.type)) {
        return res.status(400).json({
          status: "error",
          message: `Invalid expense_approval.type. Allowed: ${VALID_TYPES.join(", ")}`,
        });
      }
    }

    if (leave_approval !== undefined) {
      const parsed = parse(leave_approval);
      if (parsed?.type !== undefined && !VALID_TYPES.includes(parsed.type)) {
        return res.status(400).json({
          status: "error",
          message: `Invalid leave_approval.type. Allowed: ${VALID_TYPES.join(", ")}`,
        });
      }
    }

    if (offer_approval !== undefined) {
      const parsed = parse(offer_approval);
      if (parsed?.type !== undefined && !VALID_TYPES.includes(parsed.type)) {
        return res.status(400).json({
          status: "error",
          message: `Invalid offer_approval.type. Allowed: ${VALID_TYPES.join(", ")}`,
        });
      }
    }

    const update = {};

    /* -------- expense_approval -------- */
    if (expense_approval !== undefined) {
      const parsed = parse(expense_approval);

      if (parsed?.type !== undefined)
        update["approval_settings.expense_approval.type"] = parsed.type;

      if (Array.isArray(parsed?.approvers))
        update["approval_settings.expense_approval.approvers"] =
          parsed.approvers;
    }

    /* -------- leave_approval -------- */
    if (leave_approval !== undefined) {
      const parsed = parse(leave_approval);

      if (parsed?.type !== undefined)
        update["approval_settings.leave_approval.type"] = parsed.type;

      if (Array.isArray(parsed?.approvers))
        update["approval_settings.leave_approval.approvers"] = parsed.approvers;
    }

    /* -------- offer_approval (type only — no approvers in schema) -------- */
    if (offer_approval !== undefined) {
      const parsed = parse(offer_approval);

      if (parsed?.type !== undefined)
        update["approval_settings.offer_approval.type"] = parsed.type;
    }

    const updated_setting = await app_setting_model.findOneAndUpdate(
      { user_id },
      { $set: update },
      { new: true, upsert: true },
    );

    const populated = await app_setting_model
      .findById(updated_setting._id)
      .populate("approval_settings.expense_approval.approvers", "name email")
      .populate("approval_settings.leave_approval.approvers", "name email");

    return res.status(200).json({
      status: "success",
      message: "Approval settings updated successfully",
      data: populated.approval_settings || {},
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating approval settings",
      error: error.message,
    });
  }
};

/* ================= GET INVOICE SETTINGS ================= */
export const handle_get_invoice_settings = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    let app_setting = await app_setting_model.findOne({ user_id });

    if (!app_setting) {
      app_setting = await app_setting_model.create({ user_id });
    }

    return res.status(200).json({
      status: "success",
      message: "Invoice settings fetched successfully",
      data: app_setting.invoice_settings || {},
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching invoice settings",
      error: error.message,
    });
  }
};

/* ================= UPDATE INVOICE SETTINGS ================= */
export const handle_update_invoice_settings = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    const {
      invoice_prefix,
      invoice_due_days,
      invoice_round_off,
      show_company_details,
      invoice_terms,
      existing_logo, // URL to keep — send null/empty to remove
    } = req.body;

    const VALID_ROUND_METHODS = ["up", "down", "nearest"];

    if (invoice_round_off !== undefined) {
      const parsed =
        typeof invoice_round_off === "string"
          ? JSON.parse(invoice_round_off)
          : invoice_round_off;

      if (
        parsed?.method !== undefined &&
        !VALID_ROUND_METHODS.includes(parsed.method)
      ) {
        return res.status(400).json({
          status: "error",
          message: `Invalid invoice_round_off.method. Allowed: ${VALID_ROUND_METHODS.join(", ")}`,
        });
      }
    }

    const parseBool = (val) => {
      if (typeof val === "boolean") return val;
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    };

    const update = {};

    if (invoice_prefix !== undefined)
      update["invoice_settings.invoice_prefix"] = String(invoice_prefix)
        .trim()
        .toUpperCase();

    if (invoice_due_days !== undefined)
      update["invoice_settings.invoice_due_days"] = Number(invoice_due_days);

    if (parseBool(show_company_details) !== undefined)
      update["invoice_settings.show_company_details"] =
        parseBool(show_company_details);

    if (invoice_terms !== undefined)
      update["invoice_settings.invoice_terms"] = String(invoice_terms).trim();

    /* -------- invoice_round_off -------- */
    if (invoice_round_off !== undefined) {
      const parsed =
        typeof invoice_round_off === "string"
          ? JSON.parse(invoice_round_off)
          : invoice_round_off;

      if (parseBool(parsed?.enabled) !== undefined)
        update["invoice_settings.invoice_round_off.enabled"] = parseBool(
          parsed.enabled,
        );

      if (parsed?.method !== undefined)
        update["invoice_settings.invoice_round_off.method"] = parsed.method;
    }

    /* -------- logo: delete old if removed, upload new if provided -------- */
    const app_setting = await app_setting_model.findOne({ user_id });
    const current_logo = app_setting?.invoice_settings?.logo;

    if (
      existing_logo === "" ||
      existing_logo === null ||
      existing_logo === undefined
    ) {
      // Client wants to remove the logo
      if (current_logo?.key) {
        await delete_file_from_s3(current_logo.key);
      }
      update["invoice_settings.logo"] = { key: null, url: null };
    }

    const logo_file = req.files?.logo?.[0] || req.file || null;

    if (logo_file) {
      // Delete old logo from S3 before uploading new
      if (current_logo?.key) {
        await delete_file_from_s3(current_logo.key);
      }
      const key = build_s3_key(
        "app_setting",
        user_id.toString(),
        "invoice_logo",
        logo_file.filename,
      );
      const uploaded = await upload_file_to_s3(logo_file, key);
      update["invoice_settings.logo"] = {
        key: uploaded.key,
        url: uploaded.url,
      };
      clear_temp_files({ logo: [logo_file] });
    }

    const updated_setting = await app_setting_model.findOneAndUpdate(
      { user_id },
      { $set: update },
      { new: true, upsert: true },
    );

    return res.status(200).json({
      status: "success",
      message: "Invoice settings updated successfully",
      data: updated_setting.invoice_settings || {},
    });
  } catch (error) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating invoice settings",
      error: error.message,
    });
  }
};

/* ================= GET ALL LEAVE TYPES ================= */
export const handle_get_leave_types = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    let app_setting = await app_setting_model.findOne({ user_id });

    if (!app_setting) {
      app_setting = await app_setting_model.create({ user_id });
    }

    return res.status(200).json({
      status: "success",
      message: "Leave types fetched successfully",
      data: app_setting.leave_types || [],
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching leave types",
      error: error.message,
    });
  }
};

/* ================= ADD LEAVE TYPE ================= */
export const handle_add_leave_type = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    const { type, days, status } = req.body;

    if (!type || type.trim() === "") {
      return res.status(400).json({
        status: "error",
        message: "Leave type name is required.",
      });
    }

    if (days === undefined || days === null) {
      return res.status(400).json({
        status: "error",
        message: "Days is required.",
      });
    }

    const VALID_STATUSES = ["active", "inactive"];
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const new_leave_type = {
      type: type.trim(),
      days: Number(days),
      ...(status && { status }),
    };

    const updated_setting = await app_setting_model.findOneAndUpdate(
      { user_id },
      { $push: { leave_types: new_leave_type } },
      { new: true, upsert: true },
    );

    const added = updated_setting.leave_types.at(-1);

    return res.status(201).json({
      status: "success",
      message: "Leave type added successfully",
      data: added,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding leave type",
      error: error.message,
    });
  }
};

/* ================= EDIT LEAVE TYPE ================= */
export const handle_edit_leave_type = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    const { leave_type_id } = req.params;
    const { type, days, status } = req.body;

    const VALID_STATUSES = ["active", "inactive"];
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const app_setting = await app_setting_model.findOne({ user_id });
    if (!app_setting) {
      return res.status(404).json({
        status: "error",
        message: "App setting not found.",
      });
    }

    const leave_type = app_setting.leave_types.id(leave_type_id);
    if (!leave_type) {
      return res.status(404).json({
        status: "error",
        message: "Leave type not found.",
      });
    }

    const update = {};

    if (type !== undefined)
      update["leave_types.$.type"] = type.trim();

    if (days !== undefined)
      update["leave_types.$.days"] = Number(days);

    if (status !== undefined)
      update["leave_types.$.status"] = status;

    const updated_setting = await app_setting_model.findOneAndUpdate(
      { user_id, "leave_types._id": leave_type_id },
      { $set: update },
      { new: true },
    );

    const updated_leave_type = updated_setting.leave_types.id(leave_type_id);

    return res.status(200).json({
      status: "success",
      message: "Leave type updated successfully",
      data: updated_leave_type,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating leave type",
      error: error.message,
    });
  }
};

/* ================= DELETE LEAVE TYPE ================= */
export const handle_delete_leave_type = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    const { leave_type_id } = req.params;

    const app_setting = await app_setting_model.findOne({ user_id });
    if (!app_setting) {
      return res.status(404).json({
        status: "error",
        message: "App setting not found.",
      });
    }

    const leave_type = app_setting.leave_types.id(leave_type_id);
    if (!leave_type) {
      return res.status(404).json({
        status: "error",
        message: "Leave type not found.",
      });
    }

    await app_setting_model.findOneAndUpdate(
      { user_id },
      { $pull: { leave_types: { _id: leave_type_id } } },
    );

    return res.status(200).json({
      status: "success",
      message: "Leave type deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting leave type",
      error: error.message,
    });
  }
};

/* ================= GET ALL CUSTOM FIELDS ================= */
export const handle_get_custom_fields = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    let app_setting = await app_setting_model.findOne({ user_id });

    if (!app_setting) {
      app_setting = await app_setting_model.create({ user_id });
    }

    const { module } = req.query;

    const custom_fields = module
      ? app_setting.custom_fields.filter((f) => f.module === module)
      : app_setting.custom_fields;

    return res.status(200).json({
      status: "success",
      message: "Custom fields fetched successfully",
      data: custom_fields,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching custom fields",
      error: error.message,
    });
  }
};

/* ================= ADD CUSTOM FIELD ================= */
export const handle_add_custom_field = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    const { module, label, type, default_value, options, required, status } =
      req.body;

    if (!module || module.trim() === "") {
      return res.status(400).json({
        status: "error",
        message: "Module is required.",
      });
    }

    if (!label || label.trim() === "") {
      return res.status(400).json({
        status: "error",
        message: "Label is required.",
      });
    }

    const VALID_TYPES = ["text", "number", "date", "dropdown"];
    if (!type || !VALID_TYPES.includes(type)) {
      return res.status(400).json({
        status: "error",
        message: `Type is required. Allowed: ${VALID_TYPES.join(", ")}`,
      });
    }

    // Dropdown must have at least one option
    if (type === "dropdown") {
      if (!Array.isArray(options) || options.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "Options are required for dropdown type.",
        });
      }
      for (const opt of options) {
        if (!opt.key || !opt.value) {
          return res.status(400).json({
            status: "error",
            message: "Each option must have a key and value.",
          });
        }
      }
    }

    const VALID_STATUSES = ["active", "inactive"];
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const new_custom_field = {
      module: module.trim(),
      label: label.trim(),
      type,
      ...(default_value !== undefined && { default_value }),
      ...(options && { options }),
      ...(required !== undefined && { required: Boolean(required) }),
      ...(status && { status }),
    };

    const updated_setting = await app_setting_model.findOneAndUpdate(
      { user_id },
      { $push: { custom_fields: new_custom_field } },
      { new: true, upsert: true },
    );

    const added = updated_setting.custom_fields.at(-1);

    return res.status(201).json({
      status: "success",
      message: "Custom field added successfully",
      data: added,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding custom field",
      error: error.message,
    });
  }
};

/* ================= EDIT CUSTOM FIELD ================= */
export const handle_edit_custom_field = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    const { custom_field_id } = req.params;
    const { module, label, type, default_value, options, required, status } =
      req.body;

    const VALID_TYPES = ["text", "number", "date", "dropdown"];
    if (type !== undefined && !VALID_TYPES.includes(type)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid type. Allowed: ${VALID_TYPES.join(", ")}`,
      });
    }

    const VALID_STATUSES = ["active", "inactive"];
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const app_setting = await app_setting_model.findOne({ user_id });
    if (!app_setting) {
      return res.status(404).json({
        status: "error",
        message: "App setting not found.",
      });
    }

    const custom_field = app_setting.custom_fields.id(custom_field_id);
    if (!custom_field) {
      return res.status(404).json({
        status: "error",
        message: "Custom field not found.",
      });
    }

    // If type is being changed to dropdown, validate options
    const resolved_type = type ?? custom_field.type;
    if (resolved_type === "dropdown") {
      const resolved_options = options ?? custom_field.options;
      if (!Array.isArray(resolved_options) || resolved_options.length === 0) {
        return res.status(400).json({
          status: "error",
          message: "Options are required for dropdown type.",
        });
      }
      for (const opt of resolved_options) {
        if (!opt.key || !opt.value) {
          return res.status(400).json({
            status: "error",
            message: "Each option must have a key and value.",
          });
        }
      }
    }

    const update = {};

    if (module !== undefined)
      update["custom_fields.$.module"] = module.trim();

    if (label !== undefined)
      update["custom_fields.$.label"] = label.trim();

    if (type !== undefined)
      update["custom_fields.$.type"] = type;

    if (default_value !== undefined)
      update["custom_fields.$.default_value"] = default_value;

    if (options !== undefined)
      update["custom_fields.$.options"] = options;

    if (required !== undefined)
      update["custom_fields.$.required"] = Boolean(required);

    if (status !== undefined)
      update["custom_fields.$.status"] = status;

    const updated_setting = await app_setting_model.findOneAndUpdate(
      { user_id, "custom_fields._id": custom_field_id },
      { $set: update },
      { new: true },
    );

    const updated_field = updated_setting.custom_fields.id(custom_field_id);

    return res.status(200).json({
      status: "success",
      message: "Custom field updated successfully",
      data: updated_field,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating custom field",
      error: error.message,
    });
  }
};

/* ================= DELETE CUSTOM FIELD ================= */
export const handle_delete_custom_field = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    const { custom_field_id } = req.params;

    const app_setting = await app_setting_model.findOne({ user_id });
    if (!app_setting) {
      return res.status(404).json({
        status: "error",
        message: "App setting not found.",
      });
    }

    const custom_field = app_setting.custom_fields.id(custom_field_id);
    if (!custom_field) {
      return res.status(404).json({
        status: "error",
        message: "Custom field not found.",
      });
    }

    await app_setting_model.findOneAndUpdate(
      { user_id },
      { $pull: { custom_fields: { _id: custom_field_id } } },
    );

    return res.status(200).json({
      status: "success",
      message: "Custom field deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting custom field",
      error: error.message,
    });
  }
};