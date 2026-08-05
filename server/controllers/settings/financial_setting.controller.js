import jwt from "jsonwebtoken";
import financial_setting_model from "../../models/settings/financial_setting.model.js";
import user_model from "../../models/user.model.js";

const VALID_GATEWAYS = ["paypal", "stripe", "skrill"];

/* ================= GET PAYMENT GATEWAYS ================= */
export const handle_get_payment_gateways = async (req, res) => {
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

    let financial_setting = await financial_setting_model.findOne({ user_id });

    if (!financial_setting) {
      financial_setting = await financial_setting_model.create({ user_id });
    }

    // Mask secret keys before sending — never expose raw secrets
    const gateways = {};
    for (const gateway of VALID_GATEWAYS) {
      const g = financial_setting.payment_gateways?.[gateway];
      gateways[gateway] = {
        enabled: g?.enabled ?? false,
        api_key: g?.api_key ? mask_key(g.api_key) : null,
        secret_key: g?.secret_key ? mask_key(g.secret_key) : null,
      };
    }

    return res.status(200).json({
      status: "success",
      message: "Payment gateways fetched successfully",
      data: gateways,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching payment gateways",
      error: error.message,
    });
  }
};

/* ================= ENABLE / DISABLE PAYMENT GATEWAY ================= */
export const handle_enable_payment_gateway = async (req, res) => {
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

    const { gateway } = req.params;
    const { enabled } = req.body;

    if (!VALID_GATEWAYS.includes(gateway)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid gateway. Allowed: ${VALID_GATEWAYS.join(", ")}`,
      });
    }

    if (enabled === undefined || enabled === null) {
      return res.status(400).json({
        status: "error",
        message: "enabled (true/false) is required.",
      });
    }

    const updated_setting = await financial_setting_model.findOneAndUpdate(
      { user_id },
      { $set: { [`payment_gateways.${gateway}.enabled`]: Boolean(enabled) } },
      { new: true, upsert: true },
    );

    const g = updated_setting.payment_gateways[gateway];

    return res.status(200).json({
      status: "success",
      message: `${gateway} ${Boolean(enabled) ? "enabled" : "disabled"} successfully`,
      data: {
        gateway,
        enabled: g.enabled,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating payment gateway status",
      error: error.message,
    });
  }
};

/* ================= CONFIGURE PAYMENT GATEWAY ================= */
export const handle_configure_payment_gateway = async (req, res) => {
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

    const { gateway } = req.params;
    const { api_key, secret_key } = req.body;

    if (!VALID_GATEWAYS.includes(gateway)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid gateway. Allowed: ${VALID_GATEWAYS.join(", ")}`,
      });
    }

    if (!api_key && !secret_key) {
      return res.status(400).json({
        status: "error",
        message: "At least one of api_key or secret_key is required.",
      });
    }

    const update = {};

    if (api_key !== undefined)
      update[`payment_gateways.${gateway}.api_key`] = api_key.trim();

    if (secret_key !== undefined)
      update[`payment_gateways.${gateway}.secret_key`] = secret_key.trim();

    const updated_setting = await financial_setting_model.findOneAndUpdate(
      { user_id },
      { $set: update },
      { new: true, upsert: true },
    );

    const g = updated_setting.payment_gateways[gateway];

    return res.status(200).json({
      status: "success",
      message: `${gateway} configured successfully`,
      data: {
        gateway,
        enabled: g.enabled,
        api_key: g.api_key ? mask_key(g.api_key) : null,
        secret_key: g.secret_key ? mask_key(g.secret_key) : null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while configuring payment gateway",
      error: error.message,
    });
  }
};

/* ================= GET ALL TAX RATES ================= */
export const handle_get_tax_rates = async (req, res) => {
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

    let financial_setting = await financial_setting_model.findOne({ user_id });

    if (!financial_setting) {
      financial_setting = await financial_setting_model.create({ user_id });
    }

    return res.status(200).json({
      status: "success",
      message: "Tax rates fetched successfully",
      data: financial_setting.tax_rates || [],
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching tax rates",
      error: error.message,
    });
  }
};

