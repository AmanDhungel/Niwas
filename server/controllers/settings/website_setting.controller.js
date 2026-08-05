import jwt from "jsonwebtoken";
import website_setting_model from "../../models/settings/website_setting.model.js";
import user_model from "../../models/user.model.js";
import {
  upload_file_to_s3,
  delete_file_from_s3,
  build_s3_key,
  clear_temp_files,
} from "../../utils/s3.util.js";

/* ================= IMAGE FIELDS CONFIG ================= */
const image_fields = [
  "white_logo",
  "dark_logo",
  "white_mini_logo",
  "dark_mini_logo",
  "favicon",
  "apple_touch_icon",
];

/* ================= GET BUSINESS SETTINGS ================= */
export const handle_get_business_settings = async (req, res) => {
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

    /* -------- Find or create with empty defaults -------- */
    let website_setting = await website_setting_model.findOne({ user_id });

    if (!website_setting) {
      website_setting = await website_setting_model.create({ user_id });
    }

    return res.status(200).json({
      status: "success",
      message: "Business settings fetched successfully",
      data: website_setting.business_settings || {},
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching business settings",
      error: error.message,
    });
  }
};

/* ================= UPDATE BUSINESS SETTINGS ================= */
export const handle_update_business_settings = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      clear_temp_files(req.files);
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    /* -------- Ensure record exists -------- */
    let website_setting = await website_setting_model.findOne({ user_id });
    if (!website_setting) {
      website_setting = await website_setting_model.create({ user_id });
    }

    const {
      company_name,
      email_address,
      phone_number,
      fax,
      website_url,
      address,
    } = req.body;

    const update = {};

    if (company_name)  update["business_settings.company_name"]  = company_name.trim();
    if (email_address) update["business_settings.email_address"] = email_address.trim();
    if (phone_number)  update["business_settings.phone_number"]  = phone_number.trim();
    if (fax)           update["business_settings.fax"]           = fax.trim();
    if (website_url)   update["business_settings.website_url"]   = website_url.trim();

    /* -------- Address -------- */
    if (address) {
      const parsed_address =
        typeof address === "string" ? JSON.parse(address) : address;

      const existing_address =
        website_setting.business_settings?.address || {};

      update["business_settings.address"] = {
        address_line: parsed_address.address_line ?? existing_address.address_line,
        country:      parsed_address.country      ?? existing_address.country,
        state:        parsed_address.state         ?? existing_address.state,
        city:         parsed_address.city          ?? existing_address.city,
        postal_code:  parsed_address.postal_code   ?? existing_address.postal_code,
      };
    }

    /* -------- Handle image uploads & removals -------- */
    for (const field of image_fields) {
      const remove_flag = req.body[`remove_${field}`];
      const existing_image =
        website_setting.business_settings?.company_images?.[field];

      /* Remove existing */
      if (remove_flag === "true" && existing_image?.key) {
        await delete_file_from_s3(existing_image.key);
        update[`business_settings.company_images.${field}`] = {
          url: null,
          key: null,
        };
      }

      /* Upload new */
      const uploaded_file = req.files?.[field]?.[0] || null;
      if (uploaded_file) {
        if (existing_image?.key) {
          await delete_file_from_s3(existing_image.key);
        }

        const key = build_s3_key(
          "website_setting",
          user_id.toString(),
          field,
          uploaded_file.filename,
        );
        const uploaded = await upload_file_to_s3(uploaded_file, key);

        update[`business_settings.company_images.${field}`] = {
          url: uploaded.url,
          key: uploaded.key,
        };
      }
    }

    const updated_setting = await website_setting_model.findOneAndUpdate(
      { user_id },
      { $set: update },
      { new: true },
    );

    clear_temp_files(req.files);

    return res.status(200).json({
      status: "success",
      message: "Business settings updated successfully",
      data: updated_setting.business_settings || {},
    });
  } catch (error) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating business settings",
      error: error.message,
    });
  }
};

