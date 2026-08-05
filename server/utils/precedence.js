// utils/precedence.js
// Exports: parseHorizontal, parseVerticalGroups, buildBillSteps

/**
 * Parse horizontal precedence. Accepts:
 * - string "id1;id2;id3"
 * - array ["id1","id2"]
 * returns array of id strings in order
 */
export function parseHorizontal(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === "string") {
    return val
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean)
      .map(String);
  }
  return [];
}

/**
 * Parse vertical precedence into groups.
 * Accepts:
 * - string "id1,id2;id3" -> [ ["id1","id2"], ["id3"] ]
 * - array of arrays (already) -> returns normalized
 * - single string with commas -> one group
 */
export function parseVerticalGroups(val) {
  if (!val) return [];
  if (Array.isArray(val)) {
    // if array of strings like ["id1,id2", "id3"], we split each by comma
    return val.map((g) => {
      if (Array.isArray(g)) return g.map(String);
      return String(g)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map(String);
    });
  }
  if (typeof val === "string") {
    return String(val)
      .split(";")
      .map((grp) =>
        grp
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map(String)
      )
      .filter((g) => g.length > 0);
  }
  return [];
}

/**
 * Build bill-specific steps (detached from template)
 *
 * allSteps: array of step templates from DB (objects with _id, step_title, step_description, permissions)
 * globals: object having default_step_horizontal_precedence and default_step_vertical_precedence
 *
 * Returns array of step objects: { step_template, step_title, step_description, permissions, row, col, completed }
 */
// utils/buildBillSteps.js

// keep parseHorizontal / parseVerticalGroups as before (not included here)

/**
 * Build bill steps from step templates (allSteps) and globals.
 * Clones template actions into bill-embedded actions when those actions are populated.
 */
