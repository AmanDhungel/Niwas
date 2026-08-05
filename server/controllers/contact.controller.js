import contact_model from "../models/contact.model.js";
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
    if (!isEmptyValue(value)) {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

/* ================= GET CONTACTS ================= */
export const handle_get_contacts = async (req, res) => {
  try {
    const contacts = await contact_model.find();

    return res.status(200).json({
      status: "success",
      message: "Contacts fetched successfully",
      data: contacts,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching contacts",
      error: error.message,
    });
  }
};

/* ================= GET CONTACT ================= */
export const handle_get_contact = async (req, res) => {
  try {
    const { contact_id } = req.params;

    const contact = await contact_model.findById(contact_id).populate({
      path: "activity_log.performed_by",
      model: "user",
    });

    if (!contact) {
      return res.status(404).json({
        status: "error",
        message: "Contact not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Contact fetched successfully",
      data: contact,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching contact",
      error: error.message,
    });
  }
};

/* ================= ADD CONTACT ================= */
export const handle_add_contact = async (req, res) => {
  try {
    const user_id = req.user_id;

    const {
      name,
      job_title,
      company,
      email,
      phone,
      secondary_phone,
      date_of_birth,
      rating,
      industry,
      currency,
      language,
      tags,
      source,
      address,
      social_accounts,
      status,
    } = req.body;

    const rawPayload = {
      name,
      job_title,
      company,
      email,
      phone,
      secondary_phone,
      date_of_birth,
      rating,
      industry,
      currency,
      language,
      source,
      status,
      activity_log: [
        {
          entity: "contact",
          action: "created",
          performed_by: user_id,
          performed_at: new Date(),
        },
      ],
      ...(tags && { tags: JSON.parse(tags) }),
      ...(address && { address: JSON.parse(address) }),
      ...(social_accounts && { social_accounts: JSON.parse(social_accounts) }),
    };

    const payload = sanitizePayload(rawPayload);

    const new_contact = await contact_model.create(payload);

    // Upload image after contact is created so we have the contact _id
    if (req.file) {
      try {
        const key = build_s3_key(
          "contact",
          new_contact._id.toString(),
          "image",
          req.file.filename,
        );
        const uploaded = await upload_file_to_s3(req.file, key);
        new_contact.image = { key: uploaded.key, url: uploaded.url };
        await new_contact.save();
      } catch (upload_error) {
        clear_temp_files([req.file]);
        return res.status(500).json({
          status: "error",
          message: "Contact created but image upload failed.",
          error: upload_error.message,
        });
      }
    }

    return res.status(201).json({
      status: "success",
      message: "Contact added successfully",
      data: new_contact,
    });
  } catch (error) {
    clear_temp_files(req.file ? [req.file] : []);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding contact",
      error: error.message,
    });
  }
};

/* ================= EDIT CONTACT ================= */
export const handle_edit_contact = async (req, res) => {
  try {
    const { contact_id } = req.params;

    const contact = await contact_model.findById(contact_id);
    if (!contact) {
      clear_temp_files(req.file ? [req.file] : []);
      return res.status(404).json({
        status: "error",
        message: "Contact not found",
      });
    }

    const {
      name,
      job_title,
      company,
      email,
      phone,
      secondary_phone,
      date_of_birth,
      rating,
      industry,
      currency,
      language,
      tags,
      source,
      address,
      social_accounts,
      status,
    } = req.body;

    const rawPayload = {
      name,
      job_title,
      company,
      email,
      phone,
      secondary_phone,
      date_of_birth,
      rating,
      industry,
      currency,
      language,
      source,
      status,
      ...(tags && { tags: JSON.parse(tags) }),
      ...(address && { address: JSON.parse(address) }),
      ...(social_accounts && { social_accounts: JSON.parse(social_accounts) }),
    };

    const payload = sanitizePayload(rawPayload);

    // Handle image upload — delete old one from S3 first
    if (req.file) {
      try {
        if (contact.image?.key) {
          await delete_file_from_s3(contact.image.key);
        }
        const key = build_s3_key(
          "contact",
          contact._id.toString(),
          "image",
          req.file.filename,
        );
        const uploaded = await upload_file_to_s3(req.file, key);
        payload.image = { key: uploaded.key, url: uploaded.url };
      } catch (upload_error) {
        clear_temp_files([req.file]);
        return res.status(500).json({
          status: "error",
          message: "Image upload failed.",
          error: upload_error.message,
        });
      }
    }

    await contact_model.findByIdAndUpdate(contact_id, payload, { new: true });

    const updated_contact = await contact_model.findById(contact_id);

    return res.status(200).json({
      status: "success",
      message: "Contact updated successfully",
      data: updated_contact,
    });
  } catch (error) {
    clear_temp_files(req.file ? [req.file] : []);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating contact",
      error: error.message,
    });
  }
};

