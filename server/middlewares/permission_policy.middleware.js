import jwt from "jsonwebtoken";
import user_model from "../models/user.model.js";
import permission_group_model from "../models/iam/permission_group.model.js";
import permission_module_model from "../models/iam/permission_module.model.js";

/* ─────────────────────────────────────────────
   INTERNAL HELPERS
───────────────────────────────────────────── */

const resolve_user_id = (req) => {
  try {
    const { user_token } = req.cookies;
    if (!user_token) return null;
    const decoded = jwt.verify(user_token, process.env.JWT_SECRET);
    return decoded.user_id || null;
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return null;
    }
    throw err;
  }
};

const resolve_module_item_id = (
  req,
  module_id_key = null,
  module_id_source = "auto",
) => {
  if (!module_id_key) {
    if (module_id_source === "params")
      return req.params?.module_item_id || null;
    if (module_id_source === "body") return req.body?.module_item_id || null;
    if (module_id_source === "query") return req.query?.module_item_id || null;
    return (
      req.params?.module_item_id ||
      req.body?.module_item_id ||
      req.query?.module_item_id ||
      null
    );
  }
  if (module_id_source === "params") return req.params?.[module_id_key] || null;
  if (module_id_source === "body") return req.body?.[module_id_key] || null;
  if (module_id_source === "query") return req.query?.[module_id_key] || null;
  return (
    req.params?.[module_id_key] ||
    req.body?.[module_id_key] ||
    req.query?.[module_id_key] ||
    null
  );
};

const resolve_policies_by_level = async (user_id) => {
  const direct = { allow: new Set(), deny: new Set() };
  const group = { allow: new Set(), deny: new Set() };

  const user = await user_model
    .findById(user_id)
    .populate("user_permission_policies", "policy type");

  if (user) {
    for (const p of user.user_permission_policies) {
      if (p.type === "allow") {
        direct.allow.add(p.policy);
      } else {
        direct.deny.add(p.policy);
      }
    }
  }

  const groups = await permission_group_model
    .find({ users: user_id })
    .populate("permission_policies", "policy type");

  for (const g of groups) {
    for (const p of g.permission_policies) {
      if (p.type === "allow") {
        group.allow.add(p.policy);
      } else {
        group.deny.add(p.policy);
      }
    }
  }

  return { direct, group };
};

const resolve_module_policies = async (
  user_id,
  module,
  module_item_id = null,
) => {
  const result = { allow: new Set(), deny: new Set() };
  const query = { user: user_id, module };
  if (module_item_id) query.module_item_id = module_item_id;

  const records = await permission_module_model
    .find(query)
    .populate("permission_policies", "policy type");

  for (const record of records) {
    for (const p of record.permission_policies) {
      if (p.type === "allow") {
        result.allow.add(p.policy);
      } else {
        result.deny.add(p.policy);
      }
    }
  }

  return result;
};

/*
 * Check if the user has the given policy on ANY record of the module.
 * Returns true if at least one permission_module record grants the policy
 * without any deny taking precedence.
 */
const has_policy_on_any_module_item = async (user_id, module, policy) => {
  const records = await permission_module_model
    .find({ user: user_id, module })
    .populate("permission_policies", "policy type");

  for (const record of records) {
    let allowed = false;
    let denied = false;

    for (const p of record.permission_policies) {
      if (p.policy === policy && p.type === "allow") allowed = true;
      if (p.policy === policy && p.type === "deny") denied = true;
    }

    if (allowed && !denied) return true;
  }

  return false;
};

const evaluate_one = (policy, bucket) => {
  if (bucket.allow.has(policy)) {
    return { granted: true, reason: `Policy "${policy}" is allowed.` };
  }
  if (bucket.deny.has(policy)) {
    return {
      granted: false,
      reason: `Policy "${policy}" is explicitly denied.`,
    };
  }
  return {
    granted: false,
    reason: `Policy "${policy}" is not assigned to this user.`,
  };
};

const evaluate_one_all_tiers = (policy, direct, group, module_bucket) => {
  if (direct.deny.has(policy)) {
    return {
      granted: false,
      reason: `Policy "${policy}" is explicitly denied at user level.`,
    };
  }
  if (direct.allow.has(policy)) {
    return {
      granted: true,
      reason: `Policy "${policy}" is allowed at user level.`,
    };
  }
  if (group.deny.has(policy)) {
    return {
      granted: false,
      reason: `Policy "${policy}" is explicitly denied at group level.`,
    };
  }
  if (group.allow.has(policy)) {
    return {
      granted: true,
      reason: `Policy "${policy}" is allowed at group level.`,
    };
  }
  if (module_bucket.deny.has(policy)) {
    return {
      granted: false,
      reason: `Policy "${policy}" is explicitly denied at module level.`,
    };
  }
  if (module_bucket.allow.has(policy)) {
    return {
      granted: true,
      reason: `Policy "${policy}" is allowed at module level.`,
    };
  }
  return {
    granted: false,
    reason: `Policy "${policy}" is not assigned to this user.`,
  };
};

/* ─────────────────────────────────────────────
   MIDDLEWARE FACTORY
───────────────────────────────────────────── */