export function buildBillSteps(allSteps = [], globals = {}) {
  const hIds = parseHorizontal(globals.default_step_horizontal_precedence);
  const vGroups = parseVerticalGroups(globals.default_step_vertical_precedence);

  // Map templates by id string
  const byId = new Map();
  for (const s of allSteps) {
    const idStr = String(s._id);
    byId.set(idStr, s);
  }

  // Helper: clone a template action object into an embedded bill action
  const cloneTemplateAction = (act) => {
    if (!act) return null;

    // Defensive copy of arrays/objects; keep dates as Date/ISO which mongoose will accept
    const checklist = Array.isArray(act.checklist)
      ? act.checklist.map((c) => ({
          item: c.item,
          is_completed: !!c.is_completed,
        }))
      : [];

    // Normalize priority: prefer single action_priority object, else fallback to first action_priorities item
    let action_priority = null;
    if (act.action_priority && typeof act.action_priority === "object") {
      action_priority = {
        priority:
          act.action_priority.priority !== undefined
            ? String(act.action_priority.priority)
            : undefined,
        color_code:
          act.action_priority.color_code || act.action_priority.color || "",
      };
    } else if (
      Array.isArray(act.action_priorities) &&
      act.action_priorities.length > 0
    ) {
      const first = act.action_priorities[0] || null;
      if (first && typeof first === "object") {
        action_priority = {
          priority:
            first.priority !== undefined ? String(first.priority) : undefined,
          color_code: first.color_code || first.color || "",
        };
      }
    } else {
      action_priority = null;
    }

    const permissions = Array.isArray(act.permissions)
      ? act.permissions.map((p) => {
          // copy permission subschema as-is (objectId refs or objects)
          return {
            entity: p.entity,
            entity_type: p.entity_type,
            permission: p.permission,
          };
        })
      : [];

    const custom_fields = Array.isArray(act.custom_fields)
      ? act.custom_fields.map((f) => ({
          field_name: f.field_name,
          field_type: f.field_type,
          field_value: f.field_value,
          field_options: Array.isArray(f.field_options)
            ? f.field_options.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))
            : [],
        }))
      : [];

    const comments = Array.isArray(act.comments)
      ? act.comments.map((c) => ({
          comment: c.comment,
          created_by: c.created_by,
          created_at: c.created_at,
        }))
      : [];

    // If action_deadline is present, pass it through (mongoose will cast)
    const action_deadline = act.action_deadline
      ? new Date(act.action_deadline)
      : null;

    // ---------- NEW: clone form_definition into bill action ----------
    let form_definition = {
      enabled: false,
      title: "",
      description: "",
      fields: [],
    };

    if (act.form_definition && typeof act.form_definition === "object") {
      const fd = act.form_definition;
      form_definition = {
        enabled: !!fd.enabled,
        title: fd.title || "",
        description: fd.description || "",
        fields: Array.isArray(fd.fields)
          ? fd.fields
              .map((f, idx) => {
                if (!f) return null;

                const valueKey =
                  f.field_key ||
                  f.key ||
                  (f.label
                    ? String(f.label).toLowerCase().replace(/\s+/g, "_")
                    : "") ||
                  `field_${idx}`;

                const label = f.label || f.field_key || `Field ${idx + 1}`;

                const field_type = f.field_type || f.type || "text";

                const options = Array.isArray(f.options)
                  ? f.options
                      .map((opt) => {
                        if (!opt) return null;
                        const value = opt.value ?? opt.key ?? opt.id ?? null;
                        if (!value) return null;
                        return {
                          value: String(value),
                          label: opt.label ? String(opt.label) : String(value),
                        };
                      })
                      .filter(Boolean)
                  : [];

                return {
                  field_key: valueKey,
                  label: String(label),
                  field_type: String(field_type),
                  required: !!f.required,
                  options,
                  placeholder: f.placeholder || "",
                  help_text: f.help_text || "",
                  order: typeof f.order === "number" ? f.order : idx,
                };
              })
              .filter(Boolean)
          : [],
      };
    }

    // form_responses are always empty when cloning into a new bill
    const form_responses = [];

    return {
      origin_action_id: act._id || null,
      title: act.title || "",
      description: act.description || "",
      checklist,
      // single action_priority (or null)
      action_priority,
      action_deadline,
      permissions,
      custom_fields,
      comments,
      // NEW: embedded form on bill action
      form_definition,
      form_responses,
    };
  };

  // helper to create step entry from template (cloning permissions and actions)
  const makeEntry = (template) => {
    // clone permissions array if present
    const permissions = Array.isArray(template.permissions)
      ? template.permissions.map((p) => ({
          entity: p.entity,
          entity_type: p.entity_type,
          permission: p.permission,
        }))
      : [];

    // clone actions only if they are populated (objects). If template.actions is an array
    // of ObjectIds (not populated), produce an empty array so bill has standalone actions only when available.
    let actions = [];
    if (Array.isArray(template.actions) && template.actions.length > 0) {
      // If the first item looks like an object (has _id or title), treat as populated
      const first = template.actions[0];
      const isPopulated =
        first && (first._id || first.title || first.description);
      if (isPopulated) {
        actions = template.actions
          .map((act) => cloneTemplateAction(act))
          .filter(Boolean);
      } else {
        actions = [];
      }
    }

    return {
      step_template: template._id,
      step_title: template.step_title,
      step_description: template.step_description,
      permissions,
      actions,
      row: 0,
      col: 0,
      completed: false,
    };
  };

  const result = [];
  const placed = new Set(); // placed template ids
  const nextRowForCol = []; // nextRowForCol[col] = next row index

  // 1) Place horizontals into columns (col = horizontal order)
  for (let col = 0; col < hIds.length; col++) {
    const id = String(hIds[col]);
    const templ = byId.get(id);
    if (!templ) continue;
    const entry = makeEntry(templ);
    entry.col = col;
    entry.row = nextRowForCol[col] =
      nextRowForCol[col] === undefined ? 0 : nextRowForCol[col];
    result.push(entry);
    placed.add(String(templ._id));
    nextRowForCol[col] = (nextRowForCol[col] || 0) + 1;
  }

  // 2) Process vertical groups sequentially
  for (const group of vGroups) {
    let currentCol = null;
    for (const idRaw of group) {
      const id = String(idRaw);
      // if id matches a horizontal id, set currentCol
      const horizIndex = hIds.findIndex((h) => String(h) === id);
      if (horizIndex !== -1) {
        const templ = byId.get(id);
        if (templ && !placed.has(String(templ._id))) {
          const entry = makeEntry(templ);
          entry.col = horizIndex;
          entry.row = nextRowForCol[horizIndex] =
            nextRowForCol[horizIndex] ?? 0;
          result.push(entry);
          placed.add(String(templ._id));
          nextRowForCol[horizIndex]++;
        }
        currentCol = horizIndex;
        continue;
      }

      const templ = byId.get(id);
      if (!templ) {
        // unknown id — skip
        continue;
      }

      let targetCol = currentCol;
      if (targetCol === null) targetCol = 0;

      if (placed.has(String(templ._id))) continue;

      const entry = makeEntry(templ);
      entry.col = targetCol;
      entry.row = nextRowForCol[targetCol] = nextRowForCol[targetCol] ?? 0;
      result.push(entry);
      placed.add(String(templ._id));
      nextRowForCol[targetCol]++;
    }
  }

  // final normalization: ensure rows and cols are numeric and consistent
  return result.map((r) => ({
    ...r,
    col: Number(r.col ?? 0),
    row: Number(r.row ?? 0),
    completed: !!r.completed,
  }));
}