/* ================= ADD TAX RATE ================= */
export const handle_add_tax_rate = async (req, res) => {
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

    const { name, rate, status } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        status: "error",
        message: "Tax rate name is required.",
      });
    }

    if (rate === undefined || rate === null) {
      return res.status(400).json({
        status: "error",
        message: "Rate is required.",
      });
    }

    if (isNaN(Number(rate)) || Number(rate) < 0 || Number(rate) > 100) {
      return res.status(400).json({
        status: "error",
        message: "Rate must be a number between 0 and 100.",
      });
    }

    const VALID_STATUSES = ["active", "inactive"];
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const new_tax_rate = {
      name: name.trim(),
      rate: Number(rate),
      ...(status && { status }),
    };

    const updated_setting = await financial_setting_model.findOneAndUpdate(
      { user_id },
      { $push: { tax_rates: new_tax_rate } },
      { new: true, upsert: true },
    );

    const added = updated_setting.tax_rates.at(-1);

    return res.status(201).json({
      status: "success",
      message: "Tax rate added successfully",
      data: added,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding tax rate",
      error: error.message,
    });
  }
};

/* ================= EDIT TAX RATE ================= */
export const handle_edit_tax_rate = async (req, res) => {
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

    const { tax_rate_id } = req.params;
    const { name, rate, status } = req.body;

    if (rate !== undefined) {
      if (isNaN(Number(rate)) || Number(rate) < 0 || Number(rate) > 100) {
        return res.status(400).json({
          status: "error",
          message: "Rate must be a number between 0 and 100.",
        });
      }
    }

    const VALID_STATUSES = ["active", "inactive"];
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const financial_setting = await financial_setting_model.findOne({ user_id });
    if (!financial_setting) {
      return res.status(404).json({
        status: "error",
        message: "Financial setting not found.",
      });
    }

    const tax_rate = financial_setting.tax_rates.id(tax_rate_id);
    if (!tax_rate) {
      return res.status(404).json({
        status: "error",
        message: "Tax rate not found.",
      });
    }

    const update = {};

    if (name !== undefined)
      update["tax_rates.$.name"] = name.trim();

    if (rate !== undefined)
      update["tax_rates.$.rate"] = Number(rate);

    if (status !== undefined)
      update["tax_rates.$.status"] = status;

    const updated_setting = await financial_setting_model.findOneAndUpdate(
      { user_id, "tax_rates._id": tax_rate_id },
      { $set: update },
      { new: true },
    );

    const updated_tax_rate = updated_setting.tax_rates.id(tax_rate_id);

    return res.status(200).json({
      status: "success",
      message: "Tax rate updated successfully",
      data: updated_tax_rate,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating tax rate",
      error: error.message,
    });
  }
};

/* ================= DELETE TAX RATE ================= */
export const handle_delete_tax_rate = async (req, res) => {
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

    const { tax_rate_id } = req.params;

    const financial_setting = await financial_setting_model.findOne({ user_id });
    if (!financial_setting) {
      return res.status(404).json({
        status: "error",
        message: "Financial setting not found.",
      });
    }

    const tax_rate = financial_setting.tax_rates.id(tax_rate_id);
    if (!tax_rate) {
      return res.status(404).json({
        status: "error",
        message: "Tax rate not found.",
      });
    }

    await financial_setting_model.findOneAndUpdate(
      { user_id },
      { $pull: { tax_rates: { _id: tax_rate_id } } },
    );

    return res.status(200).json({
      status: "success",
      message: "Tax rate deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting tax rate",
      error: error.message,
    });
  }
};

/* ================= GET ALL CURRENCIES ================= */
export const handle_get_currencies = async (req, res) => {
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

    let financial_setting = await financial_setting_model.findOne({ user_id });

    if (!financial_setting) {
      financial_setting = await financial_setting_model.create({ user_id });
    }

    return res.status(200).json({
      status: "success",
      message: "Currencies fetched successfully",
      data: financial_setting.currencies || [],
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching currencies",
      error: error.message,
    });
  }
};

