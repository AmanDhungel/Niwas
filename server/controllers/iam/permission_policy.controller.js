import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import user_model from "../../models/user.model.js";
import permission_policy_model from "../../models/iam/permission_policy.model.js";
import permission_group_model from "../../models/iam/permission_group.model.js";
import permission_log_model from "../../models/iam/permission_log.model.js";
import permission_module_model from "../../models/iam/permission_module.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PERMISSIONS_JSON_PATH = path.join(__dirname, "./permissions.json");

/* ================= GET PERMISSION POLICIES ================= */
export const handle_get_permission_policies = async (req, res) => {
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

    const { type, category, search } = req.query;

    const filter = {};

    const VALID_TYPES = ["allow", "deny"];
    if (type !== undefined) {
      if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({
          status: "error",
          message: `Invalid type filter. Allowed: ${VALID_TYPES.join(", ")}`,
        });
      }
      filter.type = type;
    }

    if (category !== undefined && category.trim() !== "") {
      filter.category = category.trim();
    }

    if (search && search.trim() !== "") {
      const trimmed_search = search.trim();
      filter.$or = [
        { name: { $regex: trimmed_search, $options: "i" } },
        { policy: { $regex: trimmed_search, $options: "i" } },
        { description: { $regex: trimmed_search, $options: "i" } },
        { category: { $regex: trimmed_search, $options: "i" } },
      ];
    }

    const permission_policies = await permission_policy_model
      .find(filter)
      .sort({ category: 1, type: 1, policy: 1 });

    const grouped_data = permission_policies.reduce((acc, item) => {
      const category_key = item.category || "uncategorized";

      if (!acc[category_key]) {
        acc[category_key] = [];
      }

      acc[category_key].push(item);
      return acc;
    }, {});

    return res.status(200).json({
      status: "success",
      message: "Permission policies fetched successfully",
      total: permission_policies.length,
      grouped_by: "category",
      data: grouped_data,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching permission policies",
      error: error.message,
    });
  }
};

/* ================= REFRESH PERMISSION POLICIES FROM JSON ================= */
export const handle_refresh_permission_policies = async (req, res) => {
  try {
    if (!fs.existsSync(PERMISSIONS_JSON_PATH)) {
      return res.status(404).json({
        status: "error",
        message: "permissions.json file not found.",
      });
    }

    const raw = fs.readFileSync(PERMISSIONS_JSON_PATH, "utf-8");
    let permissions;

    try {
      permissions = JSON.parse(raw);
    } catch {
      return res.status(422).json({
        status: "error",
        message: "permissions.json contains invalid JSON.",
      });
    }

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(422).json({
        status: "error",
        message: "permissions.json must be a non-empty array.",
      });
    }

    const VALID_TYPES = ["allow", "deny"];
    const seen = new Set();

    for (const [index, item] of permissions.entries()) {
      if (!item.name || item.name.trim() === "") {
        return res.status(422).json({
          status: "error",
          message: `Item at index ${index} is missing "name".`,
        });
      }

      if (!item.description || item.description.trim() === "") {
        return res.status(422).json({
          status: "error",
          message: `Item at index ${index} is missing "description".`,
        });
      }

      if (!item.policy || item.policy.trim() === "") {
        return res.status(422).json({
          status: "error",
          message: `Item at index ${index} is missing "policy".`,
        });
      }

      if (!VALID_TYPES.includes(item.type)) {
        return res.status(422).json({
          status: "error",
          message: `Item at index ${index} has invalid "type". Allowed: ${VALID_TYPES.join(", ")}`,
        });
      }

      if (!item.category || item.category.trim() === "") {
        return res.status(422).json({
          status: "error",
          message: `Item at index ${index} is missing "category".`,
        });
      }

      const composite_key = `${item.policy.trim()}::${item.type}`;
      if (seen.has(composite_key)) {
        return res.status(422).json({
          status: "error",
          message: `Duplicate entry: policy "${item.policy}" with type "${item.type}" found more than once in permissions.json.`,
        });
      }
      seen.add(composite_key);
    }

    const ops = permissions.map((item) => ({
      updateOne: {
        filter: {
          policy: item.policy.trim(),
          type: item.type,
        },
        update: {
          $set: {
            name: item.name.trim(),
            description: item.description.trim(),
            policy: item.policy.trim(),
            type: item.type,
            category: item.category.trim(),
          },
        },
        upsert: true,
      },
    }));

    const result = await permission_policy_model.bulkWrite(ops);

    const json_combos = permissions.map((p) => ({
      policy: p.policy.trim(),
      type: p.type,
    }));

    const stale_policies = await permission_policy_model
      .find({
        $nor: json_combos.map(({ policy, type }) => ({ policy, type })),
      })
      .select("policy type name category");

    return res.status(200).json({
      status: "success",
      message: "Permission policies refreshed successfully",
      summary: {
        matched: result.matchedCount,
        upserted: result.upsertedCount,
        modified: result.modifiedCount,
        stale_in_db: stale_policies.map((p) => ({
          policy: p.policy,
          type: p.type,
          name: p.name,
          category: p.category,
        })),
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while refreshing permission policies",
      error: error.message,
    });
  }
};

