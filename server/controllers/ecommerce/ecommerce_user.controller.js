import user_model from "../../models/user.model.js";
import user_verification_model from "../../models/user_verification.model.js";
import password_reset_model from "../../models/password_reset.model.js";
import { mailer } from "../../utils/mailer.js";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import {
  upload_file_to_s3,
  delete_file_from_s3,
  build_s3_key,
  clear_temp_files,
} from "../../utils/s3.util.js";

/* ================= HELPER ================= */
const get_ecommerce_user = async (req) => {
  const { user_token } = req.cookies;
  if (!user_token) return { user: null, user_id: null };
  try {
    const { user_id } = jwt.verify(user_token, process.env.JWT_SECRET);
    const user = await user_model.findOne({
      _id: user_id,
      user_type: "ecommerce_user",
      is_deleted: false,
      is_active: true,
    });
    return { user, user_id };
  } catch {
    return { user: null, user_id: null };
  }
};

/* ================= EMAIL TEMPLATE ================= */
const build_forgot_password_email = (user_name, reset_link) => `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; color: #333; font-size: 14px; margin: 0; padding: 0; background: #f8fafc; }
      .container { max-width: 480px; margin: 0 auto; padding: 24px; }
      .card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
      .header { background: #0f172a; color: #fff; padding: 20px 24px; }
      .header h2 { margin: 0; font-size: 18px; }
      .body { padding: 24px; }
      .btn { display: inline-block; margin-top: 16px; padding: 12px 24px; background: #E8540A; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; }
      .muted { color: #6b7280; font-size: 12px; margin-top: 20px; line-height: 1.5; }
      .link { word-break: break-all; color: #E8540A; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="card">
        <div class="header"><h2>Password Reset Request</h2></div>
        <div class="body">
          <p>Hi ${user_name},</p>
          <p>We received a request to reset the password for your account. Click the button below to choose a new password. This link will expire in 1 hour.</p>
          <a class="btn" href="${reset_link}">Reset Password</a>
          <p class="muted">If the button doesn't work, copy and paste this link into your browser:<br/><span class="link">${reset_link}</span></p>
          <p class="muted">If you did not request a password reset, you can safely ignore this email — your password will remain unchanged.</p>
        </div>
      </div>
    </div>
  </body>
  </html>
`;

/* ================= SIGNUP ================= */
export const handle_signup_ecommerce_user = async (req, res) => {
  try {
    const { user_name, user_email, user_password, ecommerce_user_type } =
      req.body;

    // const validate = user_validation_schema.validate({
    //   user_name,
    //   user_email,
    //   user_password,
    //   ecommerce_user_type,
    // });

    // if (validate.error) {
    //   return res.status(400).json({
    //     error: validate.error,
    //     status: "error",
    //     message: validate.error.details[0].message + " !",
    //   });
    // }

    const existing_user = await user_model.findOne({ user_email });
    if (existing_user) {
      return res.status(400).json({
        error: "user with the user_email already exists",
        status: "error",
        message: "User already exists with the given email.",
      });
    }

    const hashed_password = await bcrypt.hash(user_password, 10);

    const new_user = await user_model.create({
      user_name,
      user_email,
      user_password: hashed_password,
      user_type: "ecommerce_user",
      ecommerce_user_type,
    });

    await new_user.save();

    const saved_user = await user_model.findOne({ user_email });
    const verification_token = nanoid(32);

    await user_verification_model.create({
      user_id: saved_user._id,
      user_verification_token: verification_token,
    });

    mailer.sendMail(
      {
        from: process.env.SMTP_USERNAME,
        to: saved_user.user_email,
        subject: `Verify Account for ${saved_user.user_name} - Comitted`,
        html: `<p>
          Please click the link below to verify your account:<br/>
          <a href="${process.env.FRONTEND_BASE_URL}/verify_email?token=${verification_token}&email=${saved_user.user_email}">Verify Email</a>
          <br/><br/>
          If you did not sign up for this account, please ignore this email.
          <br/><br/>
          Thank you
        </p>`,
      },
      (error, info) => {
        if (error) console.log(error);
        else console.log(info);
      },
    );

    new_user.user_password = undefined;

    const user_token = jwt.sign(
      { user_id: new_user._id, remember: true },
      process.env.JWT_SECRET,
    );

    res.cookie("user_token", user_token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      user: new_user,
      status: "success",
      message:
        "User created successfully. Please check your email for verification.",
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      status: "error",
      message: "Internal server error.",
    });
  }
};

