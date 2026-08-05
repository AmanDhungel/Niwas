import contact_model from "../models/contact.model.js";
import { handle_send_sms } from "./sms_sender.js";

/* ──────────────────────────────────────────── */
/*  Nepali phone validator                      */
/*  Valid: +977 98XXXXXXXX or +977 97XXXXXXXX   */
/*  Also accepts bare local: 98XXXXXXXX         */
/* ──────────────────────────────────────────── */
const NEPALI_PHONE_REGEX = /^(?:\+977)?(9[78]\d{8})$/;

const normalize_nepali_phone = (raw) => {
  if (!raw || typeof raw !== "string") return null;
  const cleaned = raw.replace(/[\s\-()]/g, "");
  const match   = cleaned.match(NEPALI_PHONE_REGEX);
  if (!match) return null;
  return match[1]; // returns bare 98XXXXXXXX / 97XXXXXXXX without +977
};

/* ──────────────────────────────────────────── */
/*  SMS message builder                         */
/* ──────────────────────────────────────────── */
const build_task_sms = (event, meta) => {
  const { task_title, board_title, from_list, to_list, changed_fields } = meta;

  switch (event) {
    case "created":
      return (
        `New Task: "${task_title}"` +
        (board_title ? ` | Board: ${board_title}` : "") +
        `. You have been linked to this task.`
      );

    case "updated":
      return (
        `Task Updated: "${task_title}"` +
        (board_title ? ` | Board: ${board_title}` : "") +
        (changed_fields?.length ? ` | Changed: ${changed_fields.join(", ")}` : "") +
        `.`
      );

    case "moved":
      return (
        `Task Moved: "${task_title}"` +
        (from_list ? ` from "${from_list}"` : "") +
        (to_list   ? ` to "${to_list}"`   : "") +
        (board_title ? ` | Board: ${board_title}` : "") +
        `.`
      );

    default:
      return `Task Notification: "${task_title}". There has been an update on a task linked to you.`;
  }
};

/* ──────────────────────────────────────────── */
/*  Main export                                 */
/* ──────────────────────────────────────────── */

/**
 * Resolves contact phone numbers from an array of contact ObjectIds,
 * validates each as a Nepali number (+977 98/97 + 8 digits),
 * then fires SMS notifications to all valid numbers.
 *
 * @param {ObjectId[]} contact_ids   - task.contacts array
 * @param {"created"|"updated"|"moved"} event
 * @param {{ task_title: string, board_title?: string, from_list?: string, to_list?: string, changed_fields?: string[] }} meta
 */
export const notify_task_contacts_sms = async (contact_ids, event, meta) => {
  if (!contact_ids || contact_ids.length === 0) return;

  try {
    const contacts = await contact_model
      .find({ _id: { $in: contact_ids }, status: "active" })
      .select("name phone")
      .lean();

    if (!contacts.length) return;

    const message = build_task_sms(event, meta);

    const results = await Promise.allSettled(
      contacts.map(async (contact) => {
        const normalized = normalize_nepali_phone(contact.phone);

        if (!normalized) {
          console.warn(
            `[task_sms] Skipping "${contact.name}" — invalid or non-Nepali number: ${contact.phone}`,
          );
          return;
        }

        await handle_send_sms(normalized, message);
      }),
    );

    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(
          `[task_sms] Failed to send SMS to contact[${i}]:`,
          r.reason?.message ?? r.reason,
        );
      }
    });
  } catch (err) {
    console.error("[task_sms] Unexpected error during SMS dispatch:", err.message);
  }
};