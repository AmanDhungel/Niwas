import lead_model from "../models/lead.model.js";
import board_model from "../models/board/board.model.js";
import jwt from "jsonwebtoken";
import user_model from "../models/user.model.js";
import {
  upload_file_to_s3,
  delete_file_from_s3,
  build_s3_key,
  clear_temp_files,
} from "../utils/s3.util.js";

const isEmptyValue = (value) => {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};

const sanitizePayload = (payload) => {
  const cleaned = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!isEmptyValue(value)) cleaned[key] = value;
  }
  return cleaned;
};

/* ================= GET LEADS ================= */
export const handle_get_leads = async (req, res) => {
  try {
    const leads = await lead_model.find().populate("company").populate("owner").populate("contact");

    return res.status(200).json({
      status: "success",
      message: "Leads fetched successfully",
      data: leads,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching leads",
      error: error.message,
    });
  }
};

/* ================= GET LEAD ================= */
export const handle_get_lead = async (req, res) => {
  try {
    const { lead_id } = req.params;

    const lead = await lead_model
      .findById(lead_id)
      .populate("company")
      .populate("owner")
      .populate("contact")
      .populate({
        path: "activity_log.performed_by",
        model: "user",
      });

    if (!lead) {
      return res.status(404).json({
        status: "error",
        message: "Lead not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Lead fetched successfully",
      data: lead,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching lead",
      error: error.message,
    });
  }
};

/* ================= ADD LEAD ================= */
export const handle_add_lead = async (req, res) => {
  try {
    // const { user_token } = req.cookies;
    // const { user_id } = jwt.verify(user_token, process.env.JWT_SECRET);

    // const user = await user_model.findOne({ _id: user_id, user_type: "admin" });
    // if (!user) {
    //   return res.status(401).json({
    //     status: "error",
    //     message: "You are not authorized to perform this action.",
    //     error: "Unauthorized",
    //   });
    // }

    const user_id = req.user_id;

    const {
      name,
      pipeline,
      company,
      contact,
      value,
      currency,
      phone,
      email,
      industry,
      source,
      owner,
      tags,
      status,
      description,
    } = req.body;

    const rawPayload = {
      name,
      company,
      contact,
      value,
      currency,
      phone,
      email,
      industry,
      source,
      owner,
      status,
      description,
      activity_log: [
        {
          entity: "lead",
          action: "created",
          performed_by: user_id,
          performed_at: new Date(),
        },
      ],
      ...(pipeline && { pipeline: JSON.parse(pipeline) }),
      ...(tags && { tags: JSON.parse(tags) }),
    };

    const payload = sanitizePayload(rawPayload);

    const { domain_workspace, vendor_workspace, board, tasklist } =
      payload.pipeline || {};

    const board_db = await board_model.findOne({
      _id: board,
      workspace: domain_workspace,
      vendor: vendor_workspace,
    });

    const tasklist_db = board_db?.task_lists?.find(
      (t) => t._id.toString() === tasklist?.toString(),
    );

    if (board_db) {
      if (tasklist_db) {
        tasklist_db.tasks.push({
          title: payload.name,
          description:
            (payload.description || "") +
            " Tags: " +
            (payload.tags?.join(" ") || ""),
          category: "crm",
          companies: payload.company ? [payload.company] : [],
          contacts: payload.owner ? [payload.owner] : [],
          custom_fields: [
            {
              field_name: "Lead Value",
              field_type: "number",
              field_value: payload.value || 0,
            },
            {
              field_name: "Currency",
              field_type: "text",
              field_value: payload.currency || "",
            },
            {
              field_name: "Phone",
              field_type: "text",
              field_value: payload.phone || "",
            },
            {
              field_name: "Email",
              field_type: "text",
              field_value: payload.email || "",
            },
            {
              field_name: "Industry",
              field_type: "text",
              field_value: payload.industry || "",
            },
            {
              field_name: "Source",
              field_type: "text",
              field_value: payload.source || "",
            },
            {
              field_name: "Status",
              field_type: "text",
              field_value: payload.status || "",
            },
          ],
          origin: "lead",
          lead: null, // will be updated after lead is created to avoid circular reference
        });

        await board_db.save();
      }
    }

    const new_lead = await lead_model.create(payload);

    // Update the board with the new lead ID to maintain reference
    if (board_db && tasklist_db) {
      const task = tasklist_db.tasks.find(
        (t) => t.origin === "lead" && t.title === payload.name,
      );
      if (task) {
        task.lead = new_lead._id;
        await board_db.save();
      }
    }

    return res.status(201).json({
      status: "success",
      message: "Lead added successfully",
      data: new_lead,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding lead",
      error: error.message,
    });
  }
};

/* ================= EDIT LEAD ================= */
export const handle_edit_lead = async (req, res) => {
  try {
    const { lead_id } = req.params;

    const {
      name,
      pipeline,
      company,
      contact,
      value,
      currency,
      phone,
      email,
      industry,
      source,
      owner,
      tags,
      status,
      description,
    } = req.body;

    const rawPayload = {
      name,
      company,
      contact,
      value,
      currency,
      phone,
      email,
      industry,
      source,
      owner,
      status,
      description,
      ...(pipeline && { pipeline: JSON.parse(pipeline) }),
      ...(tags && { tags: JSON.parse(tags) }),
    };

    const payload = sanitizePayload(rawPayload);
    const updated_lead = await lead_model.findByIdAndUpdate(lead_id, payload, {
      new: true,
    });

    if (!updated_lead) {
      return res.status(404).json({
        status: "error",
        message: "Lead not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Lead updated successfully",
      data: updated_lead,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating lead",
      error: error.message,
    });
  }
};

/* ================= DELETE LEAD ================= */
export const handle_delete_lead = async (req, res) => {
  try {
    const { lead_id } = req.params;
    const deleted_lead = await lead_model.findByIdAndDelete(lead_id);

    if (!deleted_lead) {
      return res.status(404).json({
        status: "error",
        message: "Lead not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Lead deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting lead",
      error: error.message,
    });
  }
};

/* ================= ADD NOTE TO LEAD ================= */
export const handle_add_note_to_lead = async (req, res) => {
  try {
    const { user_token } = req.cookies;
    const { user_id } = jwt.verify(user_token, process.env.JWT_SECRET);

    const user = await user_model.findOne({ _id: user_id, user_type: "admin" });
    if (!user) {
      clear_temp_files(req.files);
      return res.status(401).json({
        status: "error",
        message: "You are not authorized to perform this action.",
        error: "Unauthorized",
      });
    }

    const { lead_id } = req.params;

    const lead = await lead_model.findById(lead_id);
    if (!lead) {
      clear_temp_files(req.files);
      return res.status(404).json({
        status: "error",
        message: "Lead not found",
      });
    }

    const { title, note } = req.body;

    lead.activity_log.push({
      entity: "note",
      action: "created",
      performed_by: user_id,
      performed_at: new Date(),
    });

    lead.notes.push({
      title: title?.trim() || "",
      note: note?.trim() || "",
      attachments: [],
    });

    await lead.save();

    const created_note = lead.notes[lead.notes.length - 1];
    const attachment_files = req.files?.attachments || [];

    if (attachment_files.length) {
      for (const file of attachment_files) {
        const key = build_s3_key(
          "lead",
          lead._id.toString(),
          `note/${created_note._id.toString()}`,
          file.filename,
        );
        const uploaded = await upload_file_to_s3(file, key);
        created_note.attachments.push({
          file: uploaded.url,
          key: uploaded.key,
        });
      }
      await lead.save();
    }

    return res.status(201).json({
      status: "success",
      message: "Note added successfully",
      data: created_note,
    });
  } catch (error) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding note",
      error: error.message,
    });
  }
};

