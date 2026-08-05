import jwt from "jsonwebtoken";
import faq_model from "../../models/content/faq.model.js";
import user_model from "../../models/user.model.js";

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

/* ================= GET ALL FAQS ================= */
export const handle_get_faqs = async (req, res) => {
  try {
    const { category } = req.query;

    const filter = category ? { category: category.trim() } : {};
    const faqs = await faq_model.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      status: "success",
      message: "FAQs fetched successfully.",
      data: faqs,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching FAQs.",
      error: error.message,
    });
  }
};

/* ================= GET SINGLE FAQ ================= */
export const handle_get_faq = async (req, res) => {
  try {
    const { faq_id } = req.params;

    const faq = await faq_model.findById(faq_id);
    if (!faq) {
      return res.status(404).json({
        status: "error",
        message: "FAQ not found.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "FAQ fetched successfully.",
      data: faq,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching FAQ.",
      error: error.message,
    });
  }
};

/* ================= ADD FAQ ================= */
export const handle_add_faq = async (req, res) => {
  try {
    const { user } = await get_admin_user(req);
    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "Unauthorized." });
    }

    const { question, answer, category } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Question is required.",
      });
    }

    if (!answer || !answer.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Answer is required.",
      });
    }

    const faq = await faq_model.create({
      question: question.trim(),
      answer: answer.trim(),
      ...(category && { category: category.trim() }),
    });

    return res.status(201).json({
      status: "success",
      message: "FAQ added successfully.",
      data: faq,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding FAQ.",
      error: error.message,
    });
  }
};

/* ================= EDIT FAQ ================= */
export const handle_edit_faq = async (req, res) => {
  try {
    const { user } = await get_admin_user(req);
    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "Unauthorized." });
    }

    const { faq_id } = req.params;
    const { question, answer, category } = req.body;

    const faq = await faq_model.findById(faq_id);
    if (!faq) {
      return res.status(404).json({
        status: "error",
        message: "FAQ not found.",
      });
    }

    if (question && question.trim()) faq.question = question.trim();
    if (answer && answer.trim()) faq.answer = answer.trim();
    if (category !== undefined) faq.category = category.trim();

    await faq.save();

    return res.status(200).json({
      status: "success",
      message: "FAQ updated successfully.",
      data: faq,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating FAQ.",
      error: error.message,
    });
  }
};

/* ================= DELETE FAQ ================= */
export const handle_delete_faq = async (req, res) => {
  try {
    const { user } = await get_admin_user(req);
    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "Unauthorized." });
    }

    const { faq_id } = req.params;

    const faq = await faq_model.findByIdAndDelete(faq_id);
    if (!faq) {
      return res.status(404).json({
        status: "error",
        message: "FAQ not found.",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "FAQ deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting FAQ.",
      error: error.message,
    });
  }
};
