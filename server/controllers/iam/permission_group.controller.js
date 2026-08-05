import jwt from "jsonwebtoken";
import user_model from "../../models/user.model.js";
import permission_group_model from "../../models/iam/permission_group.model.js";
import permission_policy_model from "../../models/iam/permission_policy.model.js";
import permission_log_model from "../../models/iam/permission_log.model.js";

/* ================= GET ALL PERMISSION GROUPS ================= */
export const handle_get_permission_groups = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    const { search } = req.query;

    const filter = {};
    if (search && search.trim() !== "") {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const permission_groups = await permission_group_model
      .find(filter)
      .populate("permission_policies", "name policy type")
      .populate("users", "user_name user_email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
      message: "Permission groups fetched successfully",
      total: permission_groups.length,
      data: permission_groups,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching permission groups",
      error: error.message,
    });
  }
};

/* ================= GET SINGLE PERMISSION GROUP ================= */
export const handle_get_permission_group = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    const { group_id } = req.params;

    const permission_group = await permission_group_model
      .findById(group_id)
      .populate("permission_policies", "name policy type description")
      .populate("users", "user_name user_email");

    if (!permission_group) {
      return res.status(404).json({
        status: "error",
        message: "Permission group not found.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Permission group fetched successfully",
      data: permission_group,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching permission group",
      error: error.message,
    });
  }
};

/* ================= CREATE PERMISSION GROUP ================= */
export const handle_create_permission_group = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    const {
      name,
      description,
      permission_policies: unparsed_permission_policies,
      users: unparsed_users,
    } = req.body;

    let permission_policies = JSON.parse(unparsed_permission_policies) || [];
    let users = JSON.parse(unparsed_users) || [];

    if (!name || name.trim() === "") {
      return res.status(400).json({
        status: "error",
        message: "Group name is required.",
      });
    }

    if (!description || description.trim() === "") {
      return res.status(400).json({
        status: "error",
        message: "Group description is required.",
      });
    }

    // Check duplicate group name
    const duplicate = await permission_group_model.findOne({
      name: { $regex: `^${name.trim()}$`, $options: "i" },
    });
    if (duplicate) {
      return res.status(409).json({
        status: "error",
        message: `A permission group named "${name.trim()}" already exists.`,
      });
    }

    // Validate permission_policies if provided
    if (permission_policies !== undefined) {
      if (!Array.isArray(permission_policies)) {
        return res.status(400).json({
          status: "error",
          message: "permission_policies must be an array.",
        });
      }
      if (permission_policies.length > 0) {
        const existing_policies = await permission_policy_model
          .find({ _id: { $in: permission_policies } })
          .select("_id");
        const existing_ids = existing_policies.map((p) => p._id.toString());
        const invalid_ids = permission_policies.filter(
          (id) => !existing_ids.includes(id.toString()),
        );
        if (invalid_ids.length > 0) {
          return res.status(404).json({
            status: "error",
            message: "One or more permission policies not found.",
            invalid_ids,
          });
        }
      }
    }

    // Validate users if provided
    if (users !== undefined) {
      if (!Array.isArray(users)) {
        return res.status(400).json({
          status: "error",
          message: "users must be an array.",
        });
      }
      if (users.length > 0) {
        const existing_users = await user_model
          .find({ _id: { $in: users }, is_deleted: false })
          .select("_id");
        const existing_ids = existing_users.map((u) => u._id.toString());
        const invalid_ids = users.filter(
          (id) => !existing_ids.includes(id.toString()),
        );
        if (invalid_ids.length > 0) {
          return res.status(404).json({
            status: "error",
            message: "One or more users not found.",
            invalid_ids,
          });
        }
      }
    }

    const new_group = await permission_group_model.create({
      name: name.trim(),
      description: description.trim(),
      permission_policies: permission_policies || [],
      users: users || [],
    });

    const populated_group = await permission_group_model
      .findById(new_group._id)
      .populate("permission_policies", "name policy type")
      .populate("users", "user_name user_email");

    await permission_log_model.create({
      entity: "permission_groups",
      action: "created",
      performed_by: user_id,
      changes: [
        {
          previous_value: null,
          new_value: {
            group_id: new_group._id,
            name: new_group.name,
            description: new_group.description,
            permission_policies: populated_group.permission_policies.map(
              (p) => ({
                _id: p._id,
                name: p.name,
                type: p.type,
              }),
            ),
            users: populated_group.users.map((u) => ({
              _id: u._id,
              user_name: u.user_name,
              user_email: u.user_email,
            })),
          },
        },
      ],
    });

    return res.status(201).json({
      status: "success",
      message: "Permission group created successfully",
      data: populated_group,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while creating permission group",
      error: error.message,
    });
  }
};