export const handle_signin_ecommerce_user = async (req, res) => {
  try {
    const { user_email, user_password } = req.body;

    const user = await user_model.findOne({
      user_email,
      user_type: "ecommerce_user",
      is_deleted: false,
      is_active: true,
      is_suspended: false,
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Invalid email or password.",
      });
    }

    const is_match = await bcrypt.compare(user_password, user.user_password);
    if (!is_match) {
      return res.status(400).json({
        status: "error",
        message: "Invalid email or password.",
      });
    }

    user.user_password = undefined;

    const user_token = jwt.sign(
      { user_id: user._id, remember: true },
      process.env.JWT_SECRET,
    );

    res.cookie("user_token", user_token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      user,
      status: "success",
      message: "Signed in successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      status: "error",
      message: "Internal server error.",
    });
  }
};

/* ================= FORGOT PASSWORD ================= */
export const handle_forgot_password_ecommerce_user = async (req, res) => {
  try {
    const { user_email } = req.body;

    if (!user_email) {
      return res.status(400).json({
        status: "error",
        message: "Email is required.",
      });
    }

    const user = await user_model.findOne({
      user_email: user_email.trim(),
      user_type: "ecommerce_user",
      is_deleted: false,
      is_active: true,
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "No account found with this email address.",
      });
    }

    // Invalidate any previous reset requests for this user.
    await password_reset_model.deleteMany({ user_id: user._id });

    const reset_token = nanoid(32);

    await password_reset_model.create({
      user_id: user._id,
      reset_token,
      expires_at: new Date(Date.now() + 60 * 60 * 1000),
    });

    const reset_link = `${process.env.FRONTEND_BASE_URL}/reset_password?token=${reset_token}&email=${encodeURIComponent(user.user_email)}`;

    mailer.sendMail(
      {
        from: process.env.SMTP_USERNAME,
        to: user.user_email,
        subject: `Reset Your Password - Comitted`,
        html: build_forgot_password_email(user.user_name, reset_link),
      },
      (error, info) => {
        if (error) console.log(error);
        else console.log(info);
      },
    );

    return res.status(200).json({
      status: "success",
      message: "Password reset instructions have been sent to your email.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while processing your request.",
      error: error.message,
    });
  }
};

/* ================= RESET PASSWORD ================= */
export const handle_reset_password_ecommerce_user = async (req, res) => {
  try {
    const { user_email, token, new_password, confirm_password } = req.body;

    if (!user_email || !token || !new_password || !confirm_password) {
      return res.status(400).json({
        status: "error",
        message:
          "Email, token, new password and confirm password are all required.",
      });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({
        status: "error",
        message: "New password and confirm password do not match.",
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        status: "error",
        message: "New password must be at least 6 characters.",
      });
    }

    const user = await user_model.findOne({
      user_email: user_email.trim(),
      user_type: "ecommerce_user",
      is_deleted: false,
      is_active: true,
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "No account found with this email address.",
      });
    }

    const reset_request = await password_reset_model.findOne({
      user_id: user._id,
      reset_token: token,
    });

    if (!reset_request || reset_request.expires_at < new Date()) {
      return res.status(400).json({
        status: "error",
        message: "This password reset link is invalid or has expired.",
      });
    }

    user.user_password = await bcrypt.hash(new_password, 10);
    await user.save();

    await password_reset_model.deleteMany({ user_id: user._id });

    return res.status(200).json({
      status: "success",
      message:
        "Password reset successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while resetting your password.",
      error: error.message,
    });
  }
};

/* ================= GET PROFILE ================= */
export const handle_get_ecommerce_user_profile = async (req, res) => {
  try {
    const { user, user_id } = await get_ecommerce_user(req);
    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "Unauthorized." });
    }

    const profile = await user_model
      .findById(user_id)
      .select(
        "-user_password -user_permission_policies -user_permissions -user_groups",
      );

    return res.status(200).json({
      status: "success",
      message: "Profile fetched successfully.",
      data: profile,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching profile.",
      error: error.message,
    });
  }
};

