import jwt from "jsonwebtoken";
import user_model from "../../../models/user.model.js";
import blog_comment_model from "../../../models/content/blog/blog_comment.model.js";

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


/* ================= GET ALL COMMENTS ================= */
export const handle_get_blog_comments = async (req, res) => {
  try {
    const { blog, status } = req.query;

    const filter = {};
    if (blog)   filter.blog   = blog;
    if (status) filter.status = status;

    const comments = await blog_comment_model
      .find(filter)
      .populate("blog", "title")
      .populate("created_by", "user_name user_email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
      message: "Blog comments fetched successfully.",
      data: comments,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching blog comments.",
      error: error.message,
    });
  }
};


/* ================= GET SINGLE COMMENT ================= */
export const handle_get_blog_comment = async (req, res) => {
  try {
    const { comment_id } = req.params;

    const comment = await blog_comment_model
      .findById(comment_id)
      .populate("blog", "title")
      .populate("created_by", "user_name user_email");

    if (!comment) {
      return res.status(404).json({
        status: "error",
        message: "Blog comment not found.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Blog comment fetched successfully.",
      data: comment,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching blog comment.",
      error: error.message,
    });
  }
};


/* ================= PUBLISH / UNPUBLISH COMMENT ================= */
export const handle_toggle_blog_comment_status = async (req, res) => {
  try {
    const { user } = await get_admin_user(req);
    if (!user) {
      return res.status(401).json({ status: "error", message: "Unauthorized." });
    }

    const { comment_id } = req.params;
    const { status }     = req.body;

    const VALID_STATUSES = ["published", "not_published"];
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        status: "error",
        message: `Status is required. Allowed: ${VALID_STATUSES.join(", ")}.`,
      });
    }

    const comment = await blog_comment_model.findById(comment_id);
    if (!comment) {
      return res.status(404).json({
        status: "error",
        message: "Blog comment not found.",
      });
    }

    comment.status = status;
    await comment.save();

    return res.status(200).json({
      status: "success",
      message: `Comment ${status === "published" ? "published" : "unpublished"} successfully.`,
      data: comment,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating comment status.",
      error: error.message,
    });
  }
};


/* ================= DELETE COMMENT ================= */
export const handle_delete_blog_comment = async (req, res) => {
  try {
    const { user } = await get_admin_user(req);
    if (!user) {
      return res.status(401).json({ status: "error", message: "Unauthorized." });
    }

    const { comment_id } = req.params;

    const comment = await blog_comment_model.findByIdAndDelete(comment_id);
    if (!comment) {
      return res.status(404).json({
        status: "error",
        message: "Blog comment not found.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Blog comment deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting blog comment.",
      error: error.message,
    });
  }
};