/* ================= UPDATE USER PERMISSION POLICIES ================= */
export const handle_update_user_permission_policies = async (req, res) => {
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

    const { target_user_id } = req.params;
    const { permission_policy_ids } = req.body;

    const target_user = await user_model.findOne({
      _id: target_user_id,
      is_deleted: false,
    });

    if (!target_user) {
      return res.status(404).json({
        status: "error",
        message: "Target user not found.",
      });
    }

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

    const current_ids = target_user.user_permission_policies.map((id) =>
      id.toString(),
    );
    const incoming_ids = permission_policy_ids.map((id) => id.toString());

    const added = incoming_ids.filter((id) => !current_ids.includes(id));
    const removed = current_ids.filter((id) => !incoming_ids.includes(id));

    const updated_user = await user_model
      .findByIdAndUpdate(
        target_user_id,
        { $set: { user_permission_policies: incoming_ids } },
        { new: true },
      )
      .populate("user_permission_policies", "name policy type category");

    await permission_log_model.create({
      entity: "user_permission_policies",
      action: "updated",
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
      message: "User permission policies updated successfully",
      summary: {
        added: added.length,
        removed: removed.length,
        total: incoming_ids.length,
      },
      data: {
        user_id: updated_user._id,
        user_name: updated_user.user_name,
        user_permission_policies: updated_user.user_permission_policies,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating user permission policies",
      error: error.message,
    });
  }
};

export const handle_add_user_to_permission_groups = async (req, res) => {
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

    const { target_user_id } = req.params;
    const { permission_group_ids } = req.body;

    const target_user = await user_model.findOne({
      _id: target_user_id,
      is_deleted: false,
    });

    if (!target_user) {
      return res.status(404).json({
        status: "error",
        message: "Target user not found.",
      });
    }

    if (!permission_group_ids || !Array.isArray(permission_group_ids)) {
      return res.status(400).json({
        status: "error",
        message: "permission_group_ids must be an array.",
      });
    }

    if (permission_group_ids.length > 0) {
      const existing_groups = await permission_group_model
        .find({ _id: { $in: permission_group_ids } })
        .select("_id");

      const existing_ids = existing_groups.map((g) => g._id.toString());
      const invalid_ids = permission_group_ids.filter(
        (id) => !existing_ids.includes(id.toString()),
      );

      if (invalid_ids.length > 0) {
        return res.status(404).json({
          status: "error",
          message: "One or more permission groups not found.",
          invalid_ids,
        });
      }
    }

    const groups = await permission_group_model
      .find({
        _id: { $in: permission_group_ids },
      })
      .populate("users", "user_name user_email");

    for (const group of groups) {
      if (!group.users.includes(target_user_id)) {
        group.users.push(target_user_id);
        await group.save();

        await permission_log_model.create({
          entity: "permission_groups",
          action: "user_added",
          performed_by: user_id,
          changes: [
            {
              previous_value: group.users.map((u) => {
                if (u._id.toString() !== target_user_id) {
                  return {
                    _id: u._id,
                    user_name: u.user_name,
                    user_email: u.user_email,
                  };
                }
              }),
              new_value: group.users.map((u) => ({
                _id: u._id,
                user_name: u.user_name,
                user_email: u.user_email,
              })),
            },
          ],
        });
      }
    }

    return res.status(200).json({
      status: "success",
      message: "User added to permission groups successfully",
      summary: {
        added_to_groups: groups.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding user to permission group",
      error: error.message,
    });
  }
};

