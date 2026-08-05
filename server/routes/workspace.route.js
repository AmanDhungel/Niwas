import multer from "multer";
import { nanoid } from "nanoid";
import path from "path";
import express from "express";
import {
  handle_add_module_permissions_on_domain_workspace,
  handle_add_module_permissions_on_vendor_workspace,
  handle_create_domain_workspace,
  handle_create_vendor_workspace,
  handle_edit_domain_workspace,
  handle_edit_vendor_workspace,
  handle_get_domain_workspace,
  handle_get_domain_workspaces,
  handle_get_permission_modules_for_domain_workspace,
  handle_get_permission_modules_for_vendor_workspace,
  handle_get_vendor_workspace,
  handle_get_vendor_workspaces,
  handle_update_assigned_users_on_domain_workspace,
  handle_update_assigned_users_on_vendor_workspace,
} from "../controllers/workspace/workspace.controller.js";
import check_permission_policy from "../middlewares/permission_policy.middleware.js";

const workspaceFileUpload = multer({
  dest: "../uploads/temporary/user/",
  limits: { fileSize: 1000000 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
      return cb(new Error("Only image files are allowed !"), false);
    }
    cb(null, true);
  },
  storage: multer.diskStorage({
    destination: "../uploads/temporary/user/",
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      const randomName = `${nanoid(32)}`;
      cb(null, randomName + ext);
    },
  }),
});

const workspaceFileSizeErrorHandler = (err, req, res, next) => {
  if (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ message: "File size limit of 1MB exceeded !" });
    } else {
      res.status(400).json({ message: err.message });
    }
  } else {
    next();
  }
};

const workspace_router = express.Router();

workspace_router.post(
  "/update_assigned_users/vendor_workspace/:vendor_workspace_id",
  handle_update_assigned_users_on_vendor_workspace,
);

workspace_router.post(
  "/update_assigned_users/domain_workspace/:domain_workspace_id",
  handle_update_assigned_users_on_domain_workspace,
);

workspace_router.post(
  "/create_domain_workspace",
  workspaceFileUpload.fields([
    { name: "image_file", maxCount: 1 },
    { name: "icon_file", maxCount: 1 },
  ]),
  workspaceFileSizeErrorHandler,
  handle_create_domain_workspace,
);

workspace_router.post(
  "/edit_domain_workspace/:domain_workspace_id",
  workspaceFileUpload.fields([
    { name: "image_file", maxCount: 1 },
    { name: "icon_file", maxCount: 1 },
  ]),
  workspaceFileSizeErrorHandler,
  handle_edit_domain_workspace,
);

workspace_router.get(
  "/",
  check_permission_policy({
    policies: "view:domain_workspaces",
    module: "domain_workspace",
    module_any: true,
  }),
  handle_get_domain_workspaces,
);

workspace_router.get(
  "/domain/:domain_workspace_id",
  check_permission_policy({
    policies: "view:domain_workspaces",
    source: "all",
    module: "domain_workspace",
    module_id_key: "domain_workspace_id",
    module_id_source: "params",
  }),
  handle_get_domain_workspace,
);

workspace_router.get(
  "/vendor_workspaces/:domain_workspace_id",
  check_permission_policy({
    policies: "view:vendor_workspaces",
    module: "vendor_workspace",
    module_any: true,
  }),
  handle_get_vendor_workspaces,
);

workspace_router.get(
  "/vendor_workspace/:vendor_workspace_id",
  check_permission_policy({
    policies: "view:vendor_workspaces",
    source: "all",
    module: "vendor_workspace",
    module_id_key: "vendor_workspace_id",
    module_id_source: "params",
  }),
  handle_get_vendor_workspace,
);

workspace_router.post(
  "/create_vendor_workspace",
  workspaceFileUpload.fields([{ name: "logo_file", maxCount: 1 }]),
  workspaceFileSizeErrorHandler,
  handle_create_vendor_workspace,
);

workspace_router.post(
  "/edit_vendor_workspace/:vendor_workspace_id",
  workspaceFileUpload.fields([{ name: "logo_file", maxCount: 1 }]),
  workspaceFileSizeErrorHandler,
  handle_edit_vendor_workspace,
);

workspace_router.post(
  "/add_module_permissions/domain_workspace/:domain_workspace_id",
  check_permission_policy({
    policies: "manage:domain_workspace_permission",
  }),
  handle_add_module_permissions_on_domain_workspace,
);

workspace_router.post(
  "/add_module_permissions/vendor_workspace/:vendor_workspace_id",
  check_permission_policy({
    policies: "manage:vendor_workspace_permission",
  }),
  handle_add_module_permissions_on_vendor_workspace,
);

workspace_router.get(
  "/module_permissions/domain_workspace/:domain_workspace_id",
  handle_get_permission_modules_for_domain_workspace,
);

workspace_router.get(
  "/module_permissions/vendor_workspace/:vendor_workspace_id",
  handle_get_permission_modules_for_vendor_workspace,
);

export default workspace_router;
