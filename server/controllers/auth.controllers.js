import user_model, { user_validation_schema } from "../models/user.model.js";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import user_verification_model from "../models/user_verification.model.js";
import jwt from "jsonwebtoken";
import {
  deleteMediaFromCloudinary,
  uploadMediaToCloudinary,
} from "../utils/cloudinary.js";
import fs from "fs";
import { mailer } from "../utils/mailer.js";

const permissions_map = [
  {
    resource: "bill_action",
    action: "comment",
    description: "Add comments to a bill action",
  },
  {
    resource: "bill_action_checklist",
    action: "toggle",
    description: "Toggle checklist items on a bill action",
  },
  {
    resource: "bill_action_custom_field",
    action: "update_value",
    description: "Update custom field values on a bill action",
  },
  {
    resource: "bill_action_form",
    action: "fill",
    description: "Fill and submit a bill action form",
  },
  {
    resource: "bill_action",
    action: "create",
    description: "Create a new action within a bill step",
  },
  {
    resource: "bill_action",
    action: "update",
    description: "Update an existing bill action",
  },

  // ─────────────────────────────
  // BILL
  // ─────────────────────────────
  {
    resource: "bill",
    action: "read",
    description: "View bills",
  },
  {
    resource: "bill",
    action: "create",
    description: "Create new bills",
  },

  // ─────────────────────────────
  // BILL STEP
  // ─────────────────────────────
  {
    resource: "bill_step",
    action: "arrange",
    description: "Reorder steps within a bill",
  },
  {
    resource: "bill_step",
    action: "update",
    description: "Update bill step details",
  },

  // ─────────────────────────────
  // GLOBAL INFO
  // ─────────────────────────────
  {
    resource: "global_info",
    action: "update",
    description: "Update global system information and settings",
  },

  // ─────────────────────────────
  // GROUP
  // ─────────────────────────────
  {
    resource: "group",
    action: "read",
    description: "View all groups",
  },
  {
    resource: "group",
    action: "read_own",
    description: "View groups the user belongs to",
  },
  {
    resource: "group",
    action: "create",
    description: "Create new groups",
  },
  {
    resource: "group",
    action: "update",
    description: "Update group details",
  },
  {
    resource: "group",
    action: "assign_members",
    description: "Add or remove members from groups",
  },
  {
    resource: "group",
    action: "assign_permissions",
    description: "Assign permissions to groups",
  },
  {
    resource: "group",
    action: "delete",
    description: "Delete groups",
  },

  // ─────────────────────────────
  // USER
  // ─────────────────────────────
  {
    resource: "user",
    action: "read",
    description: "View users in the system",
  },
  {
    resource: "user",
    action: "create",
    description: "Create new users",
  },
  {
    resource: "user",
    action: "update_profile",
    description: "Update user profile information",
  },
  {
    resource: "user",
    action: "assign_permissions",
    description: "Assign permissions directly to users",
  },

  // ─────────────────────────────
  // PERMISSION (SYSTEM)
  // ─────────────────────────────
  {
    resource: "permission",
    action: "read",
    description: "View system permissions",
  },
  {
    resource: "permission",
    action: "create",
    description: "Create new system permissions",
  },
  {
    resource: "permission",
    action: "update",
    description: "Update existing system permissions",
  },
  {
    resource: "permission",
    action: "delete",
    description: "Delete system permissions",
  },

  // ─────────────────────────────
  // STEP (GENERIC)
  // ─────────────────────────────
  {
    resource: "step",
    action: "read",
    description: "View bill steps",
  },
  {
    resource: "step",
    action: "create",
    description: "Create new bill steps",
  },
  {
    resource: "step",
    action: "update",
    description: "Update bill step details",
  },
  {
    resource: "step",
    action: "assign_permissions",
    description: "Assign permissions to bill steps",
  },
  {
    resource: "step",
    action: "delete",
    description: "Delete bill steps",
  },

  // ─────────────────────────────
  // STEP STATE
  // ─────────────────────────────
  {
    resource: "step_complete",
    action: "toggle",
    description: "Mark a step as complete or incomplete",
  },
  {
    resource: "step_lock",
    action: "toggle",
    description: "Lock or unlock a bill step",
  },

  // ─────────────────────────────
  // ACTION (GENERIC)
  // ─────────────────────────────
  {
    resource: "action",
    action: "read",
    description: "View actions",
  },
  {
    resource: "action",
    action: "create",
    description: "Create new actions",
  },
  {
    resource: "action",
    action: "update",
    description: "Update existing actions",
  },
  {
    resource: "action",
    action: "assign_permissions",
    description: "Assign permissions to actions",
  },
  {
    resource: "action",
    action: "delete",
    description: "Delete actions",
  },

  // ─────────────────────────────
  // STEP ACTION
  // ─────────────────────────────
  {
    resource: "step_action",
    action: "clone",
    description: "Clone an action into same step",
  },

  // ─────────────────────────────
  // BILL ACTION FORM RESPONSE
  // ─────────────────────────────
  {
    resource: "bill_action_form_response",
    action: "update",
    description: "Update a submitted bill action form response",
  },
];