/* ================= EDIT NOTE ON LEAD ================= */
export const handle_edit_note_on_lead = async (req, res) => {
  try {
    const { lead_id, note_id } = req.params;

    const lead = await lead_model.findById(lead_id);
    if (!lead) {
      clear_temp_files(req.files);
      return res.status(404).json({
        status: "error",
        message: "Lead not found",
      });
    }

    const note = lead.notes.id(note_id);
    if (!note) {
      clear_temp_files(req.files);
      return res.status(404).json({
        status: "error",
        message: "Note not found",
      });
    }

    const { title, note: note_text, existing_attachments } = req.body;

    if (title !== undefined) note.title = title.trim();
    if (note_text !== undefined) note.note = note_text.trim();

    /* -------- Remove deleted attachments from S3 -------- */
    if (existing_attachments) {
      const parsed_existing = JSON.parse(existing_attachments);

      const removed = (note.attachments || []).filter(
        (a) => !parsed_existing.includes(a.file),
      );
      for (const attachment of removed) {
        await delete_file_from_s3(attachment.key);
      }

      note.attachments = (note.attachments || []).filter((a) =>
        parsed_existing.includes(a.file),
      );
    }

    /* -------- Upload new attachments -------- */
    const attachment_files = req.files?.attachments || [];

    if (attachment_files.length) {
      for (const file of attachment_files) {
        const key = build_s3_key(
          "lead",
          lead._id.toString(),
          `note/${note._id.toString()}`,
          file.filename,
        );
        const uploaded = await upload_file_to_s3(file, key);
        note.attachments.push({ file: uploaded.url, key: uploaded.key });
      }
    }

    await lead.save();

    return res.status(200).json({
      status: "success",
      message: "Note updated successfully",
      data: note,
    });
  } catch (error) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating note",
      error: error.message,
    });
  }
};

