import jwt from "jsonwebtoken";
import testimonial_model from "../../models/content/testimonial.model.js";
import user_model from "../../models/user.model.js";
import {
  upload_file_to_s3,
  delete_file_from_s3,
  build_s3_key,
  clear_temp_files,
} from "../../utils/s3.util.js";


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


/* ================= GET ALL TESTIMONIALS ================= */
export const handle_get_testimonials = async (req, res) => {
  try {
    const testimonials = await testimonial_model.find().sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
      message: "Testimonials fetched successfully.",
      data: testimonials,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching testimonials.",
      error: error.message,
    });
  }
};


/* ================= GET SINGLE TESTIMONIAL ================= */
export const handle_get_testimonial = async (req, res) => {
  try {
    const { testimonial_id } = req.params;

    const testimonial = await testimonial_model.findById(testimonial_id);
    if (!testimonial) {
      return res.status(404).json({
        status: "error",
        message: "Testimonial not found.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Testimonial fetched successfully.",
      data: testimonial,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching testimonial.",
      error: error.message,
    });
  }
};


/* ================= ADD TESTIMONIAL ================= */
export const handle_add_testimonial = async (req, res) => {
  try {
    const { user } = await get_admin_user(req);
    if (!user) {
      clear_temp_files(req.files);
      return res.status(401).json({ status: "error", message: "Unauthorized." });
    }

    const { author_name, role, content } = req.body;

    if (!author_name || !author_name.trim()) {
      clear_temp_files(req.files);
      return res.status(400).json({
        status: "error",
        message: "Author name is required.",
      });
    }

    if (!content || !content.trim()) {
      clear_temp_files(req.files);
      return res.status(400).json({
        status: "error",
        message: "Testimonial content is required.",
      });
    }

    const testimonial = await testimonial_model.create({
      author: {
        name: author_name.trim(),
      },
      role:    role?.trim() || "",
      content: content.trim(),
    });

    // Upload author image if provided
    const image_file = req.file;
    if (image_file) {
      const key = build_s3_key(
        "content",
        "testimonial",
        testimonial._id.toString(),
        image_file.filename,
      );
      const uploaded = await upload_file_to_s3(image_file, key);
      testimonial.author.image = { key: uploaded.key, url: uploaded.url };
      await testimonial.save();
    }

    return res.status(201).json({
      status: "success",
      message: "Testimonial added successfully.",
      data: testimonial,
    });
  } catch (error) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding testimonial.",
      error: error.message,
    });
  }
};


/* ================= EDIT TESTIMONIAL ================= */
export const handle_edit_testimonial = async (req, res) => {
  try {
    const { user } = await get_admin_user(req);
    if (!user) {
      clear_temp_files(req.files);
      return res.status(401).json({ status: "error", message: "Unauthorized." });
    }

    const { testimonial_id } = req.params;
    const { author_name, role, content } = req.body;

    const testimonial = await testimonial_model.findById(testimonial_id);
    if (!testimonial) {
      clear_temp_files(req.files);
      return res.status(404).json({
        status: "error",
        message: "Testimonial not found.",
      });
    }

    if (author_name && author_name.trim()) {
      testimonial.author.name = author_name.trim();
    }
    if (role !== undefined)    testimonial.role    = role.trim();
    if (content && content.trim()) testimonial.content = content.trim();

    // Replace author image if a new one is uploaded
    const image_file = req.file;
    if (image_file) {
      // Delete old image from S3 if it exists
      if (testimonial.author.image?.key) {
        await delete_file_from_s3(testimonial.author.image.key);
      }

      const key = build_s3_key(
        "content",
        "testimonial",
        testimonial._id.toString(),
        image_file.filename,
      );
      const uploaded = await upload_file_to_s3(image_file, key);
      testimonial.author.image = { key: uploaded.key, url: uploaded.url };
    }

    await testimonial.save();

    return res.status(200).json({
      status: "success",
      message: "Testimonial updated successfully.",
      data: testimonial,
    });
  } catch (error) {
    clear_temp_files(req.files);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating testimonial.",
      error: error.message,
    });
  }
};


/* ================= DELETE TESTIMONIAL ================= */
export const handle_delete_testimonial = async (req, res) => {
  try {
    const { user } = await get_admin_user(req);
    if (!user) {
      return res.status(401).json({ status: "error", message: "Unauthorized." });
    }

    const { testimonial_id } = req.params;

    const testimonial = await testimonial_model.findById(testimonial_id);
    if (!testimonial) {
      return res.status(404).json({
        status: "error",
        message: "Testimonial not found.",
      });
    }

    // Delete author image from S3 if it exists
    if (testimonial.author.image?.key) {
      await delete_file_from_s3(testimonial.author.image.key);
    }

    await testimonial_model.findByIdAndDelete(testimonial_id);

    return res.status(200).json({
      status: "success",
      message: "Testimonial deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting testimonial.",
      error: error.message,
    });
  }
};