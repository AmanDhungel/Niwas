import multer from "multer";
import { nanoid } from "nanoid";
import path from "path";
import express from "express";
import {
  handle_add_comment_to_task,
  handle_add_module_permissions_on_board,
  handle_add_module_permissions_on_task,
  handle_add_module_permissions_on_tasklist,
  handle_add_task_to_tasklist,
  handle_add_tasklist_to_board,
  handle_clone_task,
  handle_clone_tasklist,
  handle_complete_task,
  handle_create_board,
  handle_delete_comment_on_task,
  handle_delete_task_from_tasklist,
  handle_delete_tasklist_from_board,
  handle_edit_board,
  handle_edit_comment_on_task,
  handle_edit_task_on_tasklist,
  handle_edit_tasklist_on_board,
  handle_get_board,
  handle_get_boards,
  handle_get_comments,
  handle_get_module_permissions_for_board,
  handle_get_module_permissions_for_task,
  handle_get_module_permissions_for_tasklist,
  handle_toggle_tasklist_completion,
  handle_toggle_tasklist_lock,
  handle_update_assigned_members_to_tasklist,
  handle_update_assigned_users_to_board,
  move_task_within_board,
  move_tasklist_within_board,
} from "../../controllers/board/board.controller.js";
import check_permission_policy from "../../middlewares/permission_policy.middleware.js";

const boardFileUpload = multer({
  limits: { fileSize: 1000000 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
  storage: multer.diskStorage({
    destination: "../uploads/temporary/board/",
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${nanoid(32)}${ext}`);
    },
  }),
});

const boardFileSizeErrorHandler = (err, req, res, next) => {
  if (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "File size limit of 1MB exceeded!" });
    }
    return res.status(400).json({ message: err.message });
  }
  next();
};

const board_router = express.Router();

board_router.post(
  "/create_board",
  check_permission_policy({
    policies: "create:board",
  }),
  boardFileUpload.array("background_image_file", 3),
  boardFileSizeErrorHandler,
  handle_create_board,
);

board_router.post(
  "/edit_board/:board_id",
  check_permission_policy({
    policies: "edit:board",
  }),
  boardFileUpload.array("background_image_file", 3),
  boardFileSizeErrorHandler,
  handle_edit_board,
);

board_router.get(
  "/comments/:board_id/:tasklist_id/:task_id",
  handle_get_comments,
);

board_router.post(
  "/add_comment/:board_id/:tasklist_id/:task_id",
  handle_add_comment_to_task,
);

board_router.post(
  "/edit_comment/:board_id/:tasklist_id/:task_id/:comment_id",
  handle_edit_comment_on_task,
);

board_router.post(
  "/delete_comment/:board_id/:tasklist_id/:task_id/:comment_id",
  handle_delete_comment_on_task,
);

board_router.get(
  "/vendor_boards/:vendor_workspace_id",
  check_permission_policy({
    policies: "view:boards",
    module: "board",
    module_any: true,
  }),
  handle_get_boards,
);

board_router.get(
  "/:board_id",
  check_permission_policy({
    policies: ["view:boards", "view:tasklist", "view:task"],
    module: "board",
    module_any: true,
  }),
  handle_get_board,
);

board_router.post(
  "/add_tasklist/:board_id",
  check_permission_policy({
    policies: "create:tasklist",
  }),
  handle_add_tasklist_to_board,
);

board_router.post(
  "/edit_tasklist/:board_id/:tasklist_id",
  handle_edit_tasklist_on_board,
);

board_router.post(
  "/add_task/:board_id/:tasklist_id",
  check_permission_policy({
    policies: "create:task",
  }),
  boardFileUpload.fields([
    { name: "attachments", maxCount: 10 },
    { name: "location_photos", maxCount: 10 },
    { name: "checklist_files", maxCount: 10 },
  ]),
  boardFileSizeErrorHandler,
  handle_add_task_to_tasklist,
);

board_router.post(
  "/edit_task/:board_id/:tasklist_id/:task_id",
  boardFileUpload.fields([
    { name: "attachments", maxCount: 10 },
    { name: "location_photos", maxCount: 10 },
    { name: "checklist_files", maxCount: 20 },
  ]),
  boardFileSizeErrorHandler,
  handle_edit_task_on_tasklist,
);

board_router.post(
  "/delete_tasklist/:board_id/:tasklist_id",
  handle_delete_tasklist_from_board,
);

board_router.post(
  "/delete_task/:board_id/:tasklist_id/:task_id",
  handle_delete_task_from_tasklist,
);

board_router.post(
  "/complete_task/:board_id/:tasklist_id/:task_id",
  check_permission_policy({
    policies: "complete:task",
  }),
  handle_complete_task,
);

board_router.post(
  "/move_tasklist/:board_id",
  check_permission_policy({
    policies: "move:tasklist_within_board",
  }),
  move_tasklist_within_board,
);

board_router.post(
  "/toggle_tasklist_lock/:board_id/:tasklist_id",
  handle_toggle_tasklist_lock,
);

board_router.post(
  "/toggle_tasklist_completion/:board_id/:tasklist_id",
  handle_toggle_tasklist_completion,
);

board_router.post(
  "/update_assigned_members_to_tasklist/:board_id/:tasklist_id",
  handle_update_assigned_members_to_tasklist,
);

board_router.post(
  "/update_assigned_users_on_board/:board_id",
  handle_update_assigned_users_to_board,
);

board_router.post(
  "/move_task/:board_id",
  check_permission_policy({
    policies: "move:task_within_board",
  }),
  move_task_within_board,
);

board_router.post(
  "/clone_task/:board_id/:tasklist_id/:task_id",
  handle_clone_task,
);

board_router.post(
  "/clone_tasklist/:board_id/:tasklist_id",
  handle_clone_tasklist,
);

board_router.post(
  "/add_module_permissions/tasklist/:board_id/:tasklist_id",
  check_permission_policy({
    policies: "manage:tasklist_permission",
  }),
  handle_add_module_permissions_on_tasklist,
);

board_router.post(
  "/add_module_permissions/task/:board_id/:tasklist_id/:task_id",
  check_permission_policy({
    policies: "manage:task_permission",
  }),
  handle_add_module_permissions_on_task,
);

board_router.get(
  "/module_permissions/tasklist/:board_id/:tasklist_id",
  handle_get_module_permissions_for_tasklist,
);

board_router.get(
  "/module_permissions/task/:board_id/:tasklist_id/:task_id",
  handle_get_module_permissions_for_task,
);

board_router.get(
  "/module_permissions/board/:board_id",
  handle_get_module_permissions_for_board,
);

board_router.post(
  "/add_module_permissions/board/:board_id",
  check_permission_policy({
    policies: "manage:board_permission",
  }),
  handle_add_module_permissions_on_board,
);

export default board_router;