/* ================= ADD CURRENCY ================= */
export const handle_add_currency = async (req, res) => {
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

    const { name, symbol, position, code, status } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        status: "error",
        message: "Currency name is required.",
      });
    }

    if (!symbol || symbol.trim() === "") {
      return res.status(400).json({
        status: "error",
        message: "Currency symbol is required.",
      });
    }

    if (!code || code.trim() === "") {
      return res.status(400).json({
        status: "error",
        message: "Currency code is required.",
      });
    }

    const VALID_POSITIONS = ["before", "after"];
    if (position !== undefined && !VALID_POSITIONS.includes(position)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid position. Allowed: ${VALID_POSITIONS.join(", ")}`,
      });
    }

    const VALID_STATUSES = ["active", "inactive"];
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}`,
      });
    }

    // Prevent duplicate currency codes for the same user
    const existing_setting = await financial_setting_model.findOne({ user_id });
    if (existing_setting) {
      const duplicate = existing_setting.currencies.find(
        (c) => c.code.toUpperCase() === code.trim().toUpperCase(),
      );
      if (duplicate) {
        return res.status(409).json({
          status: "error",
          message: `Currency with code "${code.toUpperCase()}" already exists.`,
        });
      }
    }

    const new_currency = {
      name: name.trim(),
      symbol: symbol.trim(),
      code: code.trim().toUpperCase(),
      ...(position && { position }),
      ...(status && { status }),
    };

    const updated_setting = await financial_setting_model.findOneAndUpdate(
      { user_id },
      { $push: { currencies: new_currency } },
      { new: true, upsert: true },
    );

    const added = updated_setting.currencies.at(-1);

    return res.status(201).json({
      status: "success",
      message: "Currency added successfully",
      data: added,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding currency",
      error: error.message,
    });
  }
};

/* ================= EDIT CURRENCY ================= */
export const handle_edit_currency = async (req, res) => {
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

    const { currency_id } = req.params;
    const { name, symbol, position, code, status } = req.body;

    const VALID_POSITIONS = ["before", "after"];
    if (position !== undefined && !VALID_POSITIONS.includes(position)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid position. Allowed: ${VALID_POSITIONS.join(", ")}`,
      });
    }

    const VALID_STATUSES = ["active", "inactive"];
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const financial_setting = await financial_setting_model.findOne({ user_id });
    if (!financial_setting) {
      return res.status(404).json({
        status: "error",
        message: "Financial setting not found.",
      });
    }

    const currency = financial_setting.currencies.id(currency_id);
    if (!currency) {
      return res.status(404).json({
        status: "error",
        message: "Currency not found.",
      });
    }

    // Prevent duplicate code conflict with other currencies
    if (code !== undefined) {
      const duplicate = financial_setting.currencies.find(
        (c) =>
          c.code.toUpperCase() === code.trim().toUpperCase() &&
          c._id.toString() !== currency_id,
      );
      if (duplicate) {
        return res.status(409).json({
          status: "error",
          message: `Another currency with code "${code.toUpperCase()}" already exists.`,
        });
      }
    }

    const update = {};

    if (name !== undefined)
      update["currencies.$.name"] = name.trim();

    if (symbol !== undefined)
      update["currencies.$.symbol"] = symbol.trim();

    if (code !== undefined)
      update["currencies.$.code"] = code.trim().toUpperCase();

    if (position !== undefined)
      update["currencies.$.position"] = position;

    if (status !== undefined)
      update["currencies.$.status"] = status;

    const updated_setting = await financial_setting_model.findOneAndUpdate(
      { user_id, "currencies._id": currency_id },
      { $set: update },
      { new: true },
    );

    const updated_currency = updated_setting.currencies.id(currency_id);

    return res.status(200).json({
      status: "success",
      message: "Currency updated successfully",
      data: updated_currency,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating currency",
      error: error.message,
    });
  }
};

/* ================= DELETE CURRENCY ================= */
export const handle_delete_currency = async (req, res) => {
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

    const { currency_id } = req.params;

    const financial_setting = await financial_setting_model.findOne({ user_id });
    if (!financial_setting) {
      return res.status(404).json({
        status: "error",
        message: "Financial setting not found.",
      });
    }

    const currency = financial_setting.currencies.id(currency_id);
    if (!currency) {
      return res.status(404).json({
        status: "error",
        message: "Currency not found.",
      });
    }

    await financial_setting_model.findOneAndUpdate(
      { user_id },
      { $pull: { currencies: { _id: currency_id } } },
    );

    return res.status(200).json({
      status: "success",
      message: "Currency deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting currency",
      error: error.message,
    });
  }
};

/* ================= HELPER ================= */
// Shows first 4 + last 4 chars, masks the middle — e.g. "sk_li...3xYZ"
const mask_key = (key) => {
  if (key.length <= 8) return "****";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
};