/* ================= DELETE CONTACT ================= */
export const handle_delete_contact = async (req, res) => {
  try {
    const { contact_id } = req.params;

    const contact = await contact_model.findById(contact_id);
    if (!contact) {
      return res.status(404).json({
        status: "error",
        message: "Contact not found",
      });
    }

    // Delete contact image from S3 if present
    if (contact.image?.key) {
      await delete_file_from_s3(contact.image.key);
    }

    await contact_model.findByIdAndDelete(contact_id);

    return res.status(200).json({
      status: "success",
      message: "Contact deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting contact",
      error: error.message,
    });
  }
};

/* ================= ADD NOTE TO CONTACT ================= */
export const handle_add_note_to_contact = async (req, res) => {
  try {
    const { user_token } = req.cookies;
    const { user_id } = jwt.verify(user_token, process.env.JWT_SECRET);

    const user = await user_model.findOne({
      _id: user_id,
      user_type: "admin",
    });

    if (!user) {
      clear_temp_files(req.files);
      return res.status(401).json({
        status: "error",
        message: "You are not authorized to perform this action.",
        error: "Unauthorized",
      });
    }

    const { contact_id } = req.params;

    const contact = await contact_model.findById(contact_id);
    if (!contact) {
      clear_temp_files(req.files);
      return res.status(404).json({
        status: "error",
        message: "Contact not found",
      });
    }

    const { title, note } = req.body;

    contact.activity_log.push({
      entity: "note",
      action: "created",
      performed_by: user_id,
      performed_at: new Date(),
    });

    contact.notes.push({
      title: title?.trim() || "",
      note: note?.trim() || "",
      attachments: [],
    });
    await contact.save();

    const created_note = contact.notes[contact.notes.length - 1];

    const attachment_files = req.files?.attachments || [];

    if (attachment_files.length) {
      for (const file of attachment_files) {
        const key = build_s3_key(
          "contact",
          contact._id.toString(),
          `note/${created_note._id.toString()}`,
          file.filename,
        );
        const uploaded = await upload_file_to_s3(file, key);
        created_note.attachments.push({
          file: uploaded.url,
          key: uploaded.key,
        });
      }
      await contact.save();
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

/* ================= EDIT NOTE ON CONTACT ================= */
export const handle_edit_note_on_contact = async (req, res) => {
  try {
    const { contact_id, note_id } = req.params;

    const contact = await contact_model.findById(contact_id);
    if (!contact) {
      clear_temp_files(req.files);
      return res.status(404).json({
        status: "error",
        message: "Contact not found",
      });
    }

    const note = contact.notes.id(note_id);
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
          "contact",
          contact._id.toString(),
          `note/${note._id.toString()}`,
          file.filename,
        );
        const uploaded = await upload_file_to_s3(file, key);
        note.attachments.push({ file: uploaded.url, key: uploaded.key });
      }
    }

    await contact.save();

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

/* ================= DELETE NOTE FROM CONTACT ================= */
export const handle_delete_note_from_contact = async (req, res) => {
  try {
    const { contact_id, note_id } = req.params;

    const contact = await contact_model.findById(contact_id);
    if (!contact) {
      return res.status(404).json({
        status: "error",
        message: "Contact not found",
      });
    }

    const note = contact.notes.id(note_id);
    if (!note) {
      return res.status(404).json({
        status: "error",
        message: "Note not found",
      });
    }

    for (const attachment of note.attachments || []) {
      await delete_file_from_s3(attachment.key);
    }

    contact.notes = contact.notes.filter((n) => n._id.toString() !== note_id);
    await contact.save();

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

/* ================= ADD CALL LOG TO CONTACT ================= */
export const handle_add_call_log_to_contact = async (req, res) => {
  try {
    const { user_token } = req.cookies;
    const { user_id } = jwt.verify(user_token, process.env.JWT_SECRET);

    const user = await user_model.findOne({
      _id: user_id,
      user_type: "admin",
    });

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "You are not authorized to perform this action.",
        error: "Unauthorized",
      });
    }

    const { contact_id } = req.params;

    const contact = await contact_model.findById(contact_id);
    if (!contact) {
      return res.status(404).json({
        status: "error",
        message: "Contact not found",
      });
    }

    const { status, follow_up_date, note, create_follow_up_task } = req.body;

    contact.activity_log.push({
      entity: "call_log",
      action: "created",
      performed_by: user_id,
      performed_at: new Date(),
    });

    contact.calls.push({
      status,
      follow_up_date,
      note,
      create_follow_up_task,
    });

    await contact.save();

    return res.status(201).json({
      status: "success",
      message: "Call log added successfully",
      data: contact.calls[contact.calls.length - 1],
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding call log",
      error: error.message,
    });
  }
};

/* ================= EDIT CALL LOG ON CONTACT ================= */
export const handle_edit_call_log_on_contact = async (req, res) => {
  try {
    const { contact_id, call_log_id } = req.params;

    const contact = await contact_model.findById(contact_id);
    if (!contact) {
      return res.status(404).json({
        status: "error",
        message: "Contact not found",
      });
    }

    const call_log = contact.calls.id(call_log_id);
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

    await contact.save();

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

/* ================= DELETE CALL LOG FROM CONTACT ================= */
export const handle_delete_call_log_from_contact = async (req, res) => {
  try {
    const { contact_id, call_log_id } = req.params;

    const contact = await contact_model.findById(contact_id);
    if (!contact) {
      return res.status(404).json({
        status: "error",
        message: "Contact not found",
      });
    }

    contact.calls = contact.calls.filter(
      (c) => c._id.toString() !== call_log_id,
    );

    await contact.save();

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

/* ================= ADD FILE TO CONTACT ================= */
export const handle_add_file_to_contact = async (req, res) => {
  try {
    const { user_token } = req.cookies;
    const { user_id } = jwt.verify(user_token, process.env.JWT_SECRET);

    const user = await user_model.findOne({
      _id: user_id,
      user_type: "admin",
    });

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "You are not authorized to perform this action.",
        error: "Unauthorized",
      });
    }

    const { contact_id } = req.params;

    const contact = await contact_model.findById(contact_id);
    if (!contact) {
      return res.status(404).json({
        status: "error",
        message: "Contact not found",
      });
    }

    const {
      title,
      deal,
      document_type,
      owner,
      username,
      email,
      password,
      pipeline,
      status,
      signature,
      content,
      document_signers,
      message_subject,
      message_text,
    } = req.body;

    contact.activity_log.push({
      entity: "file",
      action: "created",
      performed_by: user_id,
      performed_at: new Date(),
    });

    contact.files.push({
      title: title?.trim() || "",
      deal: deal || null,
      document_type: document_type?.trim() || "",
      owner: owner || null,
      username: username?.trim() || "",
      email: email?.trim() || "",
      password: password || "",
      pipeline: pipeline ? JSON.parse(pipeline) : {},
      status: status || "active",
      signature: signature || "no_signature",
      content: content || "",
      document_signers: document_signers ? JSON.parse(document_signers) : [],
      message_subject: message_subject?.trim() || "",
      message_text: message_text || "",
    });

    await contact.save();

    const created_file = contact.files[contact.files.length - 1];

    return res.status(201).json({
      status: "success",
      message: "File added successfully",
      data: created_file,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding file",
      error: error.message,
    });
  }
};

/* ================= EDIT FILE ON CONTACT ================= */
export const handle_edit_file_on_contact = async (req, res) => {
  try {
    const { contact_id, file_id } = req.params;

    const contact = await contact_model.findById(contact_id);
    if (!contact) {
      return res.status(404).json({
        status: "error",
        message: "Contact not found",
      });
    }

    const file_entry = contact.files.find((f) => f._id.toString() === file_id);
    if (!file_entry) {
      return res.status(404).json({
        status: "error",
        message: "File not found",
      });
    }

    const {
      title,
      deal,
      document_type,
      owner,
      username,
      email,
      password,
      pipeline,
      status,
      signature,
      content,
      document_signers,
      message_subject,
      message_text,
    } = req.body;

    if (title !== undefined) file_entry.title = title.trim();
    if (deal !== undefined) file_entry.deal = deal;
    if (document_type !== undefined)
      file_entry.document_type = document_type.trim();
    if (owner !== undefined) file_entry.owner = owner;
    if (username !== undefined) file_entry.username = username.trim();
    if (email !== undefined) file_entry.email = email.trim();
    if (password !== undefined) file_entry.password = password;
    if (pipeline !== undefined) file_entry.pipeline = JSON.parse(pipeline);
    if (status !== undefined) file_entry.status = status;
    if (signature !== undefined) file_entry.signature = signature;
    if (content !== undefined) file_entry.content = content;
    if (document_signers !== undefined)
      file_entry.document_signers = JSON.parse(document_signers);
    if (message_subject !== undefined)
      file_entry.message_subject = message_subject.trim();
    if (message_text !== undefined) file_entry.message_text = message_text;

    await contact.save();

    return res.status(200).json({
      status: "success",
      message: "File updated successfully",
      data: file_entry,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating file",
      error: error.message,
    });
  }
};

/* ================= DELETE FILE FROM CONTACT ================= */
export const handle_delete_file_from_contact = async (req, res) => {
  try {
    const { contact_id, file_id } = req.params;

    const contact = await contact_model.findById(contact_id);
    if (!contact) {
      return res.status(404).json({
        status: "error",
        message: "Contact not found",
      });
    }

    const file_entry = contact.files.find((f) => f._id.toString() === file_id);
    if (!file_entry) {
      return res.status(404).json({
        status: "error",
        message: "File not found",
      });
    }

    contact.files = contact.files.filter((f) => f._id.toString() !== file_id);
    await contact.save();

    return res.status(200).json({
      status: "success",
      message: "File deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting file",
      error: error.message,
    });
  }
};