/* ================= UPDATE PROFILE ================= */
export const handle_update_ecommerce_user_profile = async (req, res) => {
  try {
    const { user, user_id } = await get_ecommerce_user(req);
    if (!user) {
      clear_temp_files(req.file ? [req.file] : []);
      return res
        .status(401)
        .json({ status: "error", message: "Unauthorized." });
    }

    const {
      user_name,
      user_phone,
      user_email,
      address_line,
      country,
      state,
      city,
      postal_code,
    } = req.body;

    if (user_name !== undefined) {
      if (!user_name.trim()) {
        clear_temp_files(req.file ? [req.file] : []);
        return res.status(400).json({
          status: "error",
          message: "Full name cannot be empty.",
        });
      }
      user.user_name = user_name.trim();
    }

    if (user_email !== undefined) {
      if (user_email.trim() !== user.user_email) {
        user.user_email = user_email.trim();
        user.user_email_verified = false;
      }
    }

    if (user_phone !== undefined) user.user_phone = user_phone.trim();
    if (address_line !== undefined)
      user.address.address_line = address_line.trim();
    if (country !== undefined) user.address.country = country.trim();
    if (state !== undefined) user.address.state = state.trim();
    if (city !== undefined) user.address.city = city.trim();
    if (postal_code !== undefined)
      user.address.postal_code = postal_code.trim();

    if (req.file) {
      if (user.photo?.key) {
        await delete_file_from_s3(user.photo.key);
      }
      const key = build_s3_key(
        "ecommerce",
        "users",
        user_id.toString(),
        req.file.filename,
      );
      const uploaded = await upload_file_to_s3(req.file, key);
      user.photo = { key: uploaded.key, url: uploaded.url };
    }

    await user.save();
    user.user_password = undefined;

    return res.status(200).json({
      status: "success",
      message: "Profile updated successfully.",
      data: user,
    });
  } catch (error) {
    clear_temp_files(req.file ? [req.file] : []);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating profile.",
      error: error.message,
    });
  }
};

/* ================= CHANGE PASSWORD ================= */
export const handle_change_ecommerce_user_password = async (req, res) => {
  try {
    const { user } = await get_ecommerce_user(req);
    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "Unauthorized." });
    }

    const { current_password, new_password, confirm_password } = req.body;

    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).json({
        status: "error",
        message:
          "Current password, new password and confirm password are all required.",
      });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({
        status: "error",
        message: "New password and confirm password do not match.",
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        status: "error",
        message: "New password must be at least 6 characters.",
      });
    }

    const is_match = await bcrypt.compare(current_password, user.user_password);
    if (!is_match) {
      return res.status(400).json({
        status: "error",
        message: "Current password is incorrect.",
      });
    }

    user.user_password = await bcrypt.hash(new_password, 10);
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Password changed successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while changing password.",
      error: error.message,
    });
  }
};

/* ================= GET PAYMENT METHODS & PREFERENCES ================= */
export const handle_get_payment = async (req, res) => {
  try {
    const { user } = await get_ecommerce_user(req);
    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "Unauthorized." });
    }

    return res.status(200).json({
      status: "success",
      message: "Payment data fetched successfully.",
      data: {
        payment_methods: user.payment_methods,
        payment_preferences: user.payment_preferences,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching payment data.",
      error: error.message,
    });
  }
};

/* ================= ADD PAYMENT METHOD ================= */
export const handle_add_payment_method = async (req, res) => {
  try {
    const { user } = await get_ecommerce_user(req);
    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "Unauthorized." });
    }

    const {
      type,
      card_type,
      card_number,
      card_exp_month,
      card_exp_year,
      cvv,
      bank_name,
      bank_account_number,
      paypal_email,
    } = req.body;

    const VALID_TYPES = ["card", "bank_account", "paypal"];
    if (!type || !VALID_TYPES.includes(type)) {
      return res.status(400).json({
        status: "error",
        message: `Type is required. Allowed: ${VALID_TYPES.join(", ")}`,
      });
    }

    // Type-specific validation
    if (type === "card") {
      if (!card_number || card_number.toString().length !== 16) {
        return res.status(400).json({
          status: "error",
          message: "A valid 16-digit card number is required.",
        });
      }
      if (!card_exp_month || !card_exp_year) {
        return res.status(400).json({
          status: "error",
          message: "Card expiry month and year are required.",
        });
      }
      if (!cvv) {
        return res.status(400).json({
          status: "error",
          message: "CVV is required.",
        });
      }
    }

    if (type === "bank_account") {
      if (!bank_name || !bank_account_number) {
        return res.status(400).json({
          status: "error",
          message: "Bank name and account number are required.",
        });
      }
    }

    if (type === "paypal") {
      if (!paypal_email) {
        return res.status(400).json({
          status: "error",
          message: "PayPal email is required.",
        });
      }
    }

    const new_method = { type };

    if (type === "card") {
      const card_str = card_number.toString();
      new_method.card_type = card_type;
      new_method.card_number = card_str;
      new_method.card_last4 = card_str.slice(-4);
      new_method.card_exp_month = Number(card_exp_month);
      new_method.card_exp_year = Number(card_exp_year);
      new_method.cvv = cvv.toString();
    }

    if (type === "bank_account") {
      const acc_str = bank_account_number.toString();
      new_method.bank_name = bank_name.trim();
      new_method.bank_account_number = acc_str;
      new_method.bank_account_last4 = acc_str.slice(-4);
    }

    if (type === "paypal") {
      new_method.paypal_email = paypal_email.trim();
    }

    user.payment_methods.push(new_method);
    await user.save();

    const added = user.payment_methods.at(-1);

    return res.status(201).json({
      status: "success",
      message: "Payment method added successfully.",
      data: added,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding payment method.",
      error: error.message,
    });
  }
};