/* ================= GET SEO SETTINGS ================= */
export const handle_get_seo_settings = async (req, res) => {
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

    let website_setting = await website_setting_model.findOne({ user_id });

    if (!website_setting) {
      website_setting = await website_setting_model.create({ user_id });
    }

    return res.status(200).json({
      status: "success",
      message: "SEO settings fetched successfully",
      data: website_setting.seo_settings || {},
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching SEO settings",
      error: error.message,
    });
  }
};

/* ================= UPDATE SEO SETTINGS ================= */
export const handle_update_seo_settings = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);
    const user_id = verify_token.user_id;

    const existing_user = await user_model.findById(user_id);
    if (!existing_user) {
      clear_temp_files(req.files);
      return res.status(401).json({
        status: "error",
        message: "User not found.",
      });
    }

    let website_setting = await website_setting_model.findOne({ user_id });
    if (!website_setting) {
      website_setting = await website_setting_model.create({ user_id });
    }

    const {
      meta_title,
      meta_description,
      meta_keywords,
      canonical_url,
      og_title,
      og_description,
      remove_og_image,
    } = req.body;

    const update = {};

    if (meta_title)       update["seo_settings.meta_title"]       = meta_title.trim();
    if (meta_description) update["seo_settings.meta_description"] = meta_description.trim();
    if (meta_keywords)    update["seo_settings.meta_keywords"]    = meta_keywords.trim();
    if (canonical_url)    update["seo_settings.canonical_url"]    = canonical_url.trim();
    if (og_title)         update["seo_settings.og_title"]         = og_title.trim();
    if (og_description)   update["seo_settings.og_description"]   = og_description.trim();

    /* -------- OG Image: remove -------- */
    const existing_og_image = website_setting.seo_settings?.og_image;

    if (remove_og_image === "true" && existing_og_image?.key) {
      await delete_file_from_s3(existing_og_image.key);
      update["seo_settings.og_image"] = { url: null, key: null };
    }

    /* -------- OG Image: upload new -------- */
    const og_image_file = req.files?.og_image?.[0] || null;
    if (og_image_file) {
      if (existing_og_image?.key) {
        await delete_file_from_s3(existing_og_image.key);
      }

      const key = build_s3_key(
        "website_setting",
        user_id.toString(),
        "og_image",
        og_image_file.filename,
      );
      const uploaded = await upload_file_to_s3(og_image_file, key);

      update["seo_settings.og_image"] = {
        url: uploaded.url,
        key: uploaded.key,
      };
    }

    const updated_setting = await website_setting_model.findOneAndUpdate(
      { user_id },
      { $set: update },
      { new: true },
    );

    clear_temp_files(req.files);

    return res.status(200).json({
      status: "success",
      message: "SEO settings updated successfully",
      data: updated_setting.seo_settings || {},
    });
  } catch (error) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating SEO settings",
      error: error.message,
    });
  }
};

/* ================= GET LOCALIZATION SETTINGS ================= */
export const handle_get_localization_settings = async (req, res) => {
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

    let website_setting = await website_setting_model.findOne({ user_id });

    if (!website_setting) {
      website_setting = await website_setting_model.create({ user_id });
    }

    return res.status(200).json({
      status: "success",
      message: "Localization settings fetched successfully",
      data: website_setting.localization || {},
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching localization settings",
      error: error.message,
    });
  }
};