export function buildBoardSteps(allSteps = [], globals = {}, bill_type) {
  const hPrec = globals.default_step_horizontal_precedence.find(
    (h) => h.board_type === bill_type
  );
  const vPrec = globals.default_step_vertical_precedence.find(
    (v) => v.board_type === bill_type
  );

  const hIds = parseHorizontal(hPrec ? hPrec.precedence : null);
  const vGroups = parseVerticalGroups(vPrec ? vPrec.precedence : null);

  // Map templates by id string
  const byId = new Map();
  for (const s of allSteps) {
    const idStr = String(s._id);
    byId.set(idStr, s);
  }

  // Helper: clone a template action object into an embedded bill action
  const cloneTemplateAction = (act) => {
    if (!act) return null;

    // Defensive copy of arrays/objects; keep dates as Date/ISO which mongoose will accept
    const checklist = Array.isArray(act.checklist)
      ? act.checklist.map((c) => ({
          item: c.item,
          is_completed: !!c.is_completed,
        }))
      : [];

    // Normalize priority: prefer single action_priority object, else fallback to first action_priorities item
    let action_priority = null;
    if (act.action_priority && typeof act.action_priority === "object") {
      action_priority = {
        priority:
          act.action_priority.priority !== undefined
            ? String(act.action_priority.priority)
            : undefined,
        color_code:
          act.action_priority.color_code || act.action_priority.color || "",
      };
    } else if (
      Array.isArray(act.action_priorities) &&
      act.action_priorities.length > 0
    ) {
      const first = act.action_priorities[0] || null;
      if (first && typeof first === "object") {
        action_priority = {
          priority:
            first.priority !== undefined ? String(first.priority) : undefined,
          color_code: first.color_code || first.color || "",
        };
      }
    } else {
      action_priority = null;
    }

    const permissions = Array.isArray(act.permissions)
      ? act.permissions.map((p) => {
          // copy permission subschema as-is (objectId refs or objects)
          return {
            entity: p.entity,
            entity_type: p.entity_type,
            permission: p.permission,
          };
        })
      : [];

    const custom_fields = Array.isArray(act.custom_fields)
      ? act.custom_fields.map((f) => ({
          field_name: f.field_name,
          field_type: f.field_type,
          field_value: f.field_value,
          field_options: Array.isArray(f.field_options)
            ? f.field_options.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))
            : [],
        }))
      : [];

    const comments = Array.isArray(act.comments)
      ? act.comments.map((c) => ({
          comment: c.comment,
          created_by: c.created_by,
          created_at: c.created_at,
        }))
      : [];

    // If action_deadline is present, pass it through (mongoose will cast)
    const action_deadline = act.action_deadline
      ? new Date(act.action_deadline)
      : null;

    // ---------- NEW: clone form_definition into bill action ----------
    let form_definition = {
      enabled: false,
      title: "",
      description: "",
      fields: [],
    };

    if (act.form_definition && typeof act.form_definition === "object") {
      const fd = act.form_definition;
      form_definition = {
        enabled: !!fd.enabled,
        title: fd.title || "",
        description: fd.description || "",
        fields: Array.isArray(fd.fields)
          ? fd.fields
              .map((f, idx) => {
                if (!f) return null;

                const valueKey =
                  f.field_key ||
                  f.key ||
                  (f.label
                    ? String(f.label).toLowerCase().replace(/\s+/g, "_")
                    : "") ||
                  `field_${idx}`;

                const label = f.label || f.field_key || `Field ${idx + 1}`;

                const field_type = f.field_type || f.type || "text";

                const options = Array.isArray(f.options)
                  ? f.options
                      .map((opt) => {
                        if (!opt) return null;
                        const value = opt.value ?? opt.key ?? opt.id ?? null;
                        if (!value) return null;
                        return {
                          value: String(value),
                          label: opt.label ? String(opt.label) : String(value),
                        };
                      })
                      .filter(Boolean)
                  : [];

                return {
                  field_key: valueKey,
                  label: String(label),
                  field_type: String(field_type),
                  required: !!f.required,
                  options,
                  placeholder: f.placeholder || "",
                  help_text: f.help_text || "",
                  order: typeof f.order === "number" ? f.order : idx,
                };
              })
              .filter(Boolean)
          : [],
      };
    }

    // form_responses are always empty when cloning into a new bill
    const form_responses = [];

    return {
      origin_action_id: act._id || null,
      title: act.title || "",
      description: act.description || "",
      checklist,
      // single action_priority (or null)
      action_priority,
      action_deadline,
      permissions,
      custom_fields,
      comments,
      // NEW: embedded form on bill action
      form_definition,
      form_responses,
    };
  };

  // helper to create step entry from template (cloning permissions and actions)
  const makeEntry = (template) => {
    // clone permissions array if present
    const permissions = Array.isArray(template.permissions)
      ? template.permissions.map((p) => ({
          entity: p.entity,
          entity_type: p.entity_type,
          permission: p.permission,
        }))
      : [];

    // clone actions only if they are populated (objects). If template.actions is an array
    // of ObjectIds (not populated), produce an empty array so bill has standalone actions only when available.
    let actions = [];
    if (Array.isArray(template.actions) && template.actions.length > 0) {
      // If the first item looks like an object (has _id or title), treat as populated
      const first = template.actions[0];
      const isPopulated =
        first && (first._id || first.title || first.description);
      if (isPopulated) {
        actions = template.actions
          .map((act) => cloneTemplateAction(act))
          .filter(Boolean);
      } else {
        actions = [];
      }
    }

    return {
      step_template: template._id,
      step_title: template.step_title,
      step_description: template.step_description,
      permissions,
      actions,
      row: 0,
      col: 0,
      completed: false,
    };
  };

  const result = [];
  const placed = new Set(); // placed template ids
  const nextRowForCol = []; // nextRowForCol[col] = next row index

  // 1) Place horizontals into columns (col = horizontal order)
  for (let col = 0; col < hIds.length; col++) {
    const id = String(hIds[col]);
    const templ = byId.get(id);
    if (!templ) continue;
    const entry = makeEntry(templ);
    entry.col = col;
    entry.row = nextRowForCol[col] =
      nextRowForCol[col] === undefined ? 0 : nextRowForCol[col];
    result.push(entry);
    placed.add(String(templ._id));
    nextRowForCol[col] = (nextRowForCol[col] || 0) + 1;
  }

  // 2) Process vertical groups sequentially
  for (const group of vGroups) {
    let currentCol = null;
    for (const idRaw of group) {
      const id = String(idRaw);
      // if id matches a horizontal id, set currentCol
      const horizIndex = hIds.findIndex((h) => String(h) === id);
      if (horizIndex !== -1) {
        const templ = byId.get(id);
        if (templ && !placed.has(String(templ._id))) {
          const entry = makeEntry(templ);
          entry.col = horizIndex;
          entry.row = nextRowForCol[horizIndex] =
            nextRowForCol[horizIndex] ?? 0;
          result.push(entry);
          placed.add(String(templ._id));
          nextRowForCol[horizIndex]++;
        }
        currentCol = horizIndex;
        continue;
      }

      const templ = byId.get(id);
      if (!templ) {
        // unknown id — skip
        continue;
      }

      let targetCol = currentCol;
      if (targetCol === null) targetCol = 0;

      if (placed.has(String(templ._id))) continue;

      const entry = makeEntry(templ);
      entry.col = targetCol;
      entry.row = nextRowForCol[targetCol] = nextRowForCol[targetCol] ?? 0;
      result.push(entry);
      placed.add(String(templ._id));
      nextRowForCol[targetCol]++;
    }
  }

  // final normalization: ensure rows and cols are numeric and consistent
  return result.map((r) => ({
    ...r,
    col: Number(r.col ?? 0),
    row: Number(r.row ?? 0),
    completed: !!r.completed,
  }));
}