/* ================= DELETE NOTE FROM LEAD ================= */
export const handle_delete_note_from_lead = async (req, res) => {
  try {
    const { lead_id, note_id } = req.params;

    const lead = await lead_model.findById(lead_id);
    if (!lead) {
      return res.status(404).json({
        status: "error",
        message: "Lead not found",
      });
    }

    const note = lead.notes.id(note_id);
    if (!note) {
      return res.status(404).json({
        status: "error",
        message: "Note not found",
      });
    }

    for (const attachment of note.attachments || []) {
      await delete_file_from_s3(attachment.key);
    }

    lead.notes = lead.notes.filter((n) => n._id.toString() !== note_id);
    await lead.save();

    return res.status(200).json({
      status: "success",
      message: "Note deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting note",
      error: error.message,
    });
  }
};

/* ================= ADD CALL LOG TO LEAD ================= */
export const handle_add_call_log_to_lead = async (req, res) => {
  try {
    const { user_token } = req.cookies;
    const { user_id } = jwt.verify(user_token, process.env.JWT_SECRET);

    const user = await user_model.findOne({ _id: user_id, user_type: "admin" });
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "You are not authorized to perform this action.",
        error: "Unauthorized",
      });
    }

    const { lead_id } = req.params;

    const lead = await lead_model.findById(lead_id);
    if (!lead) {
      return res.status(404).json({
        status: "error",
        message: "Lead not found",
      });
    }

    const { status, follow_up_date, note, create_follow_up_task } = req.body;

    lead.activity_log.push({
      entity: "call_log",
      action: "created",
      performed_by: user_id,
      performed_at: new Date(),
    });

    lead.calls.push({ status, follow_up_date, note, create_follow_up_task });
    await lead.save();

    return res.status(201).json({
      status: "success",
      message: "Call log added successfully",
      data: lead.calls[lead.calls.length - 1],
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding call log",
      error: error.message,
    });
  }
};

/* ================= EDIT CALL LOG ON LEAD ================= */
export const handle_edit_call_log_on_lead = async (req, res) => {
  try {
    const { lead_id, call_log_id } = req.params;

    const lead = await lead_model.findById(lead_id);
    if (!lead) {
      return res.status(404).json({
        status: "error",
        message: "Lead not found",
      });
    }

    const call_log = lead.calls.id(call_log_id);
    if (!call_log) {
      return res.status(404).json({
        status: "error",
        message: "Call log not found",
      });
    }

    const { status, follow_up_date, note, create_follow_up_task } = req.body;

    if (status !== undefined) call_log.status = status;
    if (follow_up_date !== undefined) call_log.follow_up_date = follow_up_date;
    if (note !== undefined) call_log.note = note;
    if (create_follow_up_task !== undefined)
      call_log.create_follow_up_task = create_follow_up_task;

    await lead.save();

    return res.status(200).json({
      status: "success",
      message: "Call log updated successfully",
      data: call_log,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating call log",
      error: error.message,
    });
  }
};

/* ================= DELETE CALL LOG FROM LEAD ================= */
export const handle_delete_call_log_from_lead = async (req, res) => {
  try {
    const { lead_id, call_log_id } = req.params;

    const lead = await lead_model.findById(lead_id);
    if (!lead) {
      return res.status(404).json({
        status: "error",
        message: "Lead not found",
      });
    }

    lead.calls = lead.calls.filter((c) => c._id.toString() !== call_log_id);
    await lead.save();

    return res.status(200).json({
      status: "success",
      message: "Call log deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting call log",
      error: error.message,
    });
  }
};
