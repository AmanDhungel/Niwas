import jwt from "jsonwebtoken";
import {
  upload_file_to_s3,
  delete_file_from_s3,
  build_s3_key,
  clear_temp_files,
} from "../../../utils/s3.util.js";
import user_model from "../../../models/user.model.js";
import blog_model from "../../../models/content/blog/blog.model.js";

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

const get_any_user = async (req) => {
  const { user_token } = req.cookies;
  if (!user_token) return { user: null, user_id: null };
  try {
    const { user_id } = jwt.verify(user_token, process.env.JWT_SECRET);
    const user = await user_model.findById(user_id);
    return { user, user_id };
  } catch {
    return { user: null, user_id: null };
  }
};

/* ================= GET ALL BLOGS ================= */
export const handle_get_blogs = async (req, res) => {
  try {
    const { category, tag, author, search } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (author) filter.author = author;
    if (tag) filter.tags = tag;
    if (search) filter.title = { $regex: search.trim(), $options: "i" };

    const blogs = await blog_model
      .find(filter)
      .populate("author", "user_name user_email")
      .populate("category", "name")
      .populate("tags", "name")
      .select("-content") // exclude heavy content field from list view
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
      message: "Blogs fetched successfully.",
      data: blogs,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching blogs.",
      error: error.message,
    });
  }
};

/* ================= GET SINGLE BLOG ================= */
export const handle_get_blog = async (req, res) => {
  try {
    const { blog_id } = req.params;

    const blog = await blog_model
      .findById(blog_id)
      .populate("author", "user_name user_email")
      .populate("category", "name")
      .populate("tags", "name")
      .populate("liked_by", "user_name");

    if (!blog) {
      return res.status(404).json({
        status: "error",
        message: "Blog not found.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Blog fetched successfully.",
      data: blog,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching blog.",
      error: error.message,
    });
  }
};

/* ================= ADD BLOG ================= */
export const handle_add_blog = async (req, res) => {
  try {
    const { user, user_id } = await get_admin_user(req);
    if (!user) {
      clear_temp_files(req.file ? [req.file] : []);
      return res
        .status(401)
        .json({ status: "error", message: "Unauthorized." });
    }

    const { title, content, category, tags } = req.body;

    if (!title || !title.trim()) {
      clear_temp_files(req.file ? [req.file] : []);
      return res
        .status(400)
        .json({ status: "error", message: "Title is required." });
    }

    if (!content || !content.trim()) {
      clear_temp_files(req.file ? [req.file] : []);
      return res
        .status(400)
        .json({ status: "error", message: "Content is required." });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ status: "error", message: "Banner image is required." });
    }

    // Parse tags — accept JSON string array or plain comma-separated
    let parsed_tags = [];
    if (tags) {
      try {
        parsed_tags = typeof tags === "string" ? JSON.parse(tags) : tags;
        if (!Array.isArray(parsed_tags)) parsed_tags = [];
      } catch {
        parsed_tags = [];
      }
    }

    // Upload banner image
    const temp_key = build_s3_key("content", "blog", "temp", req.file.filename);
    const uploaded = await upload_file_to_s3(req.file, temp_key);

    const blog = await blog_model.create({
      title: title.trim(),
      content: content.trim(),
      banner_image: { key: uploaded.key, url: uploaded.url },
      author: user_id,
      ...(category && { category }),
      ...(parsed_tags.length && { tags: parsed_tags }),
    });

    // Move S3 key to final path using real blog _id
    const final_key = build_s3_key(
      "content",
      "blog",
      blog._id.toString(),
      req.file.filename,
    );
    await delete_file_from_s3(uploaded.key);
    const final_upload = await upload_file_to_s3(req.file, final_key);
    blog.banner_image = { key: final_upload.key, url: final_upload.url };
    await blog.save();

    return res.status(201).json({
      status: "success",
      message: "Blog added successfully.",
      data: blog,
    });
  } catch (error) {
    clear_temp_files(req.file ? [req.file] : []);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding blog.",
      error: error.message,
    });
  }
};

