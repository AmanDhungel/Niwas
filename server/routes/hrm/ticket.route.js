import express from "express";
import {
  handle_get_tickets,
  handle_get_ticket,
  handle_add_ticket,
  handle_edit_ticket,
  handle_delete_ticket,
  handle_update_ticket_priority,
  handle_update_ticket_status,
  handle_update_ticket_assigned_to,
  handle_add_comment_to_ticket,
  handle_edit_comment_on_ticket,
  handle_delete_comment_from_ticket,
} from "../../controllers/hrm/ticket.controller.js";

const ticket_router = express.Router();

/* ================= TICKET ROUTES ================= */
ticket_router.get("/", handle_get_tickets);
ticket_router.get("/:ticket_id", handle_get_ticket);
ticket_router.post("/add", handle_add_ticket);
ticket_router.post("/edit/:ticket_id", handle_edit_ticket);
ticket_router.post("/delete/:ticket_id", handle_delete_ticket);

/* ================= QUICK UPDATE ROUTES ================= */
ticket_router.post(
  "/:ticket_id/update/priority",
  handle_update_ticket_priority,
);
ticket_router.post("/:ticket_id/update/status", handle_update_ticket_status);
ticket_router.post(
  "/:ticket_id/update/assigned_to",
  handle_update_ticket_assigned_to,
);

/* ================= COMMENT ROUTES ================= */
ticket_router.post("/:ticket_id/comments/add", handle_add_comment_to_ticket);
ticket_router.post(
  "/:ticket_id/comments/edit/:comment_id",
  handle_edit_comment_on_ticket,
);
ticket_router.post(
  "/:ticket_id/comments/delete/:comment_id",
  handle_delete_comment_from_ticket,
);

export default ticket_router;
