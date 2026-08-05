import ab_test_model from "../../models/marketplace/ab_test.model.js";

const isEmptyValue = (value) => {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};

const sanitizePayload = (payload) => {
  const cleaned = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!isEmptyValue(value)) {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

/* ================= GET ALL A/B TESTS ================= */
export const handle_get_ab_tests = async (req, res) => {
  try {
    const tests = await ab_test_model.find();

    return res.status(200).json({
      status: "success",
      message: "A/B tests fetched successfully",
      data: tests,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching A/B tests",
      error: error.message,
    });
  }
};

/* ================= GET A/B TEST BY ID ================= */
export const handle_get_ab_test = async (req, res) => {
  try {
    const { test_id } = req.params;

    const test = await ab_test_model.findById(test_id);

    if (!test) {
      return res.status(404).json({
        status: "error",
        message: "A/B test not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "A/B test fetched successfully",
      data: test,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching A/B test",
      error: error.message,
    });
  }
};

/* ================= ADD A/B TEST ================= */
export const handle_add_ab_test = async (req, res) => {
  try {
    const {
      test_name,
      test_type,
      variant_a,
      variant_b,
      traffic_allocation_percentage,
    } = req.body;

    const rawPayload = {
      test_name,
      test_type,
      variant_a: JSON.parse(variant_a || "{}"),
      variant_b: JSON.parse(variant_b || "{}"),
      traffic_allocation_percentage: Number(traffic_allocation_percentage),
      test_status: "draft",
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    const test = await ab_test_model.create(cleanedPayload);

    return res.status(201).json({
      status: "success",
      message: "A/B test initialized successfully",
      data: test,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while initializing A/B test",
      error: error.message,
    });
  }
};

/* ================= EDIT A/B TEST ================= */
export const handle_edit_ab_test = async (req, res) => {
  try {
    const { test_id } = req.params;

    const {
      test_name,
      test_type,
      variant_a,
      variant_b,
      traffic_allocation_percentage,
      test_status,
      results,
    } = req.body;

    const existing = await ab_test_model.findById(test_id);
    if (!existing) {
      return res.status(404).json({
        status: "error",
        message: "A/B test not found",
      });
    }

    /* -------- Guard: prevent editing a completed/cancelled test -------- */
    if (["completed", "cancelled"].includes(existing.test_status)) {
      return res.status(400).json({
        status: "error",
        message: `Cannot edit a test that is already ${existing.test_status}`,
      });
    }

    const rawPayload = {
      test_name,
      test_type,
      variant_a: variant_a ? JSON.parse(variant_a) : undefined,
      variant_b: variant_b ? JSON.parse(variant_b) : undefined,
      traffic_allocation_percentage: traffic_allocation_percentage
        ? Number(traffic_allocation_percentage)
        : undefined,
      test_status,
      results: results ? JSON.parse(results) : undefined,
    };

    /* -------- Auto-set timestamps based on status transition -------- */
    if (test_status === "running" && !existing.started_at) {
      rawPayload.started_at = new Date();
    }

    if (
      ["completed", "cancelled"].includes(test_status) &&
      !existing.ended_at
    ) {
      rawPayload.ended_at = new Date();
    }

    const cleanedPayload = sanitizePayload(rawPayload);

    const updated_test = await ab_test_model.findByIdAndUpdate(
      test_id,
      { $set: cleanedPayload },
      { new: true },
    );

    return res.status(200).json({
      status: "success",
      message: "A/B test updated successfully",
      data: updated_test,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating A/B test",
      error: error.message,
    });
  }
};

/* ================= DELETE A/B TEST ================= */
export const handle_delete_ab_test = async (req, res) => {
  try {
    const { test_id } = req.params;

    const deleted_test = await ab_test_model.findByIdAndDelete(test_id);

    if (!deleted_test) {
      return res.status(404).json({
        status: "error",
        message: "A/B test not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "A/B test deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting A/B test",
      error: error.message,
    });
  }
};
