import user_model from "../../models/user.model.js";
import domain_workspace_model from "../../models/workspace/domain_workspace.model.js";
import vendor_workspace_model from "../../models/workspace/vendor_workspace.model.js";
import {
  upload_file_to_s3,
  delete_file_from_s3,
  build_s3_key,
  clear_temp_files,
} from "../../utils/s3.util.js";
import permission_module_model from "../../models/iam/permission_module.model.js";

/* ================= CREATE DOMAIN WORKSPACE ================= */
export const handle_create_domain_workspace = async (req, res) => {
  try {
    // const { user } = await get_admin_user(req);
    // if (!user) {
    //   clear_temp_files(req.files);
    //   return res.status(401).json({
    //     status: "error",
    //     message: "You are not authorized to perform this action.",
    //     error: "Unauthorized",
    //   });
    // }

    const { title } = req.body;

    if (!title || !title.trim()) {
      clear_temp_files(req.files);
      return res.status(400).json({
        status: "error",
        message: "Domain workspace title is required.",
        error: "Title missing",
      });
    }

    const workspace = await domain_workspace_model.create({
      title: title.trim(),
    });

    const image_file = req.files?.image_file?.[0] || null;
    const icon_file = req.files?.icon_file?.[0] || null;

    if (image_file) {
      const key = build_s3_key(
        "workspace",
        workspace._id.toString(),
        "",
        image_file.filename,
      );
      const uploaded = await upload_file_to_s3(image_file, key);
      workspace.image = uploaded.url;
      workspace.image_key = uploaded.key;
    }

    if (icon_file) {
      const key = build_s3_key(
        "workspace",
        workspace._id.toString(),
        "",
        icon_file.filename,
      );
      const uploaded = await upload_file_to_s3(icon_file, key);
      workspace.icon = uploaded.url;
      workspace.icon_key = uploaded.key;
    }

    await workspace.save();

    return res.status(201).json({
      status: "success",
      message: "Domain workspace created successfully.",
      data: workspace,
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

/* ================= EDIT DOMAIN WORKSPACE ================= */
export const handle_edit_domain_workspace = async (req, res) => {
  try {
    // const { user } = await get_admin_user(req);
    // if (!user) {
    //   clear_temp_files(req.files);
    //   return res.status(401).json({
    //     status: "error",
    //     message: "You are not authorized to perform this action.",
    //     error: "Unauthorized",
    //   });
    // }

    const { domain_workspace_id } = req.params;

    const workspace =
      await domain_workspace_model.findById(domain_workspace_id);
    if (!workspace) {
      clear_temp_files(req.files);
      return res.status(404).json({
        status: "error",
        message: "Domain workspace not found.",
        error: "Invalid domain workspace ID",
      });
    }

    const { title } = req.body;
    if (title && title.trim()) workspace.title = title.trim();

    const image_file = req.files?.image_file?.[0] || null;
    const icon_file = req.files?.icon_file?.[0] || null;

    if (image_file) {
      await delete_file_from_s3(workspace.image_key);
      const key = build_s3_key(
        "workspace",
        workspace._id.toString(),
        "",
        image_file.filename,
      );
      const uploaded = await upload_file_to_s3(image_file, key);
      workspace.image = uploaded.url;
      workspace.image_key = uploaded.key;
    }

    if (icon_file) {
      await delete_file_from_s3(workspace.icon_key);
      const key = build_s3_key(
        "workspace",
        workspace._id.toString(),
        "",
        icon_file.filename,
      );
      const uploaded = await upload_file_to_s3(icon_file, key);
      workspace.icon = uploaded.url;
      workspace.icon_key = uploaded.key;
    }

    await workspace.save();

    return res.status(200).json({
      status: "success",
      message: "Domain workspace updated successfully.",
      data: workspace,
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

/* ================= GET DOMAIN WORKSPACES ================= */
export const handle_get_domain_workspaces = async (req, res) => {
  try {
    const MODULE_CHECK_NEEDED = req.MODULE_CHECK_NEEDED || false;

    if (!MODULE_CHECK_NEEDED) {
      const workspaces = await domain_workspace_model.find();
      return res.status(200).json({
        status: "success",
        message: "Domain workspaces fetched successfully.",
        data: workspaces,
      });
    }

    const user_id = req.MODULE_USER_ID;
    const module = req.MODULE_NAME;

    const permission_modules = await permission_module_model
      .find({
        module: module,
        user: user_id,
      })
      .populate("permission_policies");

    const workspace_ids = permission_modules.filter((pm) => {
      const has_read_permission = pm.permission_policies.some(
        (policy) =>
          policy.policy === "view:domain_workspaces" && policy.type === "allow",
      );
      return has_read_permission;
    });

    const workspaces = await domain_workspace_model.find({
      _id: { $in: workspace_ids.map((pm) => pm.module_item_id) },
    });

    return res.status(200).json({
      status: "success",
      message: "Domain workspaces fetched successfully.",
      data: workspaces,
    });

    // const
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= GET DOMAIN WORKSPACE ================= */
export const handle_get_domain_workspace = async (req, res) => {
  try {
    const MODULE_CHECK_NEEDED = req.MODULE_CHECK_NEEDED || false;
    const { domain_workspace_id } = req.params;

    if (!MODULE_CHECK_NEEDED) {
      const workspace =
        await domain_workspace_model.findById(domain_workspace_id);
      if (!workspace) {
        return res.status(404).json({
          status: "error",
          message: "Domain workspace not found.",
          error: "Invalid domain workspace ID",
        });
      }

      return res.status(200).json({
        status: "success",
        message: "Domain workspace fetched successfully.",
        data: workspace,
      });
    }

    const user_id = req.MODULE_USER_ID;
    const module = req.MODULE_NAME;

    const permission_module = await permission_module_model
      .findOne({
        module: module,
        user: user_id,
        module_item_id: domain_workspace_id,
      })
      .populate("permission_policies");

    if (!permission_module) {
      return res.status(404).json({
        status: "error",
        message: "Domain workspace not found or access denied.",
        error: "Invalid domain workspace ID or insufficient permissions",
      });
    }

    const has_read_permission = permission_module.permission_policies.some(
      (policy) =>
        policy.policy === "view:domain_workspaces" && policy.type === "allow",
    );

    if (!has_read_permission) {
      return res.status(403).json({
        status: "error",
        message: "Access denied to this domain workspace.",
        error: "Insufficient permissions",
      });
    }

    const workspace =
      await domain_workspace_model.findById(domain_workspace_id);
    if (!workspace) {
      return res.status(404).json({
        status: "error",
        message: "Domain workspace not found.",
        error: "Invalid domain workspace ID",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Domain workspace fetched successfully.",
      data: workspace,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= GET VENDOR WORKSPACES ================= */
export const handle_get_vendor_workspaces = async (req, res) => {
  try {
    const MODULE_CHECK_NEEDED = req.MODULE_CHECK_NEEDED || false;
    const { domain_workspace_id } = req.params;

    if (!MODULE_CHECK_NEEDED) {
      const workspaces = await vendor_workspace_model.find({
        domain: domain_workspace_id,
      });
      return res.status(200).json({
        status: "success",
        message: "Vendor workspaces fetched successfully.",
        data: workspaces,
      });
    }

    const user_id = req.MODULE_USER_ID;
    const module = req.MODULE_NAME;

    const permission_modules = await permission_module_model
      .find({
        module: module,
        user: user_id,
      })
      .populate("permission_policies");

    const workspace_ids = permission_modules
      .filter((pm) => {
        const has_read_permission = pm.permission_policies.some(
          (policy) =>
            policy.policy === "view:vendor_workspaces" &&
            policy.type === "allow",
        );
        return has_read_permission;
      })
      .map((pm) => pm.module_item_id);

    const workspaces = await vendor_workspace_model.find({
      domain: domain_workspace_id,
      _id: { $in: workspace_ids },
    });

    return res.status(200).json({
      status: "success",
      message: "Vendor workspaces fetched successfully.",
      data: workspaces,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= GET VENDOR WORKSPACE ================= */
export const handle_get_vendor_workspace = async (req, res) => {
  try {
    const { vendor_workspace_id } = req.params;

    const workspace =
      await vendor_workspace_model.findById(vendor_workspace_id);
    if (!workspace) {
      return res.status(404).json({
        status: "error",
        message: "Vendor workspace not found.",
        error: "Invalid vendor workspace ID",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Vendor workspace fetched successfully.",
      data: workspace,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= CREATE VENDOR WORKSPACE ================= */
export const handle_create_vendor_workspace = async (req, res) => {
  try {
    const { name, domain, label_color, visibility } = req.body;

    if (!name || !name.trim()) {
      clear_temp_files(req.files);
      return res.status(400).json({
        status: "error",
        message: "Vendor workspace name is required.",
        error: "Name missing",
      });
    }

    if (!domain || !domain.trim()) {
      clear_temp_files(req.files);
      return res.status(400).json({
        status: "error",
        message: "Domain workspace ID is required.",
        error: "Domain missing",
      });
    }

    const domain_workspace = await domain_workspace_model.findById(
      domain.trim(),
    );
    if (!domain_workspace) {
      clear_temp_files(req.files);
      return res.status(404).json({
        status: "error",
        message: "Domain workspace not found.",
        error: "Invalid domain workspace ID",
      });
    }

    const vendor_workspace = await vendor_workspace_model.create({
      name: name.trim(),
      domain: domain.trim(),
      logo: null,
      logo_key: null,
      label_color: label_color || null,
      visibility: visibility || null,
    });

    const logo_file = req.files?.logo_file?.[0] || null;

    if (logo_file) {
      const key = build_s3_key(
        "workspace",
        domain_workspace._id.toString(),
        `vendor/${vendor_workspace._id.toString()}`,
        logo_file.filename,
      );
      const uploaded = await upload_file_to_s3(logo_file, key);
      vendor_workspace.logo = uploaded.url;
      vendor_workspace.logo_key = uploaded.key;
      await vendor_workspace.save();
    }

    return res.status(201).json({
      status: "success",
      message: "Vendor workspace created successfully.",
      data: vendor_workspace,
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

/* ================= EDIT VENDOR WORKSPACE ================= */
export const handle_edit_vendor_workspace = async (req, res) => {
  try {
    const { vendor_workspace_id } = req.params;

    const workspace =
      await vendor_workspace_model.findById(vendor_workspace_id);
    if (!workspace) {
      clear_temp_files(req.files);
      return res.status(404).json({
        status: "error",
        message: "Vendor workspace not found.",
        error: "Invalid vendor workspace ID",
      });
    }

    const { name, label_color, visibility } = req.body;

    if (name && name.trim()) workspace.name = name.trim();
    if (label_color) workspace.label_color = label_color;
    if (visibility) workspace.visibility = visibility;

    const logo_file = req.files?.logo_file?.[0] || null;

    if (logo_file) {
      const domain_workspace = await domain_workspace_model.findById(
        workspace.domain,
      );

      await delete_file_from_s3(workspace.logo_key);

      const key = build_s3_key(
        "workspace",
        domain_workspace._id.toString(),
        `vendor/${workspace._id.toString()}`,
        logo_file.filename,
      );
      const uploaded = await upload_file_to_s3(logo_file, key);
      workspace.logo = uploaded.url;
      workspace.logo_key = uploaded.key;
    }

    await workspace.save();

    return res.status(200).json({
      status: "success",
      message: "Vendor workspace updated successfully.",
      data: workspace,
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

/* ================= UPDATE ASSIGNED USERS: VENDOR ================= */
export const handle_update_assigned_users_on_vendor_workspace = async (
  req,
  res,
) => {
  try {
    const { vendor_workspace_id } = req.params;

    const workspace =
      await vendor_workspace_model.findById(vendor_workspace_id);
    if (!workspace) {
      return res.status(404).json({
        status: "error",
        message: "Vendor workspace not found.",
        error: "Invalid vendor workspace ID",
      });
    }

    if (typeof req.body.assigned_users !== "string") {
      return res.status(400).json({
        status: "error",
        message: "assigned_users must be a JSON string array.",
      });
    }
    const parsed_assigned_users = JSON.parse(req.body.assigned_users);

    if (!Array.isArray(parsed_assigned_users)) {
      return res.status(400).json({
        status: "error",
        message: "Assigned users must be an array of user IDs.",
        error: "Invalid assigned users format",
      });
    }

    const valid_users = await user_model.find({
      _id: { $in: parsed_assigned_users },
    });
    if (valid_users.length !== parsed_assigned_users.length) {
      return res.status(400).json({
        status: "error",
        message: "One or more user IDs are invalid.",
        error: "Invalid user IDs in assigned users",
      });
    }

    workspace.assigned_users = [
      ...new Set([
        ...(workspace.assigned_users || []).map(String),
        ...parsed_assigned_users,
      ]),
    ];
    await workspace.save();

    return res.status(200).json({
      status: "success",
      message: "Assigned users updated successfully.",
      data: workspace,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

/* ================= UPDATE ASSIGNED USERS: DOMAIN ================= */
export const handle_update_assigned_users_on_domain_workspace = async (
  req,
  res,
) => {
  try {
    const { domain_workspace_id } = req.params;

    const workspace =
      await domain_workspace_model.findById(domain_workspace_id);
    if (!workspace) {
      return res.status(404).json({
        status: "error",
        message: "Domain workspace not found.",
        error: "Invalid domain workspace ID",
      });
    }

    if (typeof req.body.assigned_users !== "string") {
      return res.status(400).json({
        status: "error",
        message: "assigned_users must be a JSON string array.",
      });
    }
    const parsed_assigned_users = JSON.parse(req.body.assigned_users);

    if (!Array.isArray(parsed_assigned_users)) {
      return res.status(400).json({
        status: "error",
        message: "Assigned users must be an array of user IDs.",
        error: "Invalid assigned users format",
      });
    }

    const valid_users = await user_model.find({
      _id: { $in: parsed_assigned_users },
    });
    if (valid_users.length !== parsed_assigned_users.length) {
      return res.status(400).json({
        status: "error",
        message: "One or more user IDs are invalid.",
        error: "Invalid user IDs in assigned users",
      });
    }

    workspace.assigned_users = [
      ...new Set([
        ...(workspace.assigned_users || []).map(String),
        ...parsed_assigned_users,
      ]),
    ];
    await workspace.save();

    return res.status(200).json({
      status: "success",
      message: "Assigned users updated successfully.",
      data: workspace,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Internal server error.",
      error: err.message,
    });
  }
};

export const handle_add_module_permissions_on_domain_workspace = async (
  req,
  res,
) => {
  const { domain_workspace_id } = req.params;

  try {
    const workspace = await domain_workspace_model.findById(domain_workspace_id);
    if (!workspace) {
      return res.status(404).json({
        status: "error",
        message: "Domain workspace not found.",
        error: "Invalid domain workspace ID",
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
          module: "domain_workspace",
          module_item_id: domain_workspace_id,
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

export const handle_add_module_permissions_on_vendor_workspace = async (
  req,
  res,
) => {
  const { vendor_workspace_id } = req.params;

  try {
    const workspace = await vendor_workspace_model.findById(vendor_workspace_id);
    if (!workspace) {
      return res.status(404).json({
        status: "error",
        message: "Vendor workspace not found.",
        error: "Invalid vendor workspace ID",
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
          module: "vendor_workspace",
          module_item_id: vendor_workspace_id,
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

export const handle_get_permission_modules_for_domain_workspace = async (
  req,
  res,
) => {
  const { domain_workspace_id } = req.params;
  try {
    const workspace =
      await domain_workspace_model.findById(domain_workspace_id);
    if (!workspace) {
      return res.status(404).json({
        status: "error",
        message: "Domain workspace not found.",
        error: "Invalid domain workspace ID",
      });
    }

    const permission_modules = await permission_module_model
      .find({
        module: "domain_workspace",
        module_item_id: domain_workspace_id,
      })
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

export const handle_get_permission_modules_for_vendor_workspace = async (
  req,
  res,
) => {
  const { vendor_workspace_id } = req.params;
  try {
    const workspace =
      await vendor_workspace_model.findById(vendor_workspace_id);
    if (!workspace) {
      return res.status(404).json({
        status: "error",
        message: "Vendor workspace not found.",
        error: "Invalid vendor workspace ID",
      });
    }

    const permission_modules = await permission_module_model
      .find({
        module: "vendor_workspace",
        module_item_id: vendor_workspace_id,
      })
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