const check_permission_policy = (options = {}) => {
  if (typeof options === "string" || Array.isArray(options)) {
    options = { policies: options };
  }

  const {
    policies,
    mode = "any",
    source = "all",
    module = null,
    module_id_key = null,
    module_id_source = "auto",
    module_any = false, // NEW: skip item-scoped check, allow if policy exists on any item
  } = options;

  return async (req, res, next) => {
    try {
      const user_id = resolve_user_id(req);
      if (!user_id) {
        return res.status(401).json({
          status: "error",
          message: "Unauthenticated. Please log in.",
        });
      }

      const user = await user_model.findById(user_id);
      if (!user || user.is_deleted || !user.is_active) {
        return res.status(401).json({
          status: "error",
          message: "User not found or inactive.",
        });
      }

      if (user.user_type === "superuser") return next();

      req.user_id = user_id;

      const policy_list = Array.isArray(policies) ? policies : [policies];

      if (!policy_list.length || policy_list.some((p) => !p)) {
        return res.status(403).json({
          status: "error",
          message: "Forbidden",
          reason: "No valid policies specified — possible misconfiguration.",
        });
      }

      /* ── module_any: pass if user has policy on at least one item ── */
      if (module_any) {
        if (!module) {
          return res.status(500).json({
            status: "error",
            message: "module_any requires the module option to be set.",
          });
        }

        const { direct, group } = await resolve_policies_by_level(user_id);

        // Still check direct + group tiers first
        const base_results = policy_list.map((p) =>
          evaluate_one_all_tiers(p, direct, group, {
            allow: new Set(),
            deny: new Set(),
          }),
        );

        let granted_by_base =
          mode === "any"
            ? base_results.some((r) => r.granted)
            : base_results.every((r) => r.granted);

        if (granted_by_base) {
          req.MODULE_CHECK_NEEDED = true;
          req.MODULE_NAME = module;
          req.MODULE_USER_ID = user_id;
          return next();
        }

        // Check if policy exists on any module item
        const any_checks = await Promise.all(
          policy_list.map((p) =>
            has_policy_on_any_module_item(user_id, module, p),
          ),
        );

        const granted_by_any =
          mode === "any" ? any_checks.some(Boolean) : any_checks.every(Boolean);

        if (granted_by_any) {
          req.MODULE_CHECK_NEEDED = true;
          req.MODULE_NAME = module;
          req.MODULE_USER_ID = user_id;
          return next();
        }

        return res.status(403).json({
          status: "error",
          message: "Access denied.",
          reason: `None of the required policies are granted on any ${module}: [${policy_list.join(", ")}]`,
        });
      }

      /* ── normal source-based check ── */
      let results;

      if (source === "module") {
        if (!module) {
          return res.status(500).json({
            status: "error",
            message: 'source "module" requires the module option to be set.',
          });
        }

        const module_item_id = resolve_module_item_id(
          req,
          module_id_key,
          module_id_source,
        );
        const module_bucket = await resolve_module_policies(
          user_id,
          module,
          module_item_id,
        );

        results = policy_list.map((p) => evaluate_one(p, module_bucket));

        req.MODULE_CHECK_NEEDED = true;
        req.MODULE_NAME = module;
        req.MODULE_USER_ID = user_id;
        req.MODULE_ITEM_ID = module_item_id;
      } else if (source === "direct") {
        const { direct } = await resolve_policies_by_level(user_id);
        results = policy_list.map((p) => evaluate_one(p, direct));
      } else if (source === "group") {
        const { group } = await resolve_policies_by_level(user_id);
        results = policy_list.map((p) => evaluate_one(p, group));
      } else {
        const module_item_id = module
          ? resolve_module_item_id(req, module_id_key, module_id_source)
          : null;

        const [{ direct, group }, module_bucket] = await Promise.all([
          resolve_policies_by_level(user_id),
          module
            ? resolve_module_policies(user_id, module, module_item_id)
            : Promise.resolve({ allow: new Set(), deny: new Set() }),
        ]);

        results = policy_list.map((p) =>
          evaluate_one_all_tiers(p, direct, group, module_bucket),
        );

        if (module) {
          req.MODULE_CHECK_NEEDED = true;
          req.MODULE_NAME = module;
          req.MODULE_USER_ID = user_id;
          req.MODULE_ITEM_ID = module_item_id;
        }
      }

      if (mode === "any") {
        const passed = results.find((r) => r.granted);
        if (passed) return next();

        return res.status(403).json({
          status: "error",
          message: "Access denied.",
          reason: `None of the required policies are granted: [${policy_list.join(", ")}]`,
        });
      }

      if (mode === "all") {
        const failed = results.find((r) => !r.granted);
        if (failed) {
          return res.status(403).json({
            status: "error",
            message: "Access denied.",
            reason: failed.reason,
          });
        }
        return next();
      }

      return res.status(400).json({
        status: "error",
        message: `Invalid mode "${mode}". Use "any" or "all".`,
      });
    } catch (err) {
      return res.status(500).json({
        status: "error",
        message: "Permission check failed.",
        error: err.message,
      });
    }
  };
};

export default check_permission_policy;