export const handle_copy_permission_policies_from_another_user = async (
  req,
  res,
) => {
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

    const { target_user_id } = req.params;
    const { source_user_id } = req.body;

    const target_user = await user_model.findOne({
      _id: target_user_id,
      is_deleted: false,
    });

    if (!target_user) {
      return res.status(404).json({
        status: "error",
        message: "Target user not found.",
      });
    }

    const source_user = await user_model.findOne({
      _id: source_user_id,
      is_deleted: false,
    });

    if (!source_user) {
      return res.status(404).json({
        status: "error",
        message: "Source user not found.",
      });
    }

    const source_policy_ids = source_user.user_permission_policies.map((id) =>
      id.toString(),
    );

    const target_policy_ids = target_user.user_permission_policies.map((id) =>
      id.toString(),
    );

    const combined_policy_ids = Array.from(
      new Set([...source_policy_ids, ...target_policy_ids]),
    );

    const updated_user = await user_model
      .findByIdAndUpdate(
        target_user_id,
        { $set: { user_permission_policies: combined_policy_ids } },
        { new: true },
      )
      .populate("user_permission_policies", "name policy type category");

    await permission_log_model.create({
      entity: "user_permission_policies",
      action: "updated_via_copy",
      performed_by: user_id,
      changes: [
        {
          previous_value: target_policy_ids,
          new_value: combined_policy_ids,
          extra_info: {
            source_user_id,
            source_user_name: source_user.user_name,
          },
        },
      ],
    });

    return res.status(200).json({
      status: "success",
      message: "Permission policies copied from source user successfully",
      data: {
        user: updated_user,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message:
        "An error occurred while copying permission policies from another user",
      error: error.message,
    });
  }
};

/* ================= GET USER PERMISSIONS ================= */
export const handle_get_user_permissions = async (req, res) => {
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

    const grouped_permissions = {};
    const grouped_module_permissions = {};

    const add_permission = (category, type, policy) => {
      const category_key = category || "uncategorized";

      if (!grouped_permissions[category_key]) {
        grouped_permissions[category_key] = {
          allow: new Set(),
          deny: new Set(),
        };
      }

      grouped_permissions[category_key][type].add(policy);
    };

    const user = await user_model
      .findById(user_id)
      .populate("user_permission_policies", "policy type category");

    if (user) {
      for (const p of user.user_permission_policies) {
        add_permission(p.category, p.type, p.policy);
      }
    }

    const groups = await permission_group_model
      .find({ users: user_id })
      .populate("permission_policies", "policy type category");

    for (const g of groups) {
      for (const p of g.permission_policies) {
        add_permission(p.category, p.type, p.policy);
      }
    }

    const module_permissions = await permission_module_model
      .find({ user: user_id })
      .populate("permission_policies", "policy type category")
      .select("module module_item_id permission_policies");

    for (const item of module_permissions) {
      const module_key = item.module || "uncategorized";

      if (!grouped_module_permissions[module_key]) {
        grouped_module_permissions[module_key] = [];
      }

      const item_permissions = {};

      for (const p of item.permission_policies) {
        const category_key = p.category || "uncategorized";

        if (!item_permissions[category_key]) {
          item_permissions[category_key] = {
            allow: new Set(),
            deny: new Set(),
          };
        }

        item_permissions[category_key][p.type].add(p.policy);
      }

      const formatted_item_permissions = Object.fromEntries(
        Object.entries(item_permissions).map(([category, values]) => [
          category,
          {
            allow: Array.from(values.allow),
            deny: Array.from(values.deny),
          },
        ]),
      );

      grouped_module_permissions[module_key].push({
        module_item_id: item.module_item_id,
        permissions: formatted_item_permissions,
      });
    }

    const formatted_permissions = Object.fromEntries(
      Object.entries(grouped_permissions).map(([category, values]) => [
        category,
        {
          allow: Array.from(values.allow),
          deny: Array.from(values.deny),
        },
      ]),
    );

    return res.status(200).json({
      status: "success",
      message: "User permissions fetched successfully",
      data: {
        generic_permissions: formatted_permissions,
        module_permissions: grouped_module_permissions,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching user permissions",
      error: error.message,
    });
  }
};