/* ================= EDIT BLOG ================= */
export const handle_edit_blog = async (req, res) => {
  try {
    const { user } = await get_admin_user(req);
    if (!user) {
      clear_temp_files(req.file ? [req.file] : []);
      return res
        .status(401)
        .json({ status: "error", message: "Unauthorized." });
    }

    const { blog_id } = req.params;
    const { title, content, category, tags } = req.body;

    const blog = await blog_model.findById(blog_id);
    if (!blog) {
      clear_temp_files(req.file ? [req.file] : []);
      return res
        .status(404)
        .json({ status: "error", message: "Blog not found." });
    }

    if (title && title.trim()) blog.title = title.trim();
    if (content && content.trim()) blog.content = content.trim();
    if (category !== undefined) blog.category = category || null;

    if (tags !== undefined) {
      try {
        const parsed = typeof tags === "string" ? JSON.parse(tags) : tags;
        blog.tags = Array.isArray(parsed) ? parsed : [];
      } catch {
        blog.tags = [];
      }
    }

    // Replace banner image if new one uploaded
    if (req.file) {
      if (blog.banner_image?.key) {
        await delete_file_from_s3(blog.banner_image.key);
      }
      const key = build_s3_key(
        "content",
        "blog",
        blog._id.toString(),
        req.file.filename,
      );
      const uploaded = await upload_file_to_s3(req.file, key);
      blog.banner_image = { key: uploaded.key, url: uploaded.url };
    }

    await blog.save();

    return res.status(200).json({
      status: "success",
      message: "Blog updated successfully.",
      data: blog,
    });
  } catch (error) {
    clear_temp_files(req.file ? [req.file] : []);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating blog.",
      error: error.message,
    });
  }
};

/* ================= DELETE BLOG ================= */
export const handle_delete_blog = async (req, res) => {
  try {
    const { user } = await get_admin_user(req);
    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "Unauthorized." });
    }

    const { blog_id } = req.params;

    const blog = await blog_model.findById(blog_id);
    if (!blog) {
      return res
        .status(404)
        .json({ status: "error", message: "Blog not found." });
    }

    if (blog.banner_image?.key) {
      await delete_file_from_s3(blog.banner_image.key);
    }

    await blog_model.findByIdAndDelete(blog_id);

    return res.status(200).json({
      status: "success",
      message: "Blog deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting blog.",
      error: error.message,
    });
  }
};

/* ================= TOGGLE LIKE ================= */
export const handle_toggle_blog_like = async (req, res) => {
  try {
    const { user, user_id } = await get_any_user(req);
    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "Unauthorized." });
    }

    const { blog_id } = req.params;

    const blog = await blog_model.findById(blog_id);
    if (!blog) {
      return res
        .status(404)
        .json({ status: "error", message: "Blog not found." });
    }

    const already_liked = blog.liked_by.some(
      (id) => id.toString() === user_id.toString(),
    );

    if (already_liked) {
      blog.liked_by = blog.liked_by.filter(
        (id) => id.toString() !== user_id.toString(),
      );
    } else {
      blog.liked_by.push(user_id);
    }

    await blog.save();

    return res.status(200).json({
      status: "success",
      message: already_liked ? "Blog unliked." : "Blog liked.",
      data: {
        liked: !already_liked,
        like_count: blog.liked_by.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while toggling like.",
      error: error.message,
    });
  }
};

/* ================= ADD COMMENT ================= */
export const handle_add_blog_comment = async (req, res) => {
  try {
    const { user, user_id } = await get_any_user(req);
    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "Unauthorized." });
    }

    const { blog_id } = req.params;
    const { comment, review } = req.body;

    if (!comment || !comment.trim()) {
      return res
        .status(400)
        .json({ status: "error", message: "Comment is required." });
    }

    const parsed_review = Number(review);
    if (
      !review ||
      isNaN(parsed_review) ||
      parsed_review < 1 ||
      parsed_review > 5
    ) {
      return res.status(400).json({
        status: "error",
        message: "Review is required and must be between 1 and 5.",
      });
    }

    const blog = await blog_model.findById(blog_id);
    if (!blog) {
      return res
        .status(404)
        .json({ status: "error", message: "Blog not found." });
    }

    // Import inline to avoid circular deps — or move to top if no circular risk
    const blog_comment_model = (
      await import("../../models/content/blog_comment.model.js")
    ).default;

    const new_comment = await blog_comment_model.create({
      comment: comment.trim(),
      review: parsed_review,
      blog: blog_id,
      created_by: user_id,
    });

    return res.status(201).json({
      status: "success",
      message: "Comment added successfully.",
      data: new_comment,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding comment.",
      error: error.message,
    });
  }
};