/* ================= UPDATE LOCALIZATION SETTINGS ================= */
export const handle_update_localization_settings = async (req, res) => {
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

    let website_setting = await website_setting_model.findOne({ user_id });
    if (!website_setting) {
      website_setting = await website_setting_model.create({ user_id });
    }

    const {
      language,
      timezone,
      language_switcher,
      date_format,
      time_format,
      financial_year,
      starting_month,
      currency,
      currency_symbol,
      currency_position,
      decimal_separator,
      thousand_separator,
      countries_restriction,
      allowed_files,
      max_file_size,
    } = req.body;

    const update = {};

    if (language !== undefined)
      update["localization.language"] = language;
    if (timezone !== undefined)
      update["localization.timezone"] = timezone;
    if (date_format !== undefined)
      update["localization.date_format"] = date_format;
    if (time_format !== undefined)
      update["localization.time_format"] = time_format;
    if (financial_year !== undefined)
      update["localization.financial_year"] = financial_year;
    if (starting_month !== undefined)
      update["localization.starting_month"] = starting_month;
    if (currency !== undefined)
      update["localization.currency"] = currency;
    if (currency_symbol !== undefined)
      update["localization.currency_symbol"] = currency_symbol;
    if (currency_position !== undefined)
      update["localization.currency_position"] = currency_position;
    if (decimal_separator !== undefined)
      update["localization.decimal_separator"] = decimal_separator;
    if (thousand_separator !== undefined)
      update["localization.thousand_separator"] = thousand_separator;
    if (max_file_size !== undefined)
      update["localization.max_file_size"] = Number(max_file_size);

    /* -------- Nested object: language_switcher -------- */
    if (language_switcher !== undefined) {
      const parsed =
        typeof language_switcher === "string"
          ? JSON.parse(language_switcher)
          : language_switcher;
      if (typeof parsed.enabled === "boolean") {
        update["localization.language_switcher.enabled"] = parsed.enabled;
      }
    }

    /* -------- Array fields -------- */
    if (countries_restriction !== undefined) {
      update["localization.countries_restriction"] =
        typeof countries_restriction === "string"
          ? JSON.parse(countries_restriction)
          : countries_restriction;
    }

    if (allowed_files !== undefined) {
      update["localization.allowed_files"] =
        typeof allowed_files === "string"
          ? JSON.parse(allowed_files)
          : allowed_files;
    }

    const updated_setting = await website_setting_model.findOneAndUpdate(
      { user_id },
      { $set: update },
      { new: true, upsert: true },
    );

    return res.status(200).json({
      status: "success",
      message: "Localization settings updated successfully",
      data: updated_setting.localization || {},
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating localization settings",
      error: error.message,
    });
  }
};

/* ================= GET PREFIXES SETTINGS ================= */
export const handle_get_prefixes_settings = async (req, res) => {
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

    let website_setting = await website_setting_model.findOne({ user_id });

    if (!website_setting) {
      website_setting = await website_setting_model.create({ user_id });
    }

    return res.status(200).json({
      status: "success",
      message: "Prefixes settings fetched successfully",
      data: website_setting.prefixes || {},
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching prefixes settings",
      error: error.message,
    });
  }
};

/* ================= UPDATE PREFIXES SETTINGS ================= */
export const handle_update_prefixes_settings = async (req, res) => {
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

    let website_setting = await website_setting_model.findOne({ user_id });
    if (!website_setting) {
      website_setting = await website_setting_model.create({ user_id });
    }

    const {
      employee,
      invoice,
      candidate,
      referral,
      clients,
      tickets,
      job,
      assets,
    } = req.body;

    const update = {};

    const prefix_fields = {
      employee,
      invoice,
      candidate,
      referral,
      clients,
      tickets,
      job,
      assets,
    };

    for (const [key, value] of Object.entries(prefix_fields)) {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        update[`prefixes.${key}`] = String(value).trim().toUpperCase();
      }
    }

    const updated_setting = await website_setting_model.findOneAndUpdate(
      { user_id },
      { $set: update },
      { new: true, upsert: true },
    );

    return res.status(200).json({
      status: "success",
      message: "Prefixes settings updated successfully",
      data: updated_setting.prefixes || {},
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating prefixes settings",
      error: error.message,
    });
  }
};

/* ================= GET PREFERENCES SETTINGS ================= */
export const handle_get_preferences_settings = async (req, res) => {
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

    let website_setting = await website_setting_model.findOne({ user_id });

    if (!website_setting) {
      website_setting = await website_setting_model.create({ user_id });
    }

    return res.status(200).json({
      status: "success",
      message: "Preferences settings fetched successfully",
      data: website_setting.preferences || {},
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching preferences settings",
      error: error.message,
    });
  }
};

