import jwt from "jsonwebtoken";
import blog_category_model from "../../../models/content/blog/blog_category.model.js";
import user_model from "../../../models/user.model.js";


/* ================= HELPER ================= */
const get_admin_user = async (req) => {
  const { user_token } = req.cookies;
  if (!user_token) return { user: null, user_id: null };
  try {
    const { user_id } = jwt.verify(user_token, process.env.JWT_SECRET);
    const user = await user_model.findOne({ _id: user_id, user_type: "superuser" });
    return { user, user_id };
  } catch {
    return { user: null, user_id: null };
  }
};


/* ================= GET ALL BLOG CATEGORIES ================= */
export const handle_get_blog_categories = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = status ? { status } : {};
    const categories = await blog_category_model.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
      message: "Blog categories fetched successfully.",
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching blog categories.",
      error: error.message,
    });
  }
};


/* ================= GET SINGLE BLOG CATEGORY ================= */
export const handle_get_blog_category = async (req, res) => {
  try {
    const { category_id } = req.params;

    const category = await blog_category_model.findById(category_id);
    if (!category) {
      return res.status(404).json({
        status: "error",
        message: "Blog category not found.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Blog category fetched successfully.",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching blog category.",
      error: error.message,
    });
  }
};


/* ================= ADD BLOG CATEGORY ================= */
export const handle_add_blog_category = async (req, res) => {
  try {
    const { user } = await get_admin_user(req);
    if (!user) {
      return res.status(401).json({ status: "error", message: "Unauthorized." });
    }

    const { name, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Category name is required.",
      });
    }

    const VALID_STATUSES = ["active", "inactive"];
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}.`,
      });
    }

    const existing = await blog_category_model.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });
    if (existing) {
      return res.status(409).json({
        status: "error",
        message: "A blog category with this name already exists.",
      });
    }

    const category = await blog_category_model.create({
      name: name.trim(),
      ...(status && { status }),
    });

    return res.status(201).json({
      status: "success",
      message: "Blog category added successfully.",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding blog category.",
      error: error.message,
    });
  }
};


/* ================= EDIT BLOG CATEGORY ================= */
export const handle_edit_blog_category = async (req, res) => {
  try {
    const { user } = await get_admin_user(req);
    if (!user) {
      return res.status(401).json({ status: "error", message: "Unauthorized." });
    }

    const { category_id }  = req.params;
    const { name, status } = req.body;

    const category = await blog_category_model.findById(category_id);
    if (!category) {
      return res.status(404).json({
        status: "error",
        message: "Blog category not found.",
      });
    }

    if (name && name.trim()) {
      const duplicate = await blog_category_model.findOne({
        _id:  { $ne: category_id },
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      });
      if (duplicate) {
        return res.status(409).json({
          status: "error",
          message: "A blog category with this name already exists.",
        });
      }
      category.name = name.trim();
    }

    const VALID_STATUSES = ["active", "inactive"];
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          status: "error",
          message: `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}.`,
        });
      }
      category.status = status;
    }

    await category.save();

    return res.status(200).json({
      status: "success",
      message: "Blog category updated successfully.",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating blog category.",
      error: error.message,
    });
  }
};


/* ================= DELETE BLOG CATEGORY ================= */
export const handle_delete_blog_category = async (req, res) => {
  try {
    const { user } = await get_admin_user(req);
    if (!user) {
      return res.status(401).json({ status: "error", message: "Unauthorized." });
    }

    const { category_id } = req.params;

    const category = await blog_category_model.findByIdAndDelete(category_id);
    if (!category) {
      return res.status(404).json({
        status: "error",
        message: "Blog category not found.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Blog category deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting blog category.",
      error: error.message,
    });
  }
};