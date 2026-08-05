import jwt from "jsonwebtoken";
import ticket_model from "../../models/hrm/ticket.model.js";
import board_model from "../../models/board/board.model.js";

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

/* ================= GET TICKETS ================= */
export const handle_get_tickets = async (req, res) => {
  try {
    const tickets = await ticket_model
      .find()
      .populate("assigned_to")
      .populate("comments.created_by");

    return res.status(200).json({
      status: "success",
      message: "Tickets fetched successfully",
      data: tickets,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching tickets",
      error: error.message,
    });
  }
};

/* ================= GET TICKET ================= */
export const handle_get_ticket = async (req, res) => {
  try {
    const { ticket_id } = req.params;

    const ticket = await ticket_model
      .findById(ticket_id)
      .populate("assigned_to")
      .populate("comments.created_by");

    if (!ticket) {
      return res.status(404).json({
        status: "error",
        message: "Ticket not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Ticket fetched successfully",
      data: ticket,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching ticket",
      error: error.message,
    });
  }
};

/* ================= ADD TICKET ================= */
export const handle_add_ticket = async (req, res) => {
  try {
    const {
      title,
      pipeline,
      event_category,
      subject,
      assigned_to,
      description,
      due_date,
      expected_closing_date,
      priority,
      status,
    } = req.body;

    const payload = sanitizePayload({
      title,
      event_category,
      subject,
      description,
      due_date,
      expected_closing_date,
      priority,
      status,
      assigned_to,
      ...(pipeline && { pipeline: JSON.parse(pipeline) }),
    });

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

    if (board_db && tasklist_db) {
      tasklist_db.tasks.push({
        title: payload.title,
        description: payload.description || "",
        category: "ticket",
        custom_fields: [
          {
            field_name: "Event Category",
            field_type: "text",
            field_value: payload.event_category || "",
          },
          {
            field_name: "Subject",
            field_type: "text",
            field_value: payload.subject || "",
          },
          {
            field_name: "Due Date",
            field_type: "date",
            field_value: payload.due_date || null,
          },
          {
            field_name: "Expected Closing Date",
            field_type: "date",
            field_value: payload.expected_closing_date || null,
          },
          {
            field_name: "Priority",
            field_type: "text",
            field_value: payload.priority || "",
          },
        ],
        origin: "ticket",
      });

      await board_db.save();
    }

    const new_ticket = await ticket_model.create(payload);

    if (board_db && tasklist_db) {
      const task = tasklist_db.tasks.find(
        (t) => t.origin === "ticket" && t.title === payload.title,
      );
      if (task) {
        task.ticket = new_ticket._id;
        await board_db.save();
      }
    }

    return res.status(201).json({
      status: "success",
      message: "Ticket added successfully",
      data: new_ticket,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding ticket",
      error: error.message,
    });
  }
};

/* ================= EDIT TICKET ================= */
export const handle_edit_ticket = async (req, res) => {
  try {
    const { ticket_id } = req.params;

    const {
      title,
      event_category,
      subject,
      assigned_to,
      description,
      due_date,
      expected_closing_date,
      priority,
      status,
    } = req.body;

    const payload = sanitizePayload({
      title,
      event_category,
      subject,
      description,
      due_date,
      expected_closing_date,
      priority,
      status,
      assigned_to,
      // ...(assigned_to && { assigned_to: JSON.parse(assigned_to) }),
    });

    const updated_ticket = await ticket_model.findByIdAndUpdate(
      ticket_id,
      payload,
      { new: true },
    );

    if (!updated_ticket) {
      return res.status(404).json({
        status: "error",
        message: "Ticket not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Ticket updated successfully",
      data: updated_ticket,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating ticket",
      error: error.message,
    });
  }
};

/* ================= DELETE TICKET ================= */
export const handle_delete_ticket = async (req, res) => {
  try {
    const { ticket_id } = req.params;
    const deleted_ticket = await ticket_model.findByIdAndDelete(ticket_id);

    if (!deleted_ticket) {
      return res.status(404).json({
        status: "error",
        message: "Ticket not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Ticket deleted successfully",
      data: deleted_ticket,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting ticket",
      error: error.message,
    });
  }
};

/* ================= UPDATE PRIORITY ================= */
export const handle_update_ticket_priority = async (req, res) => {
  try {
    const { ticket_id } = req.params;
    const { priority } = req.body;

    if (!priority) {
      return res.status(400).json({
        status: "error",
        message: "Priority is required",
      });
    }

    const ticket = await ticket_model.findById(ticket_id);
    if (!ticket) {
      return res.status(404).json({
        status: "error",
        message: "Ticket not found",
      });
    }

    ticket.priority = priority;
    await ticket.save();

    return res.status(200).json({
      status: "success",
      message: "Priority updated successfully",
      data: ticket,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating priority",
      error: error.message,
    });
  }
};

/* ================= UPDATE STATUS ================= */
export const handle_update_ticket_status = async (req, res) => {
  try {
    const { ticket_id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        status: "error",
        message: "Status is required",
      });
    }

    const ticket = await ticket_model.findById(ticket_id);
    if (!ticket) {
      return res.status(404).json({
        status: "error",
        message: "Ticket not found",
      });
    }

    ticket.status = status;
    await ticket.save();

    return res.status(200).json({
      status: "success",
      message: "Status updated successfully",
      data: ticket,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating status",
      error: error.message,
    });
  }
};

/* ================= UPDATE ASSIGNED TO ================= */
export const handle_update_ticket_assigned_to = async (req, res) => {
  try {
    const { ticket_id } = req.params;
    const { assigned_to } = req.body;

    if (!assigned_to) {
      return res.status(400).json({
        status: "error",
        message: "assigned_to is required",
      });
    }

    const ticket = await ticket_model.findById(ticket_id);
    if (!ticket) {
      return res.status(404).json({
        status: "error",
        message: "Ticket not found",
      });
    }

    ticket.assigned_to = assigned_to;
    await ticket.save();

    await ticket.populate("assigned_to");

    return res.status(200).json({
      status: "success",
      message: "Assigned to updated successfully",
      data: ticket,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating assigned to",
      error: error.message,
    });
  }
};

/* ================= ADD COMMENT ================= */
export const handle_add_comment_to_ticket = async (req, res) => {
  try {
    const { user_token } = req.cookies;
    const { user_id } = jwt.verify(user_token, process.env.JWT_SECRET);

    const { ticket_id } = req.params;
    const { comment } = req.body;

    if (!comment?.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Comment is required",
      });
    }

    const ticket = await ticket_model.findById(ticket_id);
    if (!ticket) {
      return res.status(404).json({
        status: "error",
        message: "Ticket not found",
      });
    }

    ticket.comments.push({
      comment: comment.trim(),
      created_by: user_id,
      created_at: new Date(),
    });

    await ticket.save();

    const created_comment = ticket.comments[ticket.comments.length - 1];

    return res.status(201).json({
      status: "success",
      message: "Comment added successfully",
      data: created_comment,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding comment",
      error: error.message,
    });
  }
};