export const handle_signup = async (req, res) => {
  try {
    const { user_name, user_email, user_password } = req.body;

    const validate = user_validation_schema.validate({
      user_name,
      user_email,
      user_password,
    });

    if (validate.error) {
      return res.status(400).json({
        error: validate.error,
        status: "error",
        message: validate.error.details[0].message + " !",
      });
    }

    const existing_user = await user_model.findOne({
      user_email: user_email,
    });

    if (existing_user) {
      return res.status(400).json({
        error: "user with the user_email already exists",
        status: "error",
        message: "User already exists with the given email.",
      });
    }

    const hashed_password = await bcrypt.hash(user_password, 10);

    // let base_permissions = await permission_model.find({
    //   resource: "bill",
    //   action: "read",
    // });

    // if (!base_permissions || base_permissions.length === 0) {
    //   await permission_model.bulkWrite(
    //     permissions_map.map((p) => ({
    //       updateOne: {
    //         filter: {
    //           resource: p.resource,
    //           action: p.action,
    //           description: p.description,
    //         },
    //         update: { $setOnInsert: p },
    //         upsert: true,
    //       },
    //     }))
    //   );
    // }

    // base_permissions = await permission_model.find({
    //   resource: "bill",
    //   action: "read",
    // });

    const new_user = await user_model.create({
      user_name,
      user_email,
      user_password: hashed_password,
      // user_permissions: base_permissions.map((perm) => perm._id),
    });

    await new_user.save();

    const saved_user = await user_model.findOne({ user_email });

    const verification_token = nanoid(32);

    const user_verification = {
      user_id: saved_user._id,
      user_verification_token: verification_token,
    };

    await user_verification_model.create(user_verification);

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
        if (error) {
          console.log(error);
        } else {
          console.log(info);
        }
      },
    );

    new_user.user_password = undefined;

    return res.status(200).json({
      user: new_user,
      status: "success",
      message: "Please check your email for verification.",
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      status: "error",
      message: "Internal server error.",
    });
  }
};

export const handle_signin = async (req, res) => {
  try {
    const { user_email, user_password, remember } = req.body;

    const existing_user = await user_model
      .findOne({
        user_email: user_email,
        is_active: true,
        is_suspended: false,
        is_deleted: false,
      })
      .populate("user_permission_policies");

    if (!existing_user) {
      return res.status(400).json({
        status: "error",
        message: "Please provide valid credentials.",
      });
    }

    const is_password_valid = await bcrypt.compare(
      user_password,
      existing_user.user_password,
    );

    if (!is_password_valid) {
      return res.status(400).json({
        status: "error",
        message: "Please provide valid credentials.",
      });
    }

    if (!existing_user.user_email_verified) {
      return res.status(400).json({
        status: "error",
        message: "User not verified, please check email for verification.",
      });
    }

    const user_token = jwt.sign(
      { user_id: existing_user._id, remember: remember },
      process.env.JWT_SECRET,
    );

    res.cookie("user_token", user_token, {
      httpOnly: true,
      maxAge: remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    });

    existing_user.user_password = undefined;

    return res.status(200).json({
      user: existing_user,
      status: "success",
      message: "User logged in successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      status: "error",
      message: "Internal server error.",
    });
  }
};

