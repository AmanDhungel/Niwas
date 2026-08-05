import agreement_model from "../../models/agreement/agreement.model.js";

/* ================= HELPERS ================= */
const isEmptyValue = (value) => {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};

const sanitizePayload = (payload) => {
  if (Array.isArray(payload)) {
    return payload
      .map((item) =>
        typeof item === "object" && item !== null
          ? sanitizePayload(item)
          : item,
      )
      .filter((item) => !isEmptyValue(item));
  }

  const cleaned = {};
  for (const [key, value] of Object.entries(payload)) {
    if (isEmptyValue(value)) continue;

    if (Array.isArray(value)) {
      const cleanedArray = sanitizePayload(value);
      if (cleanedArray.length > 0) cleaned[key] = cleanedArray;
    } else if (typeof value === "object" && value !== null) {
      const cleanedNested = sanitizePayload(value);
      if (Object.keys(cleanedNested).length > 0) cleaned[key] = cleanedNested;
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

const handleError = (res, error, message) => {
  if (error.name === "ValidationError") {
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      error: error.message,
    });
  }
  return res.status(500).json({
    status: "error",
    message,
    error: error.message,
  });
};

/* ================= GET ALL AGREEMENTS ================= */
export const handle_get_agreements = async (req, res) => {
  try {
    const agreements = await agreement_model
      .find()
      .populate("basic_info.property")
      .populate("parties.entity");

    return res.status(200).json({
      status: "success",
      message: "Agreements fetched successfully",
      data: agreements,
    });
  } catch (error) {
    return handleError(
      res,
      error,
      "An error occurred while fetching agreements",
    );
  }
};

/* ================= GET AGREEMENT BY ID ================= */
export const handle_get_agreement = async (req, res) => {
  try {
    const { agreement_id } = req.params;

    const agreement = await agreement_model
      .findById(agreement_id)
      .populate("basic_info.property")
      .populate("parties.entity");

    if (!agreement) {
      return res.status(404).json({
        status: "error",
        message: "Agreement not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Agreement fetched successfully",
      data: agreement,
    });
  } catch (error) {
    return handleError(
      res,
      error,
      "An error occurred while fetching agreement",
    );
  }
};

/* ================= ADD AGREEMENT ================= */
export const handle_add_agreement = async (req, res) => {
  try {
    const {
      basic_info,
      parties,
      units_and_spaces,
      rent_and_deposit,
      utilities_and_services,
      sla_and_terms,
      clauses_and_compliance,
    } = req.body;

    const rawPayload = {
      basic_info: JSON.parse(basic_info || "{}"),
      parties: JSON.parse(parties || "[]"),
      units_and_spaces: JSON.parse(units_and_spaces || "[]"),
      rent_and_deposit: JSON.parse(rent_and_deposit || "{}"),
      utilities_and_services: JSON.parse(utilities_and_services || "[]"),
      sla_and_terms: JSON.parse(sla_and_terms || "{}"),
      clauses_and_compliance: JSON.parse(clauses_and_compliance || "{}"),
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    const agreement = await agreement_model.create(cleanedPayload);

    return res.status(201).json({
      status: "success",
      message: "Agreement created successfully",
      data: agreement,
    });
  } catch (error) {
    return handleError(
      res,
      error,
      "An error occurred while creating agreement",
    );
  }
};

/* ================= EDIT AGREEMENT ================= */
export const handle_edit_agreement = async (req, res) => {
  try {
    const { agreement_id } = req.params;

    const {
      basic_info,
      parties,
      units_and_spaces,
      rent_and_deposit,
      utilities_and_services,
      sla_and_terms,
      clauses_and_compliance,
    } = req.body;

    const rawPayload = {
      basic_info: JSON.parse(basic_info || "{}"),
      parties: JSON.parse(parties || "[]"),
      units_and_spaces: JSON.parse(units_and_spaces || "[]"),
      rent_and_deposit: JSON.parse(rent_and_deposit || "{}"),
      utilities_and_services: JSON.parse(utilities_and_services || "[]"),
      sla_and_terms: JSON.parse(sla_and_terms || "{}"),
      clauses_and_compliance: JSON.parse(clauses_and_compliance || "{}"),
    };

    const cleanedPayload = sanitizePayload(rawPayload);

    const updated_agreement = await agreement_model.findByIdAndUpdate(
      agreement_id,
      { $set: cleanedPayload },
      { new: true, runValidators: true },
    );

    if (!updated_agreement) {
      return res.status(404).json({
        status: "error",
        message: "Agreement not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Agreement updated successfully",
      data: updated_agreement,
    });
  } catch (error) {
    return handleError(
      res,
      error,
      "An error occurred while updating agreement",
    );
  }
};

/* ================= DELETE AGREEMENT ================= */
export const handle_delete_agreement = async (req, res) => {
  try {
    const { agreement_id } = req.params;

    const deleted_agreement =
      await agreement_model.findByIdAndDelete(agreement_id);

    if (!deleted_agreement) {
      return res.status(404).json({
        status: "error",
        message: "Agreement not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Agreement deleted successfully",
    });
  } catch (error) {
    return handleError(
      res,
      error,
      "An error occurred while deleting agreement",
    );
  }
};