/* ================= EDIT PAYMENT METHOD ================= */
export const handle_edit_payment_method = async (req, res) => {
  try {
    const { user } = await get_ecommerce_user(req);
    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "Unauthorized." });
    }

    const { payment_method_id } = req.params;

    const method = user.payment_methods.id(payment_method_id);
    if (!method) {
      return res.status(404).json({
        status: "error",
        message: "Payment method not found.",
      });
    }

    const {
      card_type,
      card_number,
      card_exp_month,
      card_exp_year,
      cvv,
      bank_name,
      bank_account_number,
      paypal_email,
    } = req.body;

    if (method.type === "card") {
      if (card_number !== undefined) {
        const card_str = card_number.toString();
        if (card_str.length !== 16) {
          return res.status(400).json({
            status: "error",
            message: "Card number must be 16 digits.",
          });
        }
        method.card_number = card_str;
        method.card_last4 = card_str.slice(-4);
      }
      if (card_type !== undefined) method.card_type = card_type;
      if (card_exp_month !== undefined)
        method.card_exp_month = Number(card_exp_month);
      if (card_exp_year !== undefined)
        method.card_exp_year = Number(card_exp_year);
      if (cvv !== undefined) method.cvv = cvv.toString();
    }

    if (method.type === "bank_account") {
      if (bank_account_number !== undefined) {
        const acc_str = bank_account_number.toString();
        method.bank_account_number = acc_str;
        method.bank_account_last4 = acc_str.slice(-4);
      }
      if (bank_name !== undefined) method.bank_name = bank_name.trim();
    }

    if (method.type === "paypal") {
      if (paypal_email !== undefined) method.paypal_email = paypal_email.trim();
    }

    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Payment method updated successfully.",
      data: method,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating payment method.",
      error: error.message,
    });
  }
};

/* ================= DELETE PAYMENT METHOD ================= */
export const handle_delete_payment_method = async (req, res) => {
  try {
    const { user } = await get_ecommerce_user(req);
    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "Unauthorized." });
    }

    const { payment_method_id } = req.params;

    const method = user.payment_methods.id(payment_method_id);
    if (!method) {
      return res.status(404).json({
        status: "error",
        message: "Payment method not found.",
      });
    }

    user.payment_methods.pull({ _id: payment_method_id });
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Payment method deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting payment method.",
      error: error.message,
    });
  }
};

/* ================= UPDATE PAYMENT PREFERENCES ================= */
export const handle_update_payment_preferences = async (req, res) => {
  try {
    const { user } = await get_ecommerce_user(req);
    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "Unauthorized." });
    }

    const { auto_pay, save_payment_info } = req.body;

    if (auto_pay !== undefined)
      user.payment_preferences.auto_pay = Boolean(auto_pay);
    if (save_payment_info !== undefined)
      user.payment_preferences.save_payment_info = Boolean(save_payment_info);

    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Payment preferences updated successfully.",
      data: user.payment_preferences,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating payment preferences.",
      error: error.message,
    });
  }
};