/* ================= EDIT PERMISSION GROUP ================= */
export const handle_edit_permission_group = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    const { group_id } = req.params;
    const { name, description } = req.body;

    const permission_group = await permission_group_model.findById(group_id);
    if (!permission_group) {
      return res.status(404).json({
        status: "error",
        message: "Permission group not found.",
      });
    }

    // Check duplicate name against other groups
    if (name !== undefined) {
      const duplicate = await permission_group_model.findOne({
        name: { $regex: `^${name.trim()}$`, $options: "i" },
        _id: { $ne: group_id },
      });
      if (duplicate) {
        return res.status(409).json({
          status: "error",
          message: `A permission group named "${name.trim()}" already exists.`,
        });
      }
    }

    const update = {};

    if (name !== undefined) update.name = name.trim();

    if (description !== undefined) update.description = description.trim();

    const updated_group = await permission_group_model
      .findByIdAndUpdate(group_id, { $set: update }, { new: true })
      .populate("permission_policies", "name policy type")
      .populate("users", "user_name user_email");

    await permission_log_model.create({
      entity: "permission_groups",
      action: "updated",
      performed_by: user_id,
      changes: [
        {
          previous_value: {
            name: permission_group.name,
            description: permission_group.description,
            permission_policies: permission_group.permission_policies,
            users: permission_group.users,
          },
          new_value: {
            name: updated_group.name,
            description: updated_group.description,
            permission_policies: updated_group.permission_policies,
            users: updated_group.users,
          },
        },
      ],
    });

    return res.status(200).json({
      status: "success",
      message: "Permission group updated successfully",
      data: updated_group,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating permission group",
      error: error.message,
    });
  }
};

/* ================= DELETE PERMISSION GROUP ================= */
export const handle_delete_permission_group = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    const { group_id } = req.params;

    const permission_group = await permission_group_model.findById(group_id);
    if (!permission_group) {
      return res.status(404).json({
        status: "error",
        message: "Permission group not found.",
      });
    }

    await permission_group_model.findByIdAndDelete(group_id);

    await permission_log_model.create({
      entity: "permission_groups",
      action: "deleted",
      performed_by: user_id,
      changes: [
        {
          previous_value: {
            name: permission_group.name,
            description: permission_group.description,
            permission_policies: permission_group.permission_policies,
            users: permission_group.users,
          },
          new_value: null,
        },
      ],
    });

    return res.status(200).json({
      status: "success",
      message: "Permission group deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting permission group",
      error: error.message,
    });
  }
};