/* ================= UPDATE PREFERENCES SETTINGS ================= */
export const handle_update_preferences_settings = async (req, res) => {
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

    let website_setting = await website_setting_model.findOne({ user_id });
    if (!website_setting) {
      website_setting = await website_setting_model.create({ user_id });
    }

    const {
      employees,
      contacts,
      leads,
      sales,
      clients,
      companies,
      pipelines,
      accounting,
      projects,
      deals,
      activities,
      reports,
    } = req.body;

    const update = {};

    const preference_fields = {
      employees,
      contacts,
      leads,
      sales,
      clients,
      companies,
      pipelines,
      accounting,
      projects,
      deals,
      activities,
      reports,
    };

    for (const [key, value] of Object.entries(preference_fields)) {
      if (typeof value === "boolean") {
        update[`preferences.${key}`] = value;
      } else if (value === "true" || value === "false") {
        update[`preferences.${key}`] = value === "true";
      }
    }

    const updated_setting = await website_setting_model.findOneAndUpdate(
      { user_id },
      { $set: update },
      { new: true, upsert: true },
    );

    return res.status(200).json({
      status: "success",
      message: "Preferences settings updated successfully",
      data: updated_setting.preferences || {},
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating preferences settings",
      error: error.message,
    });
  }
};

/* ================= GET AI SETTINGS ================= */
export const handle_get_ai_settings = async (req, res) => {
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

    let website_setting = await website_setting_model.findOne({ user_id });

    if (!website_setting) {
      website_setting = await website_setting_model.create({ user_id });
    }

    /* -------- Mask the API key for security -------- */
    const raw_key = website_setting.ai_settings?.openai_api_key || null;
    const masked_key = raw_key
      ? `${raw_key.slice(0, 6)}${"*".repeat(Math.max(0, raw_key.length - 10))}${raw_key.slice(-4)}`
      : null;

    return res.status(200).json({
      status: "success",
      message: "AI settings fetched successfully",
      data: {
        openai_api_key: masked_key,
        has_api_key: !!raw_key,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching AI settings",
      error: error.message,
    });
  }
};

/* ================= UPDATE AI SETTINGS ================= */
export const handle_update_ai_settings = async (req, res) => {
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

    const { openai_api_key } = req.body;

    if (!openai_api_key || String(openai_api_key).trim() === "") {
      return res.status(400).json({
        status: "error",
        message: "openai_api_key is required",
      });
    }

    const updated_setting = await website_setting_model.findOneAndUpdate(
      { user_id },
      { $set: { "ai_settings.openai_api_key": openai_api_key.trim() } },
      { new: true, upsert: true },
    );

    const raw_key = updated_setting.ai_settings?.openai_api_key || null;
    const masked_key = raw_key
      ? `${raw_key.slice(0, 6)}${"*".repeat(Math.max(0, raw_key.length - 10))}${raw_key.slice(-4)}`
      : null;

    return res.status(200).json({
      status: "success",
      message: "AI settings updated successfully",
      data: {
        openai_api_key: masked_key,
        has_api_key: !!raw_key,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating AI settings",
      error: error.message,
    });
  }
};

/* ================= GET APPEARANCE SETTINGS ================= */
export const handle_get_appearance_settings = async (req, res) => {
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

    let website_setting = await website_setting_model.findOne({ user_id });

    if (!website_setting) {
      website_setting = await website_setting_model.create({ user_id });
    }

    return res.status(200).json({
      status: "success",
      message: "Appearance settings fetched successfully",
      data: website_setting.appearance || {},
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching appearance settings",
      error: error.message,
    });
  }
};

/* ================= UPDATE APPEARANCE SETTINGS ================= */
export const handle_update_appearance_settings = async (req, res) => {
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

    const { theme, accent_color, sidebar_size, font_family } = req.body;

    const VALID_THEMES       = ["light", "dark", "auto"];
    const VALID_SIDEBAR_SIZES = ["small", "medium", "large"];

    if (theme !== undefined && !VALID_THEMES.includes(theme)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid theme. Allowed values: ${VALID_THEMES.join(", ")}`,
      });
    }

    if (sidebar_size !== undefined && !VALID_SIDEBAR_SIZES.includes(sidebar_size)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid sidebar_size. Allowed values: ${VALID_SIDEBAR_SIZES.join(", ")}`,
      });
    }

    const update = {};

    if (theme        !== undefined) update["appearance.theme"]        = theme;
    if (accent_color !== undefined) update["appearance.accent_color"] = accent_color.trim();
    if (sidebar_size !== undefined) update["appearance.sidebar_size"] = sidebar_size;
    if (font_family  !== undefined) update["appearance.font_family"]  = font_family.trim();

    const updated_setting = await website_setting_model.findOneAndUpdate(
      { user_id },
      { $set: update },
      { new: true, upsert: true },
    );

    return res.status(200).json({
      status: "success",
      message: "Appearance settings updated successfully",
      data: updated_setting.appearance || {},
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating appearance settings",
      error: error.message,
    });
  }
};