/* ================= GET NOTIFICATION PREFERENCES ================= */
export const handle_get_notification_preferences = async (req, res) => {
  try {
    const { user } = await get_ecommerce_user(req);
    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "Unauthorized." });
    }

    return res.status(200).json({
      status: "success",
      message: "Notification preferences fetched successfully.",
      data: user.notification_preferences,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching notification preferences.",
      error: error.message,
    });
  }
};

/* ================= UPDATE NOTIFICATION PREFERENCES ================= */
export const handle_update_notification_preferences = async (req, res) => {
  try {
    const { user } = await get_ecommerce_user(req);
    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "Unauthorized." });
    }

    const {
      email_notifications,
      sms_notifications,
      property_alerts,
      tour_reminders,
      maintenance_updates,
      marketing_emails,
    } = req.body;

    if (email_notifications !== undefined)
      user.notification_preferences.email_notifications =
        Boolean(email_notifications);
    if (sms_notifications !== undefined)
      user.notification_preferences.sms_notifications =
        Boolean(sms_notifications);
    if (property_alerts !== undefined)
      user.notification_preferences.property_alerts = Boolean(property_alerts);
    if (tour_reminders !== undefined)
      user.notification_preferences.tour_reminders = Boolean(tour_reminders);
    if (maintenance_updates !== undefined)
      user.notification_preferences.maintenance_updates =
        Boolean(maintenance_updates);
    if (marketing_emails !== undefined)
      user.notification_preferences.marketing_emails =
        Boolean(marketing_emails);

    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Notification preferences updated successfully.",
      data: user.notification_preferences,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating notification preferences.",
      error: error.message,
    });
  }
};

/* ================= GET ACCOUNT PREFERENCES ================= */
export const handle_get_account_preferences = async (req, res) => {
  try {
    const { user } = await get_ecommerce_user(req);
    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "Unauthorized." });
    }

    return res.status(200).json({
      status: "success",
      message: "Account preferences fetched successfully.",
      data: user.account_preferences,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching account preferences.",
      error: error.message,
    });
  }
};

/* ================= UPDATE ACCOUNT PREFERENCES ================= */
export const handle_update_account_preferences = async (req, res) => {
  try {
    const { user } = await get_ecommerce_user(req);
    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "Unauthorized." });
    }

    const { language, timezone, currency, date_format, privacy_settings } =
      req.body;

    if (language !== undefined)
      user.account_preferences.language = language.trim();
    if (timezone !== undefined)
      user.account_preferences.timezone = timezone.trim();
    if (currency !== undefined)
      user.account_preferences.currency = currency.trim();
    if (date_format !== undefined)
      user.account_preferences.date_format = date_format.trim();

    // privacy_settings is expected to be an object with 2 fields: profile_visibility, show_activity_status
    const parsed_privacy_settings = JSON.parse(privacy_settings || "{}");
    if (parsed_privacy_settings.profile_visibility !== undefined)
      user.account_preferences.privacy_settings.profile_visibility =
        parsed_privacy_settings.profile_visibility.trim();
    if (parsed_privacy_settings.show_activity_status !== undefined)
      user.account_preferences.privacy_settings.show_activity_status = Boolean(
        parsed_privacy_settings.show_activity_status,
      );

    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Account preferences updated successfully.",
      data: user.account_preferences,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating account preferences.",
      error: error.message,
    });
  }
};

export const handle_add_saved_property = async (req, res) => {
  try {
    const { user } = await get_ecommerce_user(req);
    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "Unauthorized." });
    }

    const { property_id } = req.body;

    if (!property_id) {
      return res.status(400).json({
        status: "error",
        message: "Property ID is required.",
      });
    }

    if (user.saved_properties.includes(property_id)) {
      return res.status(400).json({
        status: "error",
        message: "Property already saved.",
      });
    }

    user.saved_properties.push(property_id);
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Property added to saved list successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding saved property.",
      error: error.message,
    });
  }
};

export const handle_remove_saved_property = async (req, res) => {
  try {
    const { user } = await get_ecommerce_user(req);
    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "Unauthorized." });
    }

    const { property_id } = req.body;

    if (!property_id) {
      return res.status(400).json({
        status: "error",
        message: "Property ID is required.",
      });
    }

    if (!user.saved_properties.includes(property_id)) {
      return res.status(400).json({
        status: "error",
        message: "Property not found in saved list.",
      });
    }

    user.saved_properties.pull(property_id);
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Property removed from saved list successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while removing saved property.",
      error: error.message,
    });
  }
};