/* ================= UPDATE GROUP POLICIES ================= */
export const handle_update_group_policies = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    const { group_id } = req.params;
    const { permission_policy_ids: unparsed_permission_policy_ids } = req.body;

    let permission_policy_ids =
      JSON.parse(unparsed_permission_policy_ids) || [];

    const permission_group = await permission_group_model.findById(group_id);
    if (!permission_group) {
      return res.status(404).json({
        status: "error",
        message: "Permission group not found.",
      });
    }

    // Must be an array — empty array clears all policies
    if (!permission_policy_ids || !Array.isArray(permission_policy_ids)) {
      return res.status(400).json({
        status: "error",
        message: "permission_policy_ids must be an array.",
      });
    }

    if (permission_policy_ids.length > 0) {
      const existing_policies = await permission_policy_model
        .find({ _id: { $in: permission_policy_ids } })
        .select("_id");

      const existing_ids = existing_policies.map((p) => p._id.toString());
      const invalid_ids = permission_policy_ids.filter(
        (id) => !existing_ids.includes(id.toString()),
      );

      if (invalid_ids.length > 0) {
        return res.status(404).json({
          status: "error",
          message: "One or more permission policies not found.",
          invalid_ids,
        });
      }
    }

    const current_ids = permission_group.permission_policies.map((id) =>
      id.toString(),
    );
    const incoming_ids = permission_policy_ids.map((id) => id.toString());

    const added = incoming_ids.filter((id) => !current_ids.includes(id));
    const removed = current_ids.filter((id) => !incoming_ids.includes(id));

    const updated_group = await permission_group_model
      .findByIdAndUpdate(
        group_id,
        { $set: { permission_policies: incoming_ids } },
        { new: true },
      )
      .populate("permission_policies", "name policy type")
      .populate("users", "user_name user_email");

      await permission_log_model.create({
        entity: "permission_groups",
        action: "updated_policies",
        performed_by: user_id,
        changes: [
          {
            previous_value: current_ids,
            new_value: incoming_ids,
          },
        ],
      });

    return res.status(200).json({
      status: "success",
      message: "Group policies updated successfully",
      summary: {
        added: added.length,
        removed: removed.length,
        total: incoming_ids.length,
      },
      data: updated_group,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating group policies",
      error: error.message,
    });
  }
};

/* ================= UPDATE GROUP USERS ================= */
export const handle_update_group_users = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    const { group_id } = req.params;
    const { user_ids: unparsed_user_ids } = req.body;

    let user_ids = JSON.parse(unparsed_user_ids) || [];

    const permission_group = await permission_group_model.findById(group_id);
    if (!permission_group) {
      return res.status(404).json({
        status: "error",
        message: "Permission group not found.",
      });
    }

    // Must be an array — empty array clears all users
    if (!user_ids || !Array.isArray(user_ids)) {
      return res.status(400).json({
        status: "error",
        message: "user_ids must be an array.",
      });
    }

    if (user_ids.length > 0) {
      const existing_users = await user_model
        .find({ _id: { $in: user_ids }, is_deleted: false })
        .select("_id");

      const existing_ids = existing_users.map((u) => u._id.toString());
      const invalid_ids = user_ids.filter(
        (id) => !existing_ids.includes(id.toString()),
      );

      if (invalid_ids.length > 0) {
        return res.status(404).json({
          status: "error",
          message: "One or more users not found.",
          invalid_ids,
        });
      }
    }

    const current_ids = permission_group.users.map((id) => id.toString());
    const incoming_ids = user_ids.map((id) => id.toString());

    const added = incoming_ids.filter((id) => !current_ids.includes(id));
    const removed = current_ids.filter((id) => !incoming_ids.includes(id));

    const updated_group = await permission_group_model
      .findByIdAndUpdate(
        group_id,
        { $set: { users: incoming_ids } },
        { new: true },
      )
      .populate("permission_policies", "name policy type")
      .populate("users", "user_name user_email");

      await permission_log_model.create({
        entity: "permission_groups",
        action: "updated_users",
        performed_by: user_id,
        changes: [
          {
            previous_value: current_ids,
            new_value: incoming_ids,
          },
        ],
      });

    return res.status(200).json({
      status: "success",
      message: "Group users updated successfully",
      summary: {
        added: added.length,
        removed: removed.length,
        total: incoming_ids.length,
      },
      data: updated_group,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating group users",
      error: error.message,
    });
  }
};
