import deal_model from "../models/deal.model.js";
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

/* ================= GET DEALS ================= */
export const handle_get_deals = async (req, res) => {
  try {
    const deals = await deal_model
      .find()
      .populate("contacts")
      .populate("assignee")
      .populate({ path: "pipeline.board", model: "board" })
      .populate({ path: "pipeline.domain_workspace", model: "domain_workspace" })
      .populate({ path: "pipeline.vendor_workspace", model: "vendor_workspace" });

    const formattedDeals = deals.map(deal => {
      const dealObj = deal.toObject(); // or use .lean() on the query
      if (dealObj.pipeline?.board && dealObj.pipeline?.tasklist) {
        const matchedTaskList = dealObj.pipeline.board.task_lists.find(
          (tl) => tl._id.toString() === dealObj.pipeline.tasklist.toString()
        );

        dealObj.pipeline.tasklist_data = matchedTaskList || null;
      }
      return dealObj;
    });

    return res.status(200).json({
      status: "success",
      message: "Deals fetched successfully",
      data: formattedDeals,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching deals",
      error: error.message,
    });
  }
};

/* ================= GET DEAL ================= */
export const handle_get_deal = async (req, res) => {
  try {
    const { deal_id } = req.params;

    const deal = await deal_model
      .findById(deal_id)
      .populate("contacts")
      .populate({ path: "assignee", poulate: { path: "company", model: "company" } })
      .populate({ path: "pipeline.board", model: "board" })
      .populate({ path: "pipeline.domain_workspace", model: "domain_workspace" })
      .populate({ path: "pipeline.vendor_workspace", model: "vendor_workspace" })
      .populate({
        path: "activity_log.performed_by",
        model: "user",
      });

    const dealObj = deal.toObject();

    if (dealObj.pipeline?.board?.task_lists && dealObj.pipeline?.tasklist) {
      const matchedTaskList = dealObj.pipeline.board.task_lists.find(
        (tl) => tl._id.toString() === dealObj.pipeline.tasklist.toString()
      );

      // Overwrite pipeline.tasklist directly (or use pipeline.tasklist_data)
      dealObj.pipeline.tasklist = matchedTaskList || null;
    }

    if (!deal) {
      return res.status(404).json({
        status: "error",
        message: "Deal not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Deal fetched successfully",
      data: dealObj,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching deal",
      error: error.message,
    });
  }
};

/* ================= ADD DEAL ================= */
export const handle_add_deal = async (req, res) => {
  try {
    // const { user_token } = req.cookies;
    // const { user_id }    = jwt.verify(user_token, process.env.JWT_SECRET);

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
      status,
      value,
      currency,
      contacts,
      due_date,
      expected_close_date,
      assignee,
      tags,
      followup_date,
      source,
      priority,
      description,
    } = req.body;

    const rawPayload = {
      name,
      status,
      value,
      currency,
      due_date,
      expected_close_date,
      followup_date,
      source,
      priority,
      description,
      assignee,
      activity_log: [
        {
          entity: "deal",
          action: "created",
          performed_by: user_id,
          performed_at: new Date(),
        },
      ],
      ...(pipeline && { pipeline: JSON.parse(pipeline) }),
      ...(contacts && { contacts: JSON.parse(contacts) }),
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
      (tl) => tl._id.toString() === tasklist?.toString(),
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
          contacts: payload.contacts || [],
          assignees: payload.assignee ? [payload.assignee] : [],
          custom_fields: [
            {
              field_name: "Deal Value",
              field_type: "number",
              field_value: payload.value || 0,
            },
            {
              field_name: "Status",
              field_type: "text",
              field_value: payload.status || "",
            },
            {
              field_name: "Currency",
              field_type: "text",
              field_value: payload.currency || "",
            },
            {
              field_name: "Due Date",
              field_type: "date",
              field_value: payload.due_date || null,
            },
            {
              field_name: "Expected Close Date",
              field_type: "date",
              field_value: payload.expected_close_date || null,
            },
            {
              field_name: "Followup Date",
              field_type: "date",
              field_value: payload.followup_date || null,
            },
            {
              field_name: "Source",
              field_type: "text",
              field_value: payload.source || "",
            },
            {
              field_name: "Priority",
              field_type: "text",
              field_value: payload.priority || "",
            },
          ],
          origin: "deal",
          deal: null,
        });

        await board_db.save();
      }
    }

    const new_deal = await deal_model.create(payload);

    if (board_db && tasklist_db) {
      const task = tasklist_db.tasks.find(
        (t) => t.origin === "deal" && t.title === payload.name,
      );
      if (task) {
        task.deal = new_deal._id;
        await board_db.save();
      }
    }

    return res.status(201).json({
      status: "success",
      message: "Deal added successfully",
      data: new_deal,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding deal",
      error: error.message,
    });
  }
};

