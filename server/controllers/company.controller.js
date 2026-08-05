import company_model from "../models/company.model.js";
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

/* ================= GET COMPANIES ================= */
export const handle_get_companies = async (req, res) => {
  try {
    const companies = await company_model
      .find()
      .populate("contacts")
      .populate("owner");

    return res.status(200).json({
      status: "success",
      message: "Companies fetched successfully",
      data: companies,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching companies",
      error: error.message,
    });
  }
};

/* ================= GET COMPANY ================= */
export const handle_get_company = async (req, res) => {
  try {
    const { company_id } = req.params;

    const company = await company_model
      .findById(company_id)
      .populate("contacts")
      .populate("owner")
      .populate({
        path: "activity_log.performed_by",
        model: "user",
      });

    if (!company) {
      return res.status(404).json({
        status: "error",
        message: "Company not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Company fetched successfully",
      data: company,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching company",
      error: error.message,
    });
  }
};

/* ================= ADD COMPANY ================= */
export const handle_add_company = async (req, res) => {
  try {
    const user_id = req.user_id;

    const {
      name,
      email,
      phone,
      secondary_phone,
      website,
      rating,
      owner,
      tags,
      industry,
      source,
      currency,
      language,
      about,
      contacts,
      address,
      social_accounts,
      status,
    } = req.body;

    const rawPayload = {
      name,
      email,
      phone,
      secondary_phone,
      website,
      rating,
      owner,
      industry,
      source,
      currency,
      language,
      about,
      status,
      activity_log: [
        {
          entity: "company",
          action: "created",
          performed_by: user_id,
          performed_at: new Date(),
        },
      ],
      ...(contacts && { contacts: JSON.parse(contacts) }),
      ...(tags && { tags: JSON.parse(tags) }),
      ...(address && { address: JSON.parse(address) }),
      ...(social_accounts && { social_accounts: JSON.parse(social_accounts) }),
    };

    const payload = sanitizePayload(rawPayload);
    const new_company = await company_model.create(payload);

    if (req.file) {
      try {
        const key = build_s3_key(
          "company",
          new_company._id.toString(),
          "image",
          req.file.filename,
        );
        const uploaded = await upload_file_to_s3(req.file, key);
        new_company.image = {
          key: uploaded.key,
          url: uploaded.url,
        };
        await new_company.save();
      } catch (upload_error) {
        clear_temp_files([req.file]);
        return res.status(500).json({
          status: "error",
          message: "Company created but image upload failed.",
          error: upload_error.message,
        });
      }
    }

    return res.status(201).json({
      status: "success",
      message: "Company added successfully",
      data: new_company,
    });
  } catch (error) {
    clear_temp_files(req.file ? [req.file] : []);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding company",
      error: error.message,
    });
  }
};

/* ================= EDIT COMPANY ================= */
export const handle_edit_company = async (req, res) => {
  try {
    const { company_id } = req.params;

    const company = await company_model.findById(company_id);
    if (!company) {
      clear_temp_files(req.file ? [req.file] : []);
      return res.status(404).json({
        status: "error",
        message: "Company not found",
      });
    }

    const {
      name,
      email,
      phone,
      secondary_phone,
      website,
      rating,
      owner,
      tags,
      industry,
      source,
      currency,
      language,
      about,
      contacts,
      address,
      social_accounts,
      status,
    } = req.body;

    const rawPayload = {
      name,
      email,
      phone,
      secondary_phone,
      website,
      rating,
      owner,
      industry,
      source,
      currency,
      language,
      about,
      status,
      ...(contacts && { contacts: JSON.parse(contacts) }),
      ...(tags && { tags: JSON.parse(tags) }),
      ...(address && { address: JSON.parse(address) }),
      ...(social_accounts && { social_accounts: JSON.parse(social_accounts) }),
    };

    const payload = sanitizePayload(rawPayload);

    if (req.file) {
      try {
        if (company.image?.key) {
          await delete_file_from_s3(company.image.key);
        }

        const key = build_s3_key(
          "company",
          company._id.toString(),
          "image",
          req.file.filename,
        );
        const uploaded = await upload_file_to_s3(req.file, key);

        payload.image = {
          key: uploaded.key,
          url: uploaded.url,
        };
      } catch (upload_error) {
        clear_temp_files([req.file]);
        return res.status(500).json({
          status: "error",
          message: "Image upload failed.",
          error: upload_error.message,
        });
      }
    }

    const updated_company = await company_model.findByIdAndUpdate(
      company_id,
      payload,
      {
        new: true,
      },
    );

    if (!updated_company) {
      return res.status(404).json({
        status: "error",
        message: "Company not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Company updated successfully",
      data: updated_company,
    });
  } catch (error) {
    clear_temp_files(req.file ? [req.file] : []);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating company",
      error: error.message,
    });
  }
};