/* ================= EDIT COMMENT ================= */
export const handle_edit_comment_on_ticket = async (req, res) => {
  try {
    const { user_token } = req.cookies;
    const { user_id } = jwt.verify(user_token, process.env.JWT_SECRET);

    const { ticket_id, comment_id } = req.params;
    const { comment } = req.body;

    if (!comment?.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Comment is required",
      });
    }

    const ticket = await ticket_model.findById(ticket_id);
    if (!ticket) {
      return res.status(404).json({
        status: "error",
        message: "Ticket not found",
      });
    }

    const comment_entry = ticket.comments.id(comment_id);
    if (!comment_entry) {
      return res.status(404).json({
        status: "error",
        message: "Comment not found",
      });
    }

    if (comment_entry.created_by.toString() !== user_id.toString()) {
      return res.status(403).json({
        status: "error",
        message: "You can only edit your own comments",
      });
    }

    comment_entry.comment = comment.trim();
    await ticket.save();

    return res.status(200).json({
      status: "success",
      message: "Comment updated successfully",
      data: comment_entry,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating comment",
      error: error.message,
    });
  }
};

/* ================= DELETE COMMENT ================= */
export const handle_delete_comment_from_ticket = async (req, res) => {
  try {
    const { user_token } = req.cookies;
    const { user_id } = jwt.verify(user_token, process.env.JWT_SECRET);

    const { ticket_id, comment_id } = req.params;

    const ticket = await ticket_model.findById(ticket_id);
    if (!ticket) {
      return res.status(404).json({
        status: "error",
        message: "Ticket not found",
      });
    }

    const comment_entry = ticket.comments.id(comment_id);
    if (!comment_entry) {
      return res.status(404).json({
        status: "error",
        message: "Comment not found",
      });
    }

    if (comment_entry.created_by.toString() !== user_id.toString()) {
      return res.status(403).json({
        status: "error",
        message: "You can only delete your own comments",
      });
    }

    ticket.comments = ticket.comments.filter(
      (c) => c._id.toString() !== comment_id,
    );
    await ticket.save();

    return res.status(200).json({
      status: "success",
      message: "Comment deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting comment",
      error: error.message,
    });
  }
};