export const handle_user_logout = (req, res) => {
  try {
    res.clearCookie("user_token");

    return res.status(200).json({
      status: "success",
      message: "Logged out successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      status: "error",
      message: "Internal server error.",
    });
  }
};

export const handle_verify_user_token = async (req, res) => {
  try {
    const { user_token } = req.cookies;

    const verify_token = jwt.verify(user_token, process.env.JWT_SECRET);

    const user_id = verify_token.user_id;

    const remember = verify_token.remember;

    const existing_user = await user_model
      .findById(user_id)
      .populate("user_permission_policies");

    if (existing_user) {
      existing_user.user_password = undefined;

      const user_token = jwt.sign(
        { user_id: existing_user._id, remember: remember },
        process.env.JWT_SECRET,
      );

      res.cookie("user_token", user_token, {
        httpOnly: true,
        maxAge: remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        user: existing_user,
        status: "success",
        message: "user validated successfully",
      });
    }

    res.clearCookie("user_token");

    return res.status(401).json({
      status: "error",
      message: "user not validated",
      user: existing_user,
    });
  } catch (error) {
    res.clearCookie("user_token");

    return res.status(401).json({
      error: error.message,
      status: "error",
      message: "user not validated",
    });
  }
};

export const handle_google_signin = async (req, res) => {
  try {
    const { code, redirect_base_url } = req.body;

    const token_request = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code: code,
        redirect_uri: redirect_base_url + "/auth/google/verify",
        grant_type: "authorization_code",
      }),
    });

    const token_response = await token_request.json();

    if (!token_request.ok) {
      return res.status(400).json({
        status: "error",
        message: "Invalid code",
      });
    }

    const user_request = await fetch(
      `https://www.googleapis.com/oauth2/v1/userinfo`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token_response.access_token}`,
        },
      },
    );

    const user_response = await user_request.json();

    if (!user_request.ok) {
      return res.status(400).json({
        status: "error",
        message: "Invalid code",
      });
    }

    const existing_user = await user_model.findOne({
      user_email: user_response.email,
    });

    if (existing_user) {
      existing_user.user_email_verified = true;

      await existing_user.save();

      const user_token = jwt.sign(
        { user_id: existing_user._id, remember: true },
        process.env.JWT_SECRET,
      );

      res.cookie("user_token", user_token, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      existing_user.user_password = undefined;

      return res.status(200).json({
        user: existing_user,
        status: "success",
        message: "User logged in successfully",
      });
    }

    const new_user = await user_model.create({
      user_name: user_response.name,
      user_email: user_response.email,
      user_password: nanoid(16),
      user_email_verified: true,
      user_image: user_response.picture,
    });

    await new_user.save();

    const user_token = jwt.sign(
      { user_id: new_user._id, remember: true },
      process.env.JWT_SECRET,
    );

    res.cookie("user_token", user_token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    new_user.user_password = undefined;

    return res.status(200).json({
      user: new_user,
      status: "success",
      message: "User logged in successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      status: "error",
      message: "Internal server error.",
    });
  }
};

export const handle_update_user = async (req, res) => {
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

    const { user_name, remove_user_image } = req.body;

    if (remove_user_image === "true" && existing_user.user_image) {
      if (existing_user.user_image_public_id) {
        await deleteMediaFromCloudinary(existing_user.user_image_public_id);
      }

      existing_user.user_image = "";
      existing_user.user_image_public_id = "";
    }

    if (req.file) {
      const user_image = req.file.path;

      if (existing_user.user_image && existing_user.user_image_public_id) {
        await deleteMediaFromCloudinary(existing_user.user_image_public_id);
      }

      const upload_results = await uploadMediaToCloudinary(user_image);

      existing_user.user_image = upload_results?.secure_url;
      existing_user.user_image_public_id = upload_results?.public_id;

      fs.unlink(user_image, (err) => {
        if (err) {
          return;
        }
      });
    }

    existing_user.user_name = user_name;

    await existing_user.save();

    return res.status(200).json({
      status: "success",
      data: existing_user,
      message: "User updated successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: error.message,
      status: "error",
      message: "Internal server error.",
    });
  }
};
