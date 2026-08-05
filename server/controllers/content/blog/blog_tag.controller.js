import jwt from "jsonwebtoken";
import user_model from "../../../models/user.model.js";
import blog_tag_model from "../../../models/content/blog/blog_tag.model.js";


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


/* ================= GET ALL BLOG TAGS ================= */
export const handle_get_blog_tags = async (req, res) => {
  try {
    const tags = await blog_tag_model.find().sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
      message: "Blog tags fetched successfully.",
      data: tags,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching blog tags.",
      error: error.message,
    });
  }
};


/* ================= GET SINGLE BLOG TAG ================= */
export const handle_get_blog_tag = async (req, res) => {
  try {
    const { tag_id } = req.params;

    const tag = await blog_tag_model.findById(tag_id);
    if (!tag) {
      return res.status(404).json({
        status: "error",
        message: "Blog tag not found.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Blog tag fetched successfully.",
      data: tag,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching blog tag.",
      error: error.message,
    });
  }
};


/* ================= ADD BLOG TAG ================= */
export const handle_add_blog_tag = async (req, res) => {
  try {
    const { user } = await get_admin_user(req);
    if (!user) {
      return res.status(401).json({ status: "error", message: "Unauthorized." });
    }

    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Tag name is required.",
      });
    }

    const existing = await blog_tag_model.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });
    if (existing) {
      return res.status(409).json({
        status: "error",
        message: "A blog tag with this name already exists.",
      });
    }

    const tag = await blog_tag_model.create({ name: name.trim() });

    return res.status(201).json({
      status: "success",
      message: "Blog tag added successfully.",
      data: tag,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding blog tag.",
      error: error.message,
    });
  }
};


/* ================= EDIT BLOG TAG ================= */
export const handle_edit_blog_tag = async (req, res) => {
  try {
    const { user } = await get_admin_user(req);
    if (!user) {
      return res.status(401).json({ status: "error", message: "Unauthorized." });
    }

    const { tag_id } = req.params;
    const { name }   = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Tag name is required.",
      });
    }

    const tag = await blog_tag_model.findById(tag_id);
    if (!tag) {
      return res.status(404).json({
        status: "error",
        message: "Blog tag not found.",
      });
    }

    const duplicate = await blog_tag_model.findOne({
      _id:  { $ne: tag_id },
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });
    if (duplicate) {
      return res.status(409).json({
        status: "error",
        message: "A blog tag with this name already exists.",
      });
    }

    tag.name = name.trim();
    await tag.save();

    return res.status(200).json({
      status: "success",
      message: "Blog tag updated successfully.",
      data: tag,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating blog tag.",
      error: error.message,
    });
  }
};


/* ================= DELETE BLOG TAG ================= */
export const handle_delete_blog_tag = async (req, res) => {
  try {
    const { user } = await get_admin_user(req);
    if (!user) {
      return res.status(401).json({ status: "error", message: "Unauthorized." });
    }

    const { tag_id } = req.params;

    const tag = await blog_tag_model.findByIdAndDelete(tag_id);
    if (!tag) {
      return res.status(404).json({
        status: "error",
        message: "Blog tag not found.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Blog tag deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting blog tag.",
      error: error.message,
    });
  }
};