/* ================= DELETE COMPANY ================= */
export const handle_delete_company = async (req, res) => {
  try {
    const { company_id } = req.params;
    const deleted_company = await company_model.findById(company_id);

    if (!deleted_company) {
      return res.status(404).json({
        status: "error",
        message: "Company not found",
      });
    }

    if (deleted_company.image?.key) {
      await delete_file_from_s3(deleted_company.image.key);
    }

    await company_model.findByIdAndDelete(company_id);

    return res.status(200).json({
      status: "success",
      message: "Company deleted successfully",
      data: deleted_company,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting company",
      error: error.message,
    });
  }
};

/* ================= ADD NOTE TO COMPANY ================= */
export const handle_add_note_to_company = async (req, res) => {
  try {
    const { user_token } = req.cookies;
    if (!user_token) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }
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

    const { company_id } = req.params;

    const company = await company_model.findById(company_id);
    if (!company) {
      clear_temp_files(req.files);
      return res.status(404).json({
        status: "error",
        message: "Company not found",
      });
    }

    const { title, note } = req.body;

    company.activity_log.push({
      entity: "note",
      action: "created",
      performed_by: user_id,
      performed_at: new Date(),
    });

    company.notes.push({
      title: title?.trim() || "",
      note: note?.trim() || "",
      attachments: [],
    });

    await company.save();

    const created_note = company.notes[company.notes.length - 1];
    const attachment_files = req.files?.attachments || [];

    if (attachment_files.length) {
      for (const file of attachment_files) {
        const key = build_s3_key(
          "company",
          company._id.toString(),
          `note/${created_note._id.toString()}`,
          file.filename,
        );
        const uploaded = await upload_file_to_s3(file, key);
        created_note.attachments.push({
          file: uploaded.url,
          key: uploaded.key,
        });
      }
      await company.save();
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

/* ================= EDIT NOTE ON COMPANY ================= */
export const handle_edit_note_on_company = async (req, res) => {
  try {
    const { company_id, note_id } = req.params;

    const company = await company_model.findById(company_id);
    if (!company) {
      clear_temp_files(req.files);
      return res.status(404).json({
        status: "error",
        message: "Company not found",
      });
    }

    const note = company.notes.id(note_id);
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

    const attachment_files = req.files?.attachments || [];

    if (attachment_files.length) {
      for (const file of attachment_files) {
        const key = build_s3_key(
          "company",
          company._id.toString(),
          `note/${note._id.toString()}`,
          file.filename,
        );
        const uploaded = await upload_file_to_s3(file, key);
        note.attachments.push({ file: uploaded.url, key: uploaded.key });
      }
    }

    await company.save();

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

/* ================= DELETE NOTE FROM COMPANY ================= */
export const handle_delete_note_from_company = async (req, res) => {
  try {
    const { company_id, note_id } = req.params;

    const company = await company_model.findById(company_id);
    if (!company) {
      return res.status(404).json({
        status: "error",
        message: "Company not found",
      });
    }

    const note = company.notes.id(note_id);
    if (!note) {
      return res.status(404).json({
        status: "error",
        message: "Note not found",
      });
    }

    for (const attachment of note.attachments || []) {
      await delete_file_from_s3(attachment.key);
    }

    company.notes = company.notes.filter((n) => n._id.toString() !== note_id);
    await company.save();

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

/* ================= ADD CALL LOG TO COMPANY ================= */
export const handle_add_call_log_to_company = async (req, res) => {
  try {
    const { user_token } = req.cookies;
    if (!user_token) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }
    const { user_id } = jwt.verify(user_token, process.env.JWT_SECRET);

    const user = await user_model.findOne({ _id: user_id, user_type: "admin" });
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "You are not authorized to perform this action.",
        error: "Unauthorized",
      });
    }

    const { company_id } = req.params;

    const company = await company_model.findById(company_id);
    if (!company) {
      return res.status(404).json({
        status: "error",
        message: "Company not found",
      });
    }

    const { status, follow_up_date, note, create_follow_up_task } = req.body;

    company.activity_log.push({
      entity: "call_log",
      action: "created",
      performed_by: user_id,
      performed_at: new Date(),
    });

    company.calls.push({ status, follow_up_date, note, create_follow_up_task });
    await company.save();

    return res.status(201).json({
      status: "success",
      message: "Call log added successfully",
      data: company.calls[company.calls.length - 1],
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding call log",
      error: error.message,
    });
  }
};

/* ================= EDIT CALL LOG ON COMPANY ================= */
export const handle_edit_call_log_on_company = async (req, res) => {
  try {
    const { company_id, call_log_id } = req.params;

    const company = await company_model.findById(company_id);
    if (!company) {
      return res.status(404).json({
        status: "error",
        message: "Company not found",
      });
    }

    const call_log = company.calls.id(call_log_id);
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

    await company.save();

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

/* ================= DELETE CALL LOG FROM COMPANY ================= */
export const handle_delete_call_log_from_company = async (req, res) => {
  try {
    const { company_id, call_log_id } = req.params;

    const company = await company_model.findById(company_id);
    if (!company) {
      return res.status(404).json({
        status: "error",
        message: "Company not found",
      });
    }

    company.calls = company.calls.filter(
      (c) => c._id.toString() !== call_log_id,
    );
    await company.save();

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
