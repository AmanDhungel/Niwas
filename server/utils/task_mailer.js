import contact_model from "../models/contact.model.js";
import { mailer } from "./mailer.js";

/**
 * Resolves contact emails from an array of contact ObjectIds,
 * then fires notification emails to all of them.
 *
 * @param {ObjectId[]} contact_ids   - task.contacts array
 * @param {"created"|"updated"|"moved"} event
 * @param {{ task_title: string, board_title?: string, from_list?: string, to_list?: string, changed_fields?: string[] }} meta
 */
export const notify_task_contacts = async (contact_ids, event, meta) => {
  if (!contact_ids || contact_ids.length === 0) return;

  try {
    const contacts = await contact_model
      .find({ _id: { $in: contact_ids }, status: "active" })
      .select("name email")
      .lean();

    if (!contacts.length) return;

    const emails = contacts
      .map((c) => c.email)
      .filter(Boolean);

    if (!emails.length) return;

    const { subject, html } = build_task_email(event, meta, contacts);

    await mailer.sendMail({
      from: `"Workspace Notifications" <${process.env.SMTP_USERNAME}>`,
      to: emails,
      subject,
      html,
    });
  } catch (err) {
    // Non-fatal — log but do NOT crash the request
    console.error("[task_mailer] Failed to send task notification:", err.message);
  }
};

/* ──────────────────────────────────────────── */
/*  Email template builder                      */
/* ──────────────────────────────────────────── */
const build_task_email = (event, meta, contacts) => {
  const { task_title, board_title, from_list, to_list, changed_fields } = meta;

  const name_list = contacts.map((c) => c.name).join(", ");

  let subject = "";
  let body_content = "";

  switch (event) {
    case "created":
      subject = `New Task Created: "${task_title}"`;
      body_content = `
        <p>A new task has been created that involves you.</p>
        <table>
          <tr><td><strong>Task</strong></td><td>${task_title}</td></tr>
          ${board_title ? `<tr><td><strong>Board</strong></td><td>${board_title}</td></tr>` : ""}
        </table>
      `;
      break;

    case "updated":
      subject = `Task Updated: "${task_title}"`;
      const fields_html = changed_fields?.length
        ? `<p><strong>Fields changed:</strong> ${changed_fields.join(", ")}</p>`
        : "";
      body_content = `
        <p>A task linked to you has been updated.</p>
        <table>
          <tr><td><strong>Task</strong></td><td>${task_title}</td></tr>
          ${board_title ? `<tr><td><strong>Board</strong></td><td>${board_title}</td></tr>` : ""}
        </table>
        ${fields_html}
      `;
      break;

    case "moved":
      subject = `Task Moved: "${task_title}"`;
      body_content = `
        <p>A task linked to you has been moved to a different list.</p>
        <table>
          <tr><td><strong>Task</strong></td><td>${task_title}</td></tr>
          ${board_title ? `<tr><td><strong>Board</strong></td><td>${board_title}</td></tr>` : ""}
          ${from_list ? `<tr><td><strong>From</strong></td><td>${from_list}</td></tr>` : ""}
          ${to_list   ? `<tr><td><strong>To</strong></td><td>${to_list}</td></tr>` : ""}
        </table>
      `;
      break;

    default:
      subject = `Task Notification: "${task_title}"`;
      body_content = `<p>There has been an update on a task linked to you.</p>`;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; font-size: 14px; }
        .container { max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; }
        .header { background: #0f172a; color: #fff; padding: 16px 24px; border-radius: 6px 6px 0 0; }
        .header h2 { margin: 0; font-size: 16px; }
        .body { padding: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        td { padding: 8px 12px; border: 1px solid #e5e7eb; vertical-align: top; }
        td:first-child { width: 140px; background: #f8fafc; font-weight: 600; }
        .footer { margin-top: 24px; font-size: 12px; color: #9ca3af; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h2>Task Notification</h2></div>
        <div class="body">
          ${body_content}
          <p style="margin-top:16px">This notification was sent to: <strong>${name_list}</strong></p>
        </div>
        <div class="footer">You received this because you are listed as a contact on this task.</div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
};