/* ================= GET AUTHENTICATION SETTINGS ================= */
export const handle_get_authentication_settings = async (req, res) => {
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

    let website_setting = await website_setting_model.findOne({ user_id });

    if (!website_setting) {
      website_setting = await website_setting_model.create({ user_id });
    }

    return res.status(200).json({
      status: "success",
      message: "Authentication settings fetched successfully",
      data: website_setting.authentication_settings || {},
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching authentication settings",
      error: error.message,
    });
  }
};

/* ================= UPDATE AUTHENTICATION SETTINGS ================= */
export const handle_update_authentication_settings = async (req, res) => {
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
      allow_registration,
      verification_required,
      verification_expired,
      referral_system,
      login_type,
      password,
      otp_system,
    } = req.body;

    const VALID_LOGIN_TYPES = ["email", "phone"];
    const VALID_OTP_TYPES   = ["email", "sms"];

    if (login_type !== undefined && !VALID_LOGIN_TYPES.includes(login_type)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid login_type. Allowed values: ${VALID_LOGIN_TYPES.join(", ")}`,
      });
    }

    if (
      otp_system?.otp_type !== undefined &&
      !VALID_OTP_TYPES.includes(otp_system.otp_type)
    ) {
      return res.status(400).json({
        status: "error",
        message: `Invalid otp_type. Allowed values: ${VALID_OTP_TYPES.join(", ")}`,
      });
    }

    const parseBool = (val) => {
      if (typeof val === "boolean") return val;
      if (val === "true")  return true;
      if (val === "false") return false;
      return undefined;
    };

    const update = {};

    /* -------- allow_registration -------- */
    if (allow_registration !== undefined) {
      const parsed =
        typeof allow_registration === "string"
          ? JSON.parse(allow_registration)
          : allow_registration;

      if (parseBool(parsed?.enabled) !== undefined)
        update["authentication_settings.allow_registration.enabled"] =
          parseBool(parsed.enabled);

      if (parseBool(parsed?.invite_only) !== undefined)
        update["authentication_settings.allow_registration.invite_only"] =
          parseBool(parsed.invite_only);
    }

    /* -------- flat boolean / string fields -------- */
    if (parseBool(verification_required) !== undefined)
      update["authentication_settings.verification_required"] =
        parseBool(verification_required);

    if (verification_expired !== undefined)
      update["authentication_settings.verification_expired"] =
        String(verification_expired).trim();

    if (login_type !== undefined)
      update["authentication_settings.login_type"] = login_type;

    if (parseBool(password) !== undefined)
      update["authentication_settings.password"] = parseBool(password);

    /* -------- referral_system -------- */
    if (referral_system !== undefined) {
      const parsed =
        typeof referral_system === "string"
          ? JSON.parse(referral_system)
          : referral_system;

      if (parseBool(parsed?.enabled) !== undefined)
        update["authentication_settings.referral_system.enabled"] =
          parseBool(parsed.enabled);
    }

    /* -------- otp_system -------- */
    if (otp_system !== undefined) {
      const parsed =
        typeof otp_system === "string"
          ? JSON.parse(otp_system)
          : otp_system;

      if (parseBool(parsed?.enabled) !== undefined)
        update["authentication_settings.otp_system.enabled"] =
          parseBool(parsed.enabled);

      if (parsed?.otp_type !== undefined)
        update["authentication_settings.otp_system.otp_type"] = parsed.otp_type;
    }

    const updated_setting = await website_setting_model.findOneAndUpdate(
      { user_id },
      { $set: update },
      { new: true, upsert: true },
    );

    return res.status(200).json({
      status: "success",
      message: "Authentication settings updated successfully",
      data: updated_setting.authentication_settings || {},
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating authentication settings",
      error: error.message,
    });
  }
};