/* ================= EDIT DEAL ================= */
export const handle_edit_deal = async (req, res) => {
  try {
    const { deal_id } = req.params;

    const {
      name,
      pipeline,
      status,
      value,
      currency,
      contacts,
      due_date,
      expected_close_date,
      assignee,
      tags,
      followup_date,
      source,
      priority,
      description,
    } = req.body;

    const rawPayload = {
      name,
      status,
      value,
      currency,
      due_date,
      expected_close_date,
      followup_date,
      source,
      priority,
      description,
      assignee,
      ...(pipeline && { pipeline: JSON.parse(pipeline) }),
      ...(contacts && { contacts: JSON.parse(contacts) }),
      ...(tags && { tags: JSON.parse(tags) }),
    };

    const payload = sanitizePayload(rawPayload);
    const updated_deal = await deal_model.findByIdAndUpdate(deal_id, payload, {
      new: true,
    });

    if (!updated_deal) {
      return res.status(404).json({
        status: "error",
        message: "Deal not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Deal updated successfully",
      data: updated_deal,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating deal",
      error: error.message,
    });
  }
};

/* ================= DELETE DEAL ================= */
export const handle_delete_deal = async (req, res) => {
  try {
    const { deal_id } = req.params;
    const deleted_deal = await deal_model.findByIdAndDelete(deal_id);

    if (!deleted_deal) {
      return res.status(404).json({
        status: "error",
        message: "Deal not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Deal deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting deal",
      error: error.message,
    });
  }
};

/* ================= ADD NOTE TO DEAL ================= */
export const handle_add_note_to_deal = async (req, res) => {
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

    const { deal_id } = req.params;

    const deal = await deal_model.findById(deal_id);
    if (!deal) {
      clear_temp_files(req.files);
      return res.status(404).json({
        status: "error",
        message: "Deal not found",
      });
    }

    const { title, note } = req.body;

    deal.activity_log.push({
      entity: "note",
      action: "created",
      performed_by: user_id,
      performed_at: new Date(),
    });

    deal.notes.push({
      title: title?.trim() || "",
      note: note?.trim() || "",
      attachments: [],
    });

    await deal.save();

    const created_note = deal.notes[deal.notes.length - 1];
    const attachment_files = req.files?.attachments || [];

    if (attachment_files.length) {
      for (const file of attachment_files) {
        const key = build_s3_key(
          "deal",
          deal._id.toString(),
          `note/${created_note._id.toString()}`,
          file.filename,
        );
        const uploaded = await upload_file_to_s3(file, key);
        created_note.attachments.push({
          file: uploaded.url,
          key: uploaded.key,
        });
      }
      await deal.save();
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

/* ================= EDIT NOTE ON DEAL ================= */
export const handle_edit_note_on_deal = async (req, res) => {
  try {
    const { deal_id, note_id } = req.params;

    const deal = await deal_model.findById(deal_id);
    if (!deal) {
      clear_temp_files(req.files);
      return res.status(404).json({
        status: "error",
        message: "Deal not found",
      });
    }

    const note = deal.notes.id(note_id);
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
          "deal",
          deal._id.toString(),
          `note/${note._id.toString()}`,
          file.filename,
        );
        const uploaded = await upload_file_to_s3(file, key);
        note.attachments.push({ file: uploaded.url, key: uploaded.key });
      }
    }

    await deal.save();

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

/* ================= DELETE NOTE FROM DEAL ================= */
export const handle_delete_note_from_deal = async (req, res) => {
  try {
    const { deal_id, note_id } = req.params;

    const deal = await deal_model.findById(deal_id);
    if (!deal) {
      return res.status(404).json({
        status: "error",
        message: "Deal not found",
      });
    }

    const note = deal.notes.id(note_id);
    if (!note) {
      return res.status(404).json({
        status: "error",
        message: "Note not found",
      });
    }

    for (const attachment of note.attachments || []) {
      await delete_file_from_s3(attachment.key);
    }

    deal.notes = deal.notes.filter((n) => n._id.toString() !== note_id);
    await deal.save();

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

/* ================= ADD CALL LOG TO DEAL ================= */
export const handle_add_call_log_to_deal = async (req, res) => {
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

    const { deal_id } = req.params;

    const deal = await deal_model.findById(deal_id);
    if (!deal) {
      return res.status(404).json({
        status: "error",
        message: "Deal not found",
      });
    }

    const { status, follow_up_date, note, create_follow_up_task } = req.body;

    deal.activity_log.push({
      entity: "call_log",
      action: "created",
      performed_by: user_id,
      performed_at: new Date(),
    });

    deal.calls.push({ status, follow_up_date, note, create_follow_up_task });
    await deal.save();

    return res.status(201).json({
      status: "success",
      message: "Call log added successfully",
      data: deal.calls[deal.calls.length - 1],
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding call log",
      error: error.message,
    });
  }
};

/* ================= EDIT CALL LOG ON DEAL ================= */
export const handle_edit_call_log_on_deal = async (req, res) => {
  try {
    const { deal_id, call_log_id } = req.params;

    const deal = await deal_model.findById(deal_id);
    if (!deal) {
      return res.status(404).json({
        status: "error",
        message: "Deal not found",
      });
    }

    const call_log = deal.calls.id(call_log_id);
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

    await deal.save();

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

/* ================= DELETE CALL LOG FROM DEAL ================= */
export const handle_delete_call_log_from_deal = async (req, res) => {
  try {
    const { deal_id, call_log_id } = req.params;

    const deal = await deal_model.findById(deal_id);
    if (!deal) {
      return res.status(404).json({
        status: "error",
        message: "Deal not found",
      });
    }

    deal.calls = deal.calls.filter((c) => c._id.toString() !== call_log_id);
    await deal.save();

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
