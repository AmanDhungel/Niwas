import jwt from "jsonwebtoken";

import board_model from "../../models/board/board.model.js";
import domain_workspace_model from "../../models/workspace/domain_workspace.model.js";
import vendor_workspace_model from "../../models/workspace/vendor_workspace.model.js";
import user_model from "../../models/user.model.js";
import {
  upload_file_to_s3,
  delete_file_from_s3,
  build_s3_key,
  clear_temp_files,
} from "../../utils/s3.util.js";
import pipeline_model from "../../models/pipeline.model.js";
import { notify_task_contacts } from "../../utils/task_mailer.js";
import permission_module_model from "../../models/iam/permission_module.model.js";

/* ================= HELPER: verify admin from cookie ================= */
const get_admin_user = async (req) => {
  const { user_token } = req.cookies;
  const { user_id } = jwt.verify(user_token, process.env.JWT_SECRET);
  const user = await user_model.findOne({ _id: user_id });
  return { user, user_id };
};

/* ================= HELPER: build a log entry ================= */
const make_log = (entity, action, performed_by, changes = []) => ({
  entity,
  action,
  performed_by,
  performed_at: new Date(),
  changes,
});

/* ================= CREATE BOARD ================= */
export const handle_create_board = async (req, res) => {
  try {
    const user_id = req.user_id;

    const { title, workspace, vendor, background_color, visibility, pipeline } =
      req.body;

    if (!title || !title.trim()) {
      clear_temp_files(req.files);
      return res
        .status(400)
        .json({ status: "error", message: "Board title is required." });
    }

    if (!workspace || !vendor) {
      clear_temp_files(req.files);
      return res.status(400).json({
        status: "error",
        message: "Workspace and Vendor are required.",
      });
    }

    const domain_workspace = await domain_workspace_model.findById(workspace);
    if (!domain_workspace) {
      clear_temp_files(req.files);
      return res.status(404).json({ message: "Domain workspace not found." });
    }

    const vendor_workspace = await vendor_workspace_model.findOne({
      _id: vendor,
      domain: workspace,
    });
    if (!vendor_workspace) {
      clear_temp_files(req.files);
      return res.status(404).json({ message: "Vendor workspace not found." });
    }

    const background_files = Array.isArray(req.files) ? req.files : [];

    let taskList = [];
    if (pipeline) {
      const pipeline_data = await pipeline_model.findById(pipeline);
      if (pipeline_data) {
        pipeline_data.stages.forEach((stage) => {
          taskList.push({
            title: stage.label,
            completed: false,
            locked: false,
            assigned_users: [],
            tasks: [],
          });
        });
      }
    }

    const board = await board_model.create({
      title: title.trim(),
      workspace,
      vendor,
      background_color: background_color || null,
      visibility: visibility || "private",
      background_images: [],
      task_lists: taskList || [],
      activity_log: [
        make_log("board", "created", user_id, [
          {
            previous_value: null,
            new_value: {
              title: title.trim(),
              workspace,
              vendor,
              visibility: visibility || "private",
            },
          },
        ]),
      ],
    });

    if (background_files.length > 0) {
      const image_urls = [];
      const image_keys = [];

      for (const file of background_files) {
        const key = build_s3_key(
          "workspace",
          workspace,
          `vendor/${vendor}/board/${board._id.toString()}`,
          file.filename,
        );
        const uploaded = await upload_file_to_s3(file, key);
        image_urls.push(uploaded.url);
        image_keys.push(uploaded.key);
      }

      board.background_images = image_urls;
      board.background_image_keys = image_keys;
      await board.save();
    }

    return res.status(201).json({
      status: "success",
      message: "Board created successfully.",
      data: board,
    });
  } catch (err) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= EDIT BOARD ================= */
export const handle_edit_board = async (req, res) => {
  try {
    const user_id = req.user_id;

    const { board_id } = req.params;
    const { title, background_color, visibility } = req.body;

    const board = await board_model.findById(board_id);
    if (!board) {
      clear_temp_files(req.files);
      return res.status(404).json({ message: "Board not found." });
    }

    const changes = [];

    if (title && title.trim() && title.trim() !== board.title) {
      changes.push({
        previous_value: { title: board.title },
        new_value: { title: title.trim() },
      });
      board.title = title.trim();
    }
    if (background_color && background_color !== board.background_color) {
      changes.push({
        previous_value: { background_color: board.background_color },
        new_value: { background_color },
      });
      board.background_color = background_color;
    }
    if (visibility && visibility !== board.visibility) {
      changes.push({
        previous_value: { visibility: board.visibility },
        new_value: { visibility },
      });
      board.visibility = visibility;
    }

    const background_files = Array.isArray(req.files) ? req.files : [];
    if (background_files.length > 0) {
      for (const old_key of board.background_image_keys || []) {
        await delete_file_from_s3(old_key);
      }

      const image_urls = [];
      const image_keys = [];

      for (const file of background_files) {
        const key = build_s3_key(
          "workspace",
          board.workspace.toString(),
          `vendor/${board.vendor.toString()}/board/${board._id.toString()}`,
          file.filename,
        );
        const uploaded = await upload_file_to_s3(file, key);
        image_urls.push(uploaded.url);
        image_keys.push(uploaded.key);
      }

      changes.push({
        previous_value: { background_images: board.background_images },
        new_value: { background_images: image_urls },
      });
      board.background_images = image_urls;
      board.background_image_keys = image_keys;
    }

    board.activity_log.push(make_log("board", "updated", user_id, changes));
    await board.save();

    return res.status(200).json({
      status: "success",
      message: "Board updated successfully.",
      data: board,
    });
  } catch (err) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

export const handle_get_boards = async (req, res) => {
  try {
    const MODULE_CHECK_NEEDED = req.MODULE_CHECK_NEEDED || false;
    const { vendor_workspace_id } = req.params;

    if (!MODULE_CHECK_NEEDED) {
      const boards = await board_model
        .find({ vendor: vendor_workspace_id })
        .select("-task_lists");

      return res.status(200).json({
        status: "success",
        message: "Boards fetched successfully.",
        data: boards,
      });
    }

    const user_id = req.MODULE_USER_ID;

    const [board_permission_modules, tasklist_permission_modules, task_permission_modules] =
      await Promise.all([
        permission_module_model
          .find({ module: "board", user: user_id })
          .populate("permission_policies", "policy type"),
        permission_module_model
          .find({ module: "tasklist", user: user_id })
          .populate("permission_policies", "policy type"),
        permission_module_model
          .find({ module: "task", user: user_id })
          .populate("permission_policies", "policy type"),
      ]);

    const board_ids_from_board_permissions = board_permission_modules
      .filter((pm) =>
        pm.permission_policies.some(
          (p) => p.policy === "view:boards" && p.type === "allow",
        ),
      )
      .map((pm) => pm.module_item_id.toString());

    const tasklist_ids = tasklist_permission_modules
      .filter((pm) =>
        pm.permission_policies.some(
          (p) => p.policy === "view:tasklist" && p.type === "allow",
        ),
      )
      .map((pm) => pm.module_item_id.toString());

    const task_ids = task_permission_modules
      .filter((pm) =>
        pm.permission_policies.some(
          (p) => p.policy === "view:task" && p.type === "allow",
        ),
      )
      .map((pm) => pm.module_item_id.toString());

    const boards_from_tasklists =
      tasklist_ids.length > 0
        ? await board_model.find(
            { "task_lists._id": { $in: tasklist_ids } },
            { _id: 1 },
          )
        : [];

    const boards_from_tasks =
      task_ids.length > 0
        ? await board_model.find(
            { "task_lists.tasks._id": { $in: task_ids } },
            { _id: 1 },
          )
        : [];

    const permitted_board_ids = [
      ...new Set([
        ...board_ids_from_board_permissions,
        ...boards_from_tasklists.map((b) => b._id.toString()),
        ...boards_from_tasks.map((b) => b._id.toString()),
      ]),
    ];

    const boards = await board_model
      .find({
        vendor: vendor_workspace_id,
        _id: { $in: permitted_board_ids },
      })
      .select("-task_lists");

    return res.status(200).json({
      status: "success",
      message: "Boards fetched successfully.",
      data: boards,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

export const handle_get_board = async (req, res) => {
  try {
    const MODULE_CHECK_NEEDED = req.MODULE_CHECK_NEEDED || false;
    const { board_id } = req.params;

    const board = await board_model.findById(board_id).populate([
      { path: "task_lists.tasks.contacts", model: "contact" },
      { path: "task_lists.tasks.invoices", model: "invoice" },
      { path: "task_lists.tasks.comments.created_by", model: "user" },
      { path: "task_lists.tasks.activity_log.performed_by", model: "user" },
      { path: "activity_log.performed_by", model: "user" },
      { path: "task_lists.meta.created_by", model: "user" },
      { path: "task_lists.meta.initial_board", model: "board" },
      { path: "task_lists.tasks.meta.created_by", model: "user" },
      { path: "task_lists.tasks.meta.initial_board", model: "board" },
      { path: "task_lists.tasks.deal", model: "deal" },
      { path: "task_lists.tasks.lead", model: "lead" },
      { path: "task_lists.tasks.ticket", model: "ticket" },
      { path: "task_lists.tasks.complaint", model: "complaint" },
      { path: "task_lists.tasks.ram", model: "ram" },
    ]);

    if (!board) {
      return res.status(404).json({
        status: "error",
        message: "Board not found.",
      });
    }

    board.activity_log = board.activity_log.reverse();

    if (!MODULE_CHECK_NEEDED) {
      return res.status(200).json({
        status: "success",
        message: "Board fetched successfully.",
        data: board,
      });
    }

    const user_id = req.MODULE_USER_ID;

    const [board_perms, tasklist_perms, task_perms] = await Promise.all([
      permission_module_model
        .find({ module: "board", user: user_id, module_item_id: board_id })
        .populate("permission_policies", "policy type"),
      permission_module_model
        .find({ module: "tasklist", user: user_id })
        .populate("permission_policies", "policy type"),
      permission_module_model
        .find({ module: "task", user: user_id })
        .populate("permission_policies", "policy type"),
    ]);

    const has_board_view = board_perms.some((pm) =>
      pm.permission_policies.some(
        (p) => p.policy === "view:boards" && p.type === "allow",
      ),
    );

    const permitted_tasklist_ids = new Set(
      tasklist_perms
        .filter((pm) =>
          pm.permission_policies.some(
            (p) => p.policy === "view:tasklist" && p.type === "allow",
          ),
        )
        .map((pm) => pm.module_item_id.toString()),
    );

    const permitted_task_ids = new Set(
      task_perms
        .filter((pm) =>
          pm.permission_policies.some(
            (p) => p.policy === "view:task" && p.type === "allow",
          ),
        )
        .map((pm) => pm.module_item_id.toString()),
    );

    if (has_board_view) {
      return res.status(200).json({
        status: "success",
        message: "Board fetched successfully.",
        data: board,
      });
    }

    const filtered_task_lists = board.task_lists
      .map((tasklist) => {
        const tasklist_id = tasklist._id.toString();
        const can_view_tasklist = permitted_tasklist_ids.has(tasklist_id);

        if (can_view_tasklist) {
          return tasklist;
        }

        const visible_tasks = tasklist.tasks.filter((task) =>
          permitted_task_ids.has(task._id.toString()),
        );

        if (visible_tasks.length === 0) return null;

        return {
          ...tasklist.toObject(),
          tasks: visible_tasks,
        };
      })
      .filter(Boolean);

    if (filtered_task_lists.length === 0) {
      return res.status(403).json({
        status: "error",
        message: "Access denied. No permitted tasklists or tasks on this board.",
      });
    }

    const board_data = board.toObject();
    board_data.task_lists = filtered_task_lists;

    return res.status(200).json({
      status: "success",
      message: "Board fetched successfully.",
      data: board_data,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= ADD TASKLIST TO BOARD ================= */
export const handle_add_tasklist_to_board = async (req, res) => {
  try {
    // const { user } = await get_admin_user(req);
    // if (!user)
    //   return res.status(401).json({ status: "error", message: "Unauthorized" });

    const user_id = req.user_id;

    const { board_id } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res
        .status(400)
        .json({ status: "error", message: "Task list title is required." });
    }

    const board = await board_model.findById(board_id);
    if (!board) return res.status(404).json({ message: "Board not found." });

    board.task_lists.push({
      title: title.trim(),
      completed: false,
      locked: false,
      tasks: [],
      meta: {
        created_by: user_id,
        created_at: new Date(),
        initial_board: board._id,
        initial_board_backup: {
          title: board.title,
        },
      },
    });

    board.activity_log.push(
      make_log("tasklist", "created", user_id, [
        { previous_value: null, new_value: { title: title.trim() } },
      ]),
    );

    await board.save();

    return res.status(200).json({
      status: "success",
      message: "Task list added to board successfully.",
      data: board,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= EDIT TASKLIST ON BOARD ================= */
export const handle_edit_tasklist_on_board = async (req, res) => {
  try {
    const { user } = await get_admin_user(req);
    if (!user)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const { board_id, tasklist_id } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res
        .status(400)
        .json({ status: "error", message: "Task list title is required." });
    }

    const board = await board_model.findById(board_id);
    if (!board) return res.status(404).json({ message: "Board not found." });

    const task_list = board.task_lists.id(tasklist_id);
    if (!task_list)
      return res.status(404).json({ message: "Task list not found." });

    const prev_title = task_list.title;
    task_list.title = title.trim();

    board.activity_log.push(
      make_log("tasklist", "updated", user._id, [
        {
          previous_value: { tasklist_id, title: prev_title },
          new_value: { tasklist_id, title: title.trim() },
        },
      ]),
    );

    await board.save();

    return res.status(200).json({
      status: "success",
      message: "Task list updated successfully.",
      data: task_list,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= ADD TASK TO TASKLIST ================= */
export const handle_add_task_to_tasklist = async (req, res) => {
  try {
    const user_id = req.user_id;

    const { board_id, tasklist_id } = req.params;
    const {
      title,
      description,
      category,
      label,
      priority,
      checklists,
      attendance,
      clock_in_out,
      contacts,
      deadline,
      invoices,
      custom_fields,
      location,
      form_definition,
    } = req.body;

    if (!title || !title.trim()) {
      clear_temp_files(req.files);
      return res
        .status(400)
        .json({ status: "error", message: "Task title is required." });
    }

    const board = await board_model.findById(board_id);
    if (!board) {
      clear_temp_files(req.files);
      return res.status(404).json({ message: "Board not found." });
    }

    const task_list = board.task_lists.id(tasklist_id);
    if (!task_list) {
      clear_temp_files(req.files);
      return res.status(404).json({ message: "Task list not found." });
    }

    const parsed_label = label ? JSON.parse(label) : {};
    const parsed_contacts = contacts ? JSON.parse(contacts) : [];
    const parsed_invoices = invoices ? JSON.parse(invoices) : [];
    const parsed_custom_fields = custom_fields ? JSON.parse(custom_fields) : [];
    const parsed_location = location ? JSON.parse(location) : undefined;
    const parsed_checklists = checklists ? JSON.parse(checklists) : [];
    const parsed_attendance = attendance ? JSON.parse(attendance) : [];
    const parsed_clock_in_out = clock_in_out ? JSON.parse(clock_in_out) : {};
    const parsed_deadline = deadline ? JSON.parse(deadline) : null;
    const parsed_form_definition = form_definition
      ? JSON.parse(form_definition)
      : null;

    const attachment_files = req.files?.attachments || [];
    const location_files = req.files?.location_photos || [];
    const checklist_files = req.files?.checklist_files || [];

    const mapped_checklists = parsed_checklists.map((checklist) => ({
      title: checklist.title,
      items: checklist.items.map((item) => ({
        text: item.text,
        completed: false,
        item_deadline: item.item_deadline || null,
        contacts: item.contacts || [],
        files: (item.file_indexes || [])
          .map((i) => checklist_files[i])
          .filter(Boolean)
          .map((f) => f.filename),
      })),
    }));

    task_list.tasks.push({
      title: title.trim(),
      description: description?.trim() || "",
      category: category || "general",
      label: parsed_label,
      priority: priority || null,
      checklists: mapped_checklists,
      attendance: parsed_attendance,
      clock_in_out: parsed_clock_in_out,
      contacts: parsed_contacts,
      deadline: parsed_deadline,
      invoices: parsed_invoices,
      custom_fields: parsed_custom_fields,
      attachments: [],
      location: parsed_location,
      form_definition: parsed_form_definition,
      activity_log: [
        make_log("task", "created", user_id, [
          {
            previous_value: null,
            new_value: { title: title.trim(), tasklist_id },
          },
        ]),
      ],
      meta: {
        created_by: user_id,
        created_at: new Date(),
        initial_board: board._id,
        initial_board_backup: {
          title: board.title,
          description: board.description,
        },
      },
    });

    await board.save();

    const created_task = task_list.tasks[task_list.tasks.length - 1];
    const base_key = `workspace/${board.workspace}/vendor/${board.vendor}/board/${board._id}`;

    if (attachment_files.length) {
      for (const file of attachment_files) {
        const key = `${base_key}/attachment/${created_task._id}/${file.filename}`;
        const uploaded = await upload_file_to_s3(file, key);
        created_task.attachments.push({
          filename: uploaded.url,
          key: uploaded.key,
        });
      }
    }

    if (location_files.length && created_task.location) {
      if (!created_task.location.photos) created_task.location.photos = [];
      if (!created_task.location.photo_keys)
        created_task.location.photo_keys = [];
      for (const file of location_files) {
        const key = `${base_key}/location/${created_task._id}/${file.filename}`;
        const uploaded = await upload_file_to_s3(file, key);
        created_task.location.photos.push(uploaded.url);
        created_task.location.photo_keys.push(uploaded.key);
      }
    }

    if (checklist_files.length) {
      for (const checklist of created_task.checklists) {
        for (const item of checklist.items) {
          const uploaded_files = [];
          const uploaded_keys = [];
          for (const filename of item.files) {
            const original_file = checklist_files.find(
              (f) => f.filename === filename,
            );
            if (!original_file) continue;
            const key = `${base_key}/checklist/${created_task._id}/${filename}`;
            const uploaded = await upload_file_to_s3(original_file, key);
            uploaded_files.push(uploaded.url);
            uploaded_keys.push(uploaded.key);
          }
          item.files = uploaded_files;
          item.file_keys = uploaded_keys;
        }
      }
    }

    // Board-level log for task creation
    board.activity_log.push(
      make_log("task", "created", user_id, [
        {
          previous_value: null,
          new_value: {
            task_id: created_task._id,
            title: created_task.title,
            tasklist_id,
          },
        },
      ]),
    );

    await board.save();

    // ── MAIL ──────────────────────────────────────────────
    notify_task_contacts(created_task.contacts, "created", {
      task_title: created_task.title,
      board_title: board.title,
    });

    // notify_task_contacts_sms(created_task.contacts, "created", {
    //   task_title: created_task.title,
    //   board_title: board.title,
    // });

    // ── END MAIL ──────────────────────────────────────────

    return res.status(201).json({
      status: "success",
      message: "Task added successfully.",
      data: created_task,
    });
  } catch (err) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= EDIT TASK ON TASKLIST ================= */
export const handle_edit_task_on_tasklist = async (req, res) => {
  try {
    const { user } = await get_admin_user(req);
    if (!user) {
      clear_temp_files(req.files);
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const { board_id, tasklist_id, task_id } = req.params;
    const {
      title,
      description,
      category,
      label,
      priority,
      checklists,
      attendance,
      clock_in_out,
      contacts,
      deadline,
      invoices,
      custom_fields,
      location,
      form_definition,
      assignees,
      companies,
      existing_attachments,
      existing_location_photos,
    } = req.body;

    const board = await board_model.findById(board_id);
    if (!board) {
      clear_temp_files(req.files);
      return res.status(404).json({ message: "Board not found." });
    }

    const task_list = board.task_lists.id(tasklist_id);
    if (!task_list) {
      clear_temp_files(req.files);
      return res.status(404).json({ message: "Task list not found." });
    }

    const task = task_list.tasks.id(task_id);
    if (!task) {
      clear_temp_files(req.files);
      return res.status(404).json({ message: "Task not found." });
    }

    const safe_parse = (data) => {
      try {
        return data ? JSON.parse(data) : null;
      } catch {
        return null;
      }
    };

    const parsed_label = safe_parse(label);
    const parsed_contacts = safe_parse(contacts);
    const parsed_invoices = safe_parse(invoices);
    const parsed_custom_fields = safe_parse(custom_fields);
    const parsed_location = safe_parse(location);
    const parsed_checklists = safe_parse(checklists);
    const parsed_attendance = safe_parse(attendance);
    const parsed_clock_in_out = safe_parse(clock_in_out);
    const parsed_deadline = safe_parse(deadline);
    const parsed_form_definition = safe_parse(form_definition);
    const parsed_assignees = safe_parse(assignees);
    const parsed_companies = safe_parse(companies);
    const parsed_existing_attachments = safe_parse(existing_attachments);
    const parsed_existing_location_photos = safe_parse(
      existing_location_photos,
    );

    // Build change log
    const changes = [];
    const track = (field, prev, next) => {
      if (next !== null && next !== undefined) {
        changes.push({
          previous_value: { [field]: prev },
          new_value: { [field]: next },
        });
      }
    };

    if (title && title.trim() !== task.title)
      track("title", task.title, title.trim());
    if (description !== undefined)
      track("description", task.description, description);
    if (category && category !== task.category)
      track("category", task.category, category);
    if (priority !== undefined) track("priority", task.priority, priority);
    if (parsed_label) track("label", task.label, parsed_label);
    if (parsed_contacts) track("contacts", task.contacts, parsed_contacts);
    if (parsed_invoices) track("invoices", task.invoices, parsed_invoices);
    if (parsed_deadline) track("deadline", task.deadline, parsed_deadline);
    if (parsed_assignees) track("assignees", task.assignees, parsed_assignees);
    if (parsed_companies) track("companies", task.companies, parsed_companies);

    if (title && title.trim()) task.title = title.trim();
    if (description !== undefined) task.description = description;
    if (category) task.category = category;
    if (parsed_label) task.label = parsed_label;
    if (priority !== undefined) task.priority = priority;
    if (parsed_contacts) task.contacts = parsed_contacts;
    if (parsed_invoices) task.invoices = parsed_invoices;
    if (parsed_custom_fields) task.custom_fields = parsed_custom_fields;
    if (parsed_attendance) task.attendance = parsed_attendance;
    if (parsed_clock_in_out) task.clock_in_out = parsed_clock_in_out;
    if (parsed_deadline) task.deadline = parsed_deadline;
    if (parsed_location) task.location = parsed_location;
    if (parsed_form_definition) task.form_definition = parsed_form_definition;
    if (parsed_assignees) task.assignees = parsed_assignees;
    if (parsed_companies) task.companies = parsed_companies;

    const attachment_files = req.files?.attachments || [];
    const location_files = req.files?.location_photos || [];
    const checklist_files = req.files?.checklist_files || [];
    const base_key = `workspace/${board.workspace}/vendor/${board.vendor}/board/${board._id}`;

    if (parsed_existing_attachments) {
      const removed = (task.attachments || []).filter(
        (a) => !parsed_existing_attachments.includes(a.filename),
      );
      for (const file of removed) await delete_file_from_s3(file.key);
      task.attachments = (task.attachments || []).filter((a) =>
        parsed_existing_attachments.includes(a.filename),
      );
    }

    if (parsed_existing_location_photos && task.location) {
      const removed_keys = (task.location.photo_keys || []).filter(
        (_, i) =>
          !parsed_existing_location_photos.includes(task.location.photos[i]),
      );
      for (const key of removed_keys) await delete_file_from_s3(key);
      task.location.photos = parsed_existing_location_photos;
      task.location.photo_keys = (task.location.photo_keys || []).filter(
        (_, i) =>
          parsed_existing_location_photos.includes(task.location.photos[i]),
      );
    }

    if (parsed_checklists) {
      const previous_keys =
        task.checklists?.flatMap((c) =>
          c.items?.flatMap((i) => i.file_keys || []),
        ) || [];

      const mapped_checklists = parsed_checklists.map((checklist) => ({
        title: checklist.title,
        items: checklist.items.map((item) => ({
          text: item.text,
          completed: item.completed || false,
          item_deadline: item.item_deadline || null,
          contacts: item.contacts || [],
          files: item.existing_files || [],
          file_keys: item.existing_file_keys || [],
          _new_file_indexes: item.file_indexes || [],
        })),
      }));

      for (const checklist of mapped_checklists) {
        for (const item of checklist.items) {
          for (const idx of item._new_file_indexes) {
            const file = checklist_files[idx];
            if (!file) continue;
            const key = `${base_key}/checklist/${task._id}/${file.filename}`;
            const uploaded = await upload_file_to_s3(file, key);
            item.files.push(uploaded.url);
            item.file_keys.push(uploaded.key);
          }
          delete item._new_file_indexes;
        }
      }

      const updated_keys = mapped_checklists.flatMap((c) =>
        c.items.flatMap((i) => i.file_keys),
      );
      const removed_keys = previous_keys.filter(
        (k) => !updated_keys.includes(k),
      );
      for (const key of removed_keys) await delete_file_from_s3(key);

      task.checklists = mapped_checklists;
    }

    if (!task.attachments) task.attachments = [];
    if (attachment_files.length) {
      for (const file of attachment_files) {
        const key = `${base_key}/attachment/${task._id}/${file.filename}`;
        const uploaded = await upload_file_to_s3(file, key);
        task.attachments.push({ filename: uploaded.url, key: uploaded.key });
      }
    }

    if (location_files.length && task.location) {
      if (!task.location.photos) task.location.photos = [];
      if (!task.location.photo_keys) task.location.photo_keys = [];
      for (const file of location_files) {
        const key = `${base_key}/location/${task._id}/${file.filename}`;
        const uploaded = await upload_file_to_s3(file, key);
        task.location.photos.push(uploaded.url);
        task.location.photo_keys.push(uploaded.key);
      }
    }

    // Log on both task and board
    const log_entry = make_log("task", "updated", user._id, changes);
    task.activity_log.push(log_entry);
    board.activity_log.push({
      ...log_entry,
      changes: [
        {
          previous_value: { task_id, tasklist_id },
          new_value: { task_id, tasklist_id },
        },
        ...changes,
      ],
    });

    await board.save();

    // ── MAIL ──────────────────────────────────────────────
    notify_task_contacts(task.contacts, "updated", {
      task_title: task.title,
      board_title: board.title,
      // derive readable field names from the changes array built earlier
      changed_fields: changes.map((c) => Object.keys(c.new_value)[0]),
    });

    // notify_task_contacts_sms(task.contacts, "updated", {
    //   task_title: task.title,
    //   board_title: board.title,
    //   // derive readable field names from the changes array built earlier
    //   changed_fields: changes.map((c) => Object.keys(c.new_value)[0]),
    // });

    // ── END MAIL ──────────────────────────────────────────

    return res.status(200).json({
      status: "success",
      message: "Task updated successfully.",
      data: task,
    });
  } catch (err) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= DELETE TASK FROM TASKLIST ================= */
export const handle_delete_task_from_tasklist = async (req, res) => {
  try {
    const { user } = await get_admin_user(req);
    if (!user)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const { board_id, tasklist_id, task_id } = req.params;

    const board = await board_model.findById(board_id);
    if (!board) return res.status(404).json({ message: "Board not found." });

    const task_list = board.task_lists.find(
      (tl) => tl._id.toString() === tasklist_id,
    );
    if (!task_list)
      return res.status(404).json({ message: "Task list not found." });

    const deleted_task = task_list.tasks.find(
      (t) => t._id.toString() === task_id,
    );

    task_list.tasks = task_list.tasks.filter(
      (t) => t._id.toString() !== task_id,
    );

    board.activity_log.push(
      make_log("task", "deleted", user._id, [
        {
          previous_value: { task_id, title: deleted_task?.title, tasklist_id },
          new_value: null,
        },
      ]),
    );

    await board.save();

    return res
      .status(200)
      .json({ status: "success", message: "Task deleted successfully." });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= DELETE TASKLIST FROM BOARD ================= */
export const handle_delete_tasklist_from_board = async (req, res) => {
  try {
    const { user } = await get_admin_user(req);
    if (!user)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const { board_id, tasklist_id } = req.params;

    const board = await board_model.findById(board_id);
    if (!board) return res.status(404).json({ message: "Board not found." });

    const deleted_list = board.task_lists.find(
      (tl) => tl._id.toString() === tasklist_id,
    );

    board.task_lists = board.task_lists.filter(
      (tl) => tl._id.toString() !== tasklist_id,
    );

    board.activity_log.push(
      make_log("tasklist", "deleted", user._id, [
        {
          previous_value: { tasklist_id, title: deleted_list?.title },
          new_value: null,
        },
      ]),
    );

    await board.save();

    return res
      .status(200)
      .json({ status: "success", message: "Task list deleted successfully." });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= COMPLETE TASK ================= */
export const handle_complete_task = async (req, res) => {
  try {
    // const { user } = await get_admin_user(req);
    // if (!user)
    //   return res.status(401).json({ status: "error", message: "Unauthorized" });

    const user_id = req.user_id;

    const { board_id, tasklist_id, task_id } = req.params;

    const board = await board_model.findById(board_id);
    if (!board) return res.status(404).json({ message: "Board not found." });

    const task_list = board.task_lists.id(tasklist_id);
    if (!task_list)
      return res.status(404).json({ message: "Task list not found." });

    const task = task_list.tasks.id(task_id);
    if (!task) return res.status(404).json({ message: "Task not found." });

    const prev = task.completed;
    task.completed = !task.completed;

    const log_entry = make_log("task", "completed", user_id, [
      {
        previous_value: { completed: prev },
        new_value: { completed: task.completed },
      },
    ]);
    task.activity_log.push(log_entry);
    board.activity_log.push({
      ...log_entry,
      changes: [
        {
          previous_value: { task_id, tasklist_id },
          new_value: { task_id, tasklist_id, completed: true },
        },
      ],
    });

    await board.save();

    // ── MAIL ──────────────────────────────────────────────
    notify_task_contacts(task.contacts, "completed", {
      task_title: task.title,
      board_title: board.title,
    });

    // notify_task_contacts_sms(task.contacts, "completed", {
    //   task_title: task.title,
    //   board_title: board.title,
    // });

    // ── END MAIL ──────────────────────────────────────────

    return res.status(200).json({
      status: "success",
      message: "Task completed successfully.",
      data: task,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= TOGGLE TASKLIST LOCK ================= */
export const handle_toggle_tasklist_lock = async (req, res) => {
  try {
    const { user } = await get_admin_user(req);
    if (!user)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const { board_id, tasklist_id } = req.params;

    const board = await board_model.findById(board_id);
    if (!board) return res.status(404).json({ message: "Board not found." });

    const task_list = board.task_lists.find(
      (tl) => tl._id.toString() === tasklist_id,
    );
    if (!task_list)
      return res.status(404).json({ message: "Task list not found." });

    const prev_locked = task_list.locked;
    task_list.locked = !task_list.locked;

    board.activity_log.push(
      make_log("tasklist", prev_locked ? "unlocked" : "locked", user._id, [
        {
          previous_value: { tasklist_id, locked: prev_locked },
          new_value: { tasklist_id, locked: task_list.locked },
        },
      ]),
    );

    await board.save();

    return res.status(200).json({
      status: "success",
      message: "Task list lock status updated successfully.",
      data: task_list,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= TOGGLE TASKLIST COMPLETION ================= */
export const handle_toggle_tasklist_completion = async (req, res) => {
  try {
    const { user } = await get_admin_user(req);
    if (!user)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const { board_id, tasklist_id } = req.params;

    const board = await board_model.findById(board_id);
    if (!board) return res.status(404).json({ message: "Board not found." });

    const task_list = board.task_lists.id(tasklist_id);
    if (!task_list)
      return res.status(404).json({ message: "Task list not found." });

    const prev_completed = task_list.completed;
    task_list.completed = !task_list.completed;

    board.activity_log.push(
      make_log(
        "tasklist",
        task_list.completed ? "completed" : "reopened",
        user._id,
        [
          {
            previous_value: { tasklist_id, completed: prev_completed },
            new_value: { tasklist_id, completed: task_list.completed },
          },
        ],
      ),
    );

    await board.save();

    return res.status(200).json({
      status: "success",
      message: "Task list completion status updated successfully.",
      data: task_list,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= UPDATE ASSIGNED MEMBERS TO TASKLIST ================= */
export const handle_update_assigned_members_to_tasklist = async (req, res) => {
  try {
    const { user } = await get_admin_user(req);
    if (!user)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const { board_id, tasklist_id } = req.params;
    const { user_ids } = req.body;

    if (!user_ids || !Array.isArray(user_ids)) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid user IDs." });
    }

    const board = await board_model.findById(board_id);
    if (!board) return res.status(404).json({ message: "Board not found." });

    const task_list = board.task_lists.id(tasklist_id);
    if (!task_list)
      return res.status(404).json({ message: "Task list not found." });

    const prev_users = [...(task_list.assigned_users || [])];
    task_list.assigned_users = [...new Set([...prev_users, ...user_ids])];

    board.activity_log.push(
      make_log("tasklist", "members_updated", user._id, [
        {
          previous_value: { tasklist_id, assigned_users: prev_users },
          new_value: { tasklist_id, assigned_users: task_list.assigned_users },
        },
      ]),
    );

    await board.save();

    return res.status(200).json({
      status: "success",
      message: "Members added to task list successfully.",
      data: task_list,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= UPDATE ASSIGNED USERS TO BOARD ================= */
export const handle_update_assigned_users_to_board = async (req, res) => {
  try {
    const { user } = await get_admin_user(req);
    if (!user)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const { board_id } = req.params;
    const { user_ids } = req.body;

    if (!user_ids || !Array.isArray(user_ids)) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid user IDs." });
    }

    const board = await board_model.findById(board_id);
    if (!board) return res.status(404).json({ message: "Board not found." });

    const prev_users = [...(board.assigned_users || [])];
    board.assigned_users = [...new Set([...prev_users, ...user_ids])];

    board.activity_log.push(
      make_log("board", "members_updated", user._id, [
        {
          previous_value: { assigned_users: prev_users },
          new_value: { assigned_users: board.assigned_users },
        },
      ]),
    );

    await board.save();

    return res.status(200).json({
      status: "success",
      message: "Members added to board successfully.",
      data: board,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= GET COMMENTS ================= */
export const handle_get_comments = async (req, res) => {
  try {
    const { board_id, tasklist_id, task_id } = req.params;

    const board = await board_model.findById(board_id).populate({
      path: "task_lists.tasks.comments.created_by",
      model: "user",
    });
    if (!board) return res.status(404).json({ message: "Board not found." });

    const task_list = board.task_lists.id(tasklist_id);
    if (!task_list)
      return res.status(404).json({ message: "Task list not found." });

    const task = task_list.tasks.id(task_id);
    if (!task) return res.status(404).json({ message: "Task not found." });

    return res.status(200).json({
      status: "success",
      message: "Comments retrieved successfully.",
      data: task.comments,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= ADD COMMENT TO TASK ================= */
export const handle_add_comment_to_task = async (req, res) => {
  try {
    // const { user, user_id } = await get_admin_user(req);
    // if (!user)
    //   return res.status(401).json({ status: "error", message: "Unauthorized" });

    const { board_id, tasklist_id, task_id } = req.params;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res
        .status(400)
        .json({ status: "error", message: "Comment text is required." });
    }

    const board = await board_model.findById(board_id);
    if (!board) return res.status(404).json({ message: "Board not found." });

    const task_list = board.task_lists.id(tasklist_id);
    if (!task_list)
      return res.status(404).json({ message: "Task list not found." });

    const task = task_list.tasks.id(task_id);
    if (!task) return res.status(404).json({ message: "Task not found." });

    task.comments.push({ created_by: user_id, comment: comment.trim() });

    const log_entry = make_log("comment", "created", user_id, [
      { previous_value: null, new_value: { comment: comment.trim(), task_id } },
    ]);
    task.activity_log.push(log_entry);
    board.activity_log.push(log_entry);

    await board.save();

    return res.status(200).json({
      status: "success",
      message: "Comment added successfully.",
      data: task.comments,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= EDIT COMMENT ON TASK ================= */
export const handle_edit_comment_on_task = async (req, res) => {
  try {
    const { user, user_id } = await get_admin_user(req);
    if (!user)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const { board_id, tasklist_id, task_id, comment_id } = req.params;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res
        .status(400)
        .json({ status: "error", message: "Comment text is required." });
    }

    const board = await board_model.findById(board_id);
    if (!board)
      return res
        .status(404)
        .json({ status: "error", message: "Board not found." });

    const task_list = board.task_lists.id(tasklist_id);
    if (!task_list)
      return res
        .status(404)
        .json({ status: "error", message: "Task list not found." });

    const task = task_list.tasks.id(task_id);
    if (!task)
      return res
        .status(404)
        .json({ status: "error", message: "Task not found." });

    const task_comment = task.comments.id(comment_id);
    if (!task_comment)
      return res
        .status(404)
        .json({ status: "error", message: "Comment not found." });

    if (task_comment.created_by.toString() !== user_id) {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to edit this comment.",
      });
    }

    const prev_comment = task_comment.comment;
    task_comment.comment = comment.trim();

    const log_entry = make_log("comment", "updated", user_id, [
      {
        previous_value: { comment_id, comment: prev_comment },
        new_value: { comment_id, comment: comment.trim() },
      },
    ]);
    task.activity_log.push(log_entry);
    board.activity_log.push(log_entry);

    await board.save();

    return res.status(200).json({
      status: "success",
      message: "Comment edited successfully.",
      data: task.comments,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= DELETE COMMENT ON TASK ================= */
export const handle_delete_comment_on_task = async (req, res) => {
  try {
    const { user, user_id } = await get_admin_user(req);
    if (!user)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const { board_id, tasklist_id, task_id, comment_id } = req.params;

    const board = await board_model.findById(board_id);
    if (!board)
      return res
        .status(404)
        .json({ status: "error", message: "Board not found." });

    const task_list = board.task_lists.id(tasklist_id);
    if (!task_list)
      return res
        .status(404)
        .json({ status: "error", message: "Task list not found." });

    const task = task_list.tasks.id(task_id);
    if (!task)
      return res
        .status(404)
        .json({ status: "error", message: "Task not found." });

    const task_comment = task.comments.id(comment_id);
    if (!task_comment)
      return res
        .status(404)
        .json({ status: "error", message: "Comment not found." });

    if (task_comment.created_by.toString() !== user_id) {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to delete this comment.",
      });
    }

    const deleted_comment = task_comment.comment;
    task.comments = task.comments.filter(
      (c) => c._id.toString() !== comment_id,
    );

    const log_entry = make_log("comment", "deleted", user_id, [
      {
        previous_value: { comment_id, comment: deleted_comment },
        new_value: null,
      },
    ]);
    task.activity_log.push(log_entry);
    board.activity_log.push(log_entry);

    await board.save();

    return res.status(200).json({
      status: "success",
      message: "Comment deleted successfully.",
      data: task.comments,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= MOVE TASKLIST WITHIN BOARD ================= */
export const move_tasklist_within_board = async (req, res) => {
  try {
    const { user } = await get_admin_user(req);
    if (!user)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const { board_id } = req.params;
    const { source_index, destination_index } = req.body;

    if (
      !Number.isInteger(source_index) ||
      !Number.isInteger(destination_index) ||
      source_index < 0 ||
      destination_index < 0
    ) {
      return res.status(400).json({
        status: "error",
        message: "Invalid source or destination index.",
      });
    }

    const board = await board_model.findById(board_id);
    if (!board)
      return res
        .status(404)
        .json({ status: "error", message: "Board not found." });

    const task_lists = board.task_lists;
    if (
      source_index >= task_lists.length ||
      destination_index >= task_lists.length
    ) {
      return res.status(400).json({
        status: "error",
        message: "Source or destination index out of bounds.",
      });
    }

    const moved_title = task_lists[source_index].title;
    const [moved] = task_lists.splice(source_index, 1);
    task_lists.splice(destination_index, 0, moved);

    board.activity_log.push(
      make_log("tasklist", "reordered", user._id, [
        {
          previous_value: { title: moved_title, index: source_index },
          new_value: { title: moved_title, index: destination_index },
        },
      ]),
    );

    await board.save();

    return res.status(200).json({
      status: "success",
      message: "Task list moved successfully.",
      data: board.task_lists,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= MOVE TASK WITHIN BOARD ================= */
export const move_task_within_board = async (req, res) => {
  try {
    const { user } = await get_admin_user(req);
    if (!user)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const { board_id } = req.params;
    const {
      source_tasklist_id,
      destination_tasklist_id,
      source_index,
      destination_index,
    } = req.body;

    if (
      !Number.isInteger(source_index) ||
      !Number.isInteger(destination_index) ||
      source_index < 0 ||
      destination_index < 0
    ) {
      return res.status(400).json({
        status: "error",
        message: "Invalid source or destination index.",
      });
    }

    const board = await board_model.findById(board_id);
    if (!board)
      return res
        .status(404)
        .json({ status: "error", message: "Board not found." });

    const source_list = board.task_lists.id(source_tasklist_id);
    const destination_list = board.task_lists.id(destination_tasklist_id);

    if (!source_list || !destination_list) {
      return res
        .status(404)
        .json({ status: "error", message: "Task list not found." });
    }

    if (source_index >= source_list.tasks.length) {
      return res
        .status(400)
        .json({ status: "error", message: "Source index out of bounds." });
    }

    const moved_task_title = source_list.tasks[source_index].title;
    const moved_task_id = source_list.tasks[source_index]._id;
    const is_same_list = source_tasklist_id === destination_tasklist_id;

    if (is_same_list) {
      const [task] = source_list.tasks.splice(source_index, 1);
      const adjusted_index =
        source_index < destination_index
          ? destination_index - 1
          : destination_index;

      if (adjusted_index < 0 || adjusted_index > source_list.tasks.length) {
        return res.status(400).json({
          status: "error",
          message: "Destination index out of bounds.",
        });
      }

      source_list.tasks.splice(adjusted_index, 0, task);
    } else {
      if (destination_index > destination_list.tasks.length) {
        return res.status(400).json({
          status: "error",
          message: "Destination index out of bounds.",
        });
      }

      // make task completed false when moved across lists (optional, can be removed if not desired)
      source_list.tasks[source_index].completed = false;

      const [task] = source_list.tasks.splice(source_index, 1);
      destination_list.tasks.splice(destination_index, 0, task);

      // Log on task as well when moved across lists
      const moved_task = destination_list.tasks[destination_index];
      moved_task.activity_log.push(
        make_log("task", "moved", user._id, [
          {
            previous_value: {
              tasklist_id: source_tasklist_id,
              index: source_index,
            },
            new_value: {
              tasklist_id: destination_tasklist_id,
              index: destination_index,
            },
          },
        ]),
      );
    }

    board.activity_log.push(
      make_log("task", is_same_list ? "reordered" : "moved", user._id, [
        {
          previous_value: {
            task_id: moved_task_id,
            title: moved_task_title,
            tasklist_id: source_tasklist_id,
            index: source_index,
          },
          new_value: {
            task_id: moved_task_id,
            title: moved_task_title,
            tasklist_id: destination_tasklist_id,
            index: destination_index,
          },
        },
      ]),
    );

    await board.save();

    // ── MAIL (cross-list moves only) ──────────────────────
    if (!is_same_list) {
      const moved_task = destination_list.tasks[destination_index];
      notify_task_contacts(moved_task.contacts, "moved", {
        task_title: moved_task.title,
        board_title: board.title,
        from_list: source_list.title,
        to_list: destination_list.title,
      });
      // notify_task_contacts_sms(moved_task.contacts, "moved", {
      //   task_title: moved_task.title,
      //   board_title: board.title,
      //   from_list: source_list.title,
      //   to_list: destination_list.title,
      // });
    }
    // ── END MAIL ──────────────────────────────────────────

    return res.status(200).json({
      status: "success",
      message: "Task moved successfully.",
      data: board.task_lists,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

export const handle_clone_task = async (req, res) => {
  try {
    const user_id = req.user_id;
    const { board_id, tasklist_id, task_id } = req.params;

    const board = await board_model.findById(board_id);
    if (!board) return res.status(404).json({ message: "Board not found." });

    const task_list = board.task_lists.id(tasklist_id);
    if (!task_list)
      return res.status(404).json({ message: "Task list not found." });

    const task = task_list.tasks.id(task_id);
    if (!task) return res.status(404).json({ message: "Task not found." });

    const cloned_task = task.toObject();
    cloned_task._id = undefined;
    cloned_task.title += " (Clone)";
    cloned_task.completed = false;

    // Guard: ensure required 'category' field exists (missing on legacy documents)
    // if (!cloned_task.category) {
    //   return res.status(400).json({
    //     status: "error",
    //     message: "Original task is missing a category. Please update it before cloning.",
    //   });
    // }

    cloned_task.activity_log = [
      make_log("task", "cloned", user_id, [
        {
          previous_value: {
            task_id: task._id,
            title: task.title,
            tasklist_id: task_list._id,
          },
          new_value: {
            task_id: cloned_task._id,
            title: cloned_task.title,
            tasklist_id: task_list._id,
          },
        },
      ]),
    ];

    task_list.tasks.push(cloned_task);
    await board.save();

    return res.status(201).json({
      status: "success",
      message: "Task cloned successfully.",
      data: cloned_task,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

export const handle_clone_tasklist = async (req, res) => {
  try {
    const user_id = req.user_id;
    const { board_id, tasklist_id } = req.params;

    const board = await board_model.findById(board_id);
    if (!board) return res.status(404).json({ message: "Board not found." });

    const task_list = board.task_lists.id(tasklist_id);
    if (!task_list)
      return res.status(404).json({ message: "Task list not found." });

    const cloned_list = task_list.toObject();
    cloned_list._id = undefined;
    cloned_list.title += " (Clone)";
    cloned_list.completed = false;

    // Clone each task under the list with a fresh _id
    cloned_list.tasks = task_list.tasks.map((task) => ({
      ...task.toObject(),
      _id: undefined,
    }));

    cloned_list.activity_log = [
      make_log("tasklist", "cloned", user_id, [
        {
          previous_value: {
            tasklist_id: task_list._id,
            title: task_list.title,
          },
          new_value: {
            tasklist_id: cloned_list._id,
            title: cloned_list.title,
          },
        },
      ]),
    ];

    // ✅ Fix: push into board.task_lists, not task_list.tasks
    board.task_lists.push(cloned_list);
    await board.save();

    return res.status(201).json({
      status: "success",
      message: "Task list cloned successfully.",
      data: cloned_list,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

// export const handle_add_module_permissions_on_domain_workspace = async (
//   req,
//   res,
// ) => {
//   const { domain_workspace_id } = req.params;
//   try {
//     const workspace =
//       await domain_workspace_model.findById(domain_workspace_id);
//     if (!workspace) {
//       return res.status(404).json({
//         status: "error",
//         message: "Domain workspace not found.",
//         error: "Invalid domain workspace ID",
//       });
//     }

//     const { users, permission_policies } = req.body;

//     if (!users || !permission_policies) {
//       return res.status(400).json({
//         status: "error",
//         message: "Module, user, and permission policies are required.",
//       });
//     }

//     const new_permissions = [];
//     for (const user of users) {
//       const new_permission = new permission_module_model({
//         module: "domain_workspace",
//         module_item_id: domain_workspace_id,
//         user,
//         permission_policies,
//       });
//       await new_permission.save();
//       new_permissions.push(new_permission);
//     }

//     return res.status(201).json({
//       status: "success",
//       message: "Module permissions added successfully.",
//       data: new_permissions,
//     });
//   } catch (err) {
//     return res.status(500).json({
//       status: "error",
//       message: "Internal server error.",
//       error: err.message,
//     });
//   }
// };

// export const handle_add_module_permissions_on_vendor_workspace = async (
//   req,
//   res,
// ) => {
//   const { vendor_workspace_id } = req.params;
//   try {
//     const workspace =
//       await vendor_workspace_model.findById(vendor_workspace_id);
//     if (!workspace) {
//       return res.status(404).json({
//         status: "error",
//         message: "Vendor workspace not found.",
//         error: "Invalid vendor workspace ID",
//       });
//     }

//     const { users, permission_policies } = req.body;

//     if (!users || !permission_policies) {
//       return res.status(400).json({
//         status: "error",
//         message: "Module, user, and permission policies are required.",
//       });
//     }

//     const new_permissions = [];
//     for (const user of users) {
//       const new_permission = new permission_module_model({
//         module: "vendor_workspace",
//         module_item_id: vendor_workspace_id,
//         user,
//         permission_policies,
//       });
//       await new_permission.save();
//       new_permissions.push(new_permission);
//     }

//     return res.status(201).json({
//       status: "success",
//       message: "Module permissions added successfully.",
//       data: new_permissions,
//     });
//   } catch (err) {
//     return res.status(500).json({
//       status: "error",
//       message: "Internal server error.",
//       error: err.message,
//     });
//   }
// };

// export const handle_get_permission_modules_for_domain_workspace = async (
//   req,
//   res,
// ) => {
//   const { domain_workspace_id } = req.params;
//   try {
//     const workspace =
//       await domain_workspace_model.findById(domain_workspace_id);
//     if (!workspace) {
//       return res.status(404).json({
//         status: "error",
//         message: "Domain workspace not found.",
//         error: "Invalid domain workspace ID",
//       });
//     }

//     const permission_modules = await permission_module_model
//       .find({
//         module: "domain_workspace",
//         module_item_id: domain_workspace_id,
//       })
//       .populate("user", "user_name user_email")
//       .populate("permission_policies");

//     return res.status(200).json({
//       status: "success",
//       message: "Permission modules fetched successfully.",
//       data: permission_modules,
//     });
//   } catch (err) {
//     return res.status(500).json({
//       status: "error",
//       message: "Internal server error.",
//       error: err.message,
//     });
//   }
// };

// export const handle_get_permission_modules_for_vendor_workspace = async (
//   req,
//   res,
// ) => {
//   const { vendor_workspace_id } = req.params;
//   try {
//     const workspace =
//       await vendor_workspace_model.findById(vendor_workspace_id);
//     if (!workspace) {
//       return res.status(404).json({
//         status: "error",
//         message: "Vendor workspace not found.",
//         error: "Invalid vendor workspace ID",
//       });
//     }

//     const permission_modules = await permission_module_model
//       .find({
//         module: "vendor_workspace",
//         module_item_id: vendor_workspace_id,
//       })
//       .populate("user", "user_name user_email")
//       .populate("permission_policies");

//     return res.status(200).json({
//       status: "success",
//       message: "Permission modules fetched successfully.",
//       data: permission_modules,
//     });
//   } catch (err) {
//     return res.status(500).json({
//       status: "error",
//       message: "Internal server error.",
//       error: err.message,
//     });
//   }
// };

export const handle_get_module_permissions_for_tasklist = async (req, res) => {
  const { board_id, tasklist_id } = req.params;
  try {
    const board = await board_model.findById(board_id);
    if (!board) {
      return res.status(404).json({
        status: "error",
        message: "Board not found.",
        error: "Invalid board ID",
      });
    }

    const task_list = board.task_lists.id(tasklist_id);
    if (!task_list) {
      return res.status(404).json({
        status: "error",
        message: "Task list not found.",
        error: "Invalid task list ID",
      });
    }

    const permission_modules = await permission_module_model
      .find({ module: "tasklist", module_item_id: tasklist_id })
      .populate("user", "user_name user_email")
      .populate("permission_policies");

    return res.status(200).json({
      status: "success",
      message: "Permission modules fetched successfully.",
      data: permission_modules,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

export const handle_get_module_permissions_for_task = async (req, res) => {
  const { board_id, tasklist_id, task_id } = req.params;
  try {
    const board = await board_model.findById(board_id);
    if (!board) {
      return res.status(404).json({
        status: "error",
        message: "Board not found.",
        error: "Invalid board ID",
      });
    }

    const task_list = board.task_lists.id(tasklist_id);
    if (!task_list) {
      return res.status(404).json({
        status: "error",
        message: "Task list not found.",
        error: "Invalid task list ID",
      });
    }

    const task = task_list.tasks.id(task_id);
    if (!task) {
      return res.status(404).json({
        status: "error",
        message: "Task not found.",
        error: "Invalid task ID",
      });
    }

    const permission_modules = await permission_module_model
      .find({ module: "task", module_item_id: task_id })
      .populate("user", "user_name user_email")
      .populate("permission_policies");

    return res.status(200).json({
      status: "success",
      message: "Permission modules fetched successfully.",
      data: permission_modules,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

export const handle_get_module_permissions_for_board = async (req, res) => {
  const { board_id } = req.params;
  try {
    const board = await board_model.findById(board_id);
    if (!board) {
      return res.status(404).json({
        status: "error",
        message: "Board not found.",
        error: "Invalid board ID",
      });
    }

    const permission_modules = await permission_module_model
      .find({ module: "board", module_item_id: board_id })
      .populate("user", "user_name user_email")
      .populate("permission_policies");

    return res.status(200).json({
      status: "success",
      message: "Permission modules fetched successfully.",
      data: permission_modules,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

export const handle_add_module_permissions_on_board = async (req, res) => {
  const { board_id } = req.params;

  try {
    const board = await board_model.findById(board_id);
    if (!board) {
      return res.status(404).json({
        status: "error",
        message: "Board not found.",
        error: "Invalid board ID",
      });
    }

    const { users, permission_policies } = req.body;

    if (
      !Array.isArray(users) ||
      users.length === 0 ||
      !Array.isArray(permission_policies) ||
      permission_policies.length === 0
    ) {
      return res.status(400).json({
        status: "error",
        message: "users and permission_policies must be non-empty arrays.",
      });
    }

    const updated_permissions = [];

    for (const user of users) {
      const updated_permission = await permission_module_model.findOneAndUpdate(
        {
          module: "board",
          module_item_id: board_id,
          user,
        },
        {
          $addToSet: {
            permission_policies: { $each: permission_policies },
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      );

      updated_permissions.push(updated_permission);
    }

    return res.status(200).json({
      status: "success",
      message: "Module permissions added successfully.",
      data: updated_permissions,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

export const handle_add_module_permissions_on_tasklist = async (req, res) => {
  const { board_id, tasklist_id } = req.params;

  try {
    const board = await board_model.findById(board_id);
    if (!board) {
      return res.status(404).json({
        status: "error",
        message: "Board not found.",
        error: "Invalid board ID",
      });
    }

    const task_list = board.task_lists.id(tasklist_id);
    if (!task_list) {
      return res.status(404).json({
        status: "error",
        message: "Task list not found.",
        error: "Invalid task list ID",
      });
    }

    const { users, permission_policies } = req.body;

    if (
      !Array.isArray(users) ||
      users.length === 0 ||
      !Array.isArray(permission_policies) ||
      permission_policies.length === 0
    ) {
      return res.status(400).json({
        status: "error",
        message: "users and permission_policies must be non-empty arrays.",
      });
    }

    const updated_permissions = [];

    for (const user of users) {
      const updated_permission = await permission_module_model.findOneAndUpdate(
        {
          module: "tasklist",
          module_item_id: tasklist_id,
          user,
        },
        {
          $addToSet: {
            permission_policies: { $each: permission_policies },
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      );

      updated_permissions.push(updated_permission);
    }

    return res.status(200).json({
      status: "success",
      message: "Module permissions added successfully.",
      data: updated_permissions,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

export const handle_add_module_permissions_on_task = async (req, res) => {
  const { board_id, tasklist_id, task_id } = req.params;

  try {
    const board = await board_model.findById(board_id);
    if (!board) {
      return res.status(404).json({
        status: "error",
        message: "Board not found.",
        error: "Invalid board ID",
      });
    }

    const task_list = board.task_lists.id(tasklist_id);
    if (!task_list) {
      return res.status(404).json({
        status: "error",
        message: "Task list not found.",
        error: "Invalid task list ID",
      });
    }

    const task = task_list.tasks.id(task_id);
    if (!task) {
      return res.status(404).json({
        status: "error",
        message: "Task not found.",
        error: "Invalid task ID",
      });
    }

    const { users, permission_policies } = req.body;

    if (
      !Array.isArray(users) ||
      users.length === 0 ||
      !Array.isArray(permission_policies) ||
      permission_policies.length === 0
    ) {
      return res.status(400).json({
        status: "error",
        message: "users and permission_policies must be non-empty arrays.",
      });
    }

    const updated_permissions = [];

    for (const user of users) {
      const updated_permission = await permission_module_model.findOneAndUpdate(
        {
          module: "task",
          module_item_id: task_id,
          user,
        },
        {
          $addToSet: {
            permission_policies: { $each: permission_policies },
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      );

      updated_permissions.push(updated_permission);
    }

    return res.status(200).json({
      status: "success",
      message: "Module permissions added successfully.",
      data: updated_permissions,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};
