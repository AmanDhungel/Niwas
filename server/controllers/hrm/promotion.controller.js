import promotion_model from "../../models/hrm/promotion.model.js";

const isEmptyValue = (value) => {
  if (value === undefined || value === null) return true;

  if (typeof value === "string") {
    return value.trim() === "";
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === "object") {
    return Object.keys(value).length === 0;
  }

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

export const handle_get_promotions = async (req, res) => {
  try {
    const promotions = await promotion_model
      .find()
      .populate("promotion_for")
      .populate("promotion_from")
      .populate("promotion_to");

    return res.status(200).json({
      status: "success",
      message: "Promotions fetched successfully",
      data: promotions,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching promotions",
      error: error.message,
    });
  }
};

export const handle_get_promotion = async (req, res) => {
  try {
    const { promotion_id } = req.params;

    const promotion = await promotion_model
      .findById(promotion_id)
      .populate("promotion_for")
      .populate("promotion_from")
      .populate("promotion_to");
    if (!promotion) {
      return res.status(404).json({
        status: "error",
        message: "Promotion not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Promotion fetched successfully",
      data: promotion,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching promotion",
      error: error.message,
    });
  }
};

export const handle_add_promotion = async (req, res) => {
  try {
    const { promotion_for, promotion_from, promotion_to, promotion_date } =
      req.body;

    const rawPayload = {
      promotion_for,
      promotion_from,
      promotion_to,
      promotion_date,
    };

    const payload = sanitizePayload(rawPayload);

    const new_promotion = await promotion_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Promotion added successfully",
      data: new_promotion,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding promotion",
      error: error.message,
    });
  }
};

export const handle_edit_promotion = async (req, res) => {
  try {
    const { promotion_id } = req.params;
    const { promotion_for, promotion_from, promotion_to, promotion_date } =
      req.body;

    const rawPayload = {
      promotion_for,
      promotion_from,
      promotion_to,
      promotion_date,
    };

    const payload = sanitizePayload(rawPayload);

    const updated_promotion = await promotion_model.findByIdAndUpdate(
      promotion_id,
      payload,
      { new: true },
    );

    if (!updated_promotion) {
      return res.status(404).json({
        status: "error",
        message: "Promotion not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Promotion edited successfully",
      data: updated_promotion,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while editing promotion",
      error: error.message,
    });
  }
};

export const handle_delete_promotion = async (req, res) => {
  try {
    const { promotion_id } = req.params;

    const deleted_promotion =
      await promotion_model.findByIdAndDelete(promotion_id);

    if (!deleted_promotion) {
      return res.status(404).json({
        status: "error",
        message: "Promotion not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Promotion deleted successfully",
      data: deleted_promotion,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting promotion",
      error: error.message,
    });
  }
};

// export const handle_get_designations = async (req, res) => {
//   try {
//     const designations = await designation_model.find().populate("department");

//     return res.status(200).json({
//       status: "success",
//       message: "Designations fetched successfully",
//       data: designations,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       status: "error",
//       message: "An error occurred while fetching designations",
//       error: error.message,
//     });
//   }
// };

// export const handle_get_designation = async (req, res) => {
//   try {
//     const { designation_id } = req.params;

//     const designation = await designation_model
//       .findById(designation_id)
//       .populate("department");
//     if (!designation) {
//       return res.status(404).json({
//         status: "error",
//         message: "Designation not found",
//       });
//     }
//     return res.status(200).json({
//       status: "success",
//       message: "Designation fetched successfully",
//       data: designation,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       status: "error",
//       message: "An error occurred while fetching designation",
//       error: error.message,
//     });
//   }
// };

// export const handle_add_designation = async (req, res) => {
//   try {
//     const { name, department, status } = req.body;

//     const rawPayload = {
//       name,
//       department,
//       no_of_employees,
//       status,
//     };

//     const payload = sanitizePayload(rawPayload);

//     const new_designation = await designation_model.create(payload);

//     return res.status(201).json({
//       status: "success",
//       message: "Designation added successfully",
//       data: new_designation,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       status: "error",
//       message: "An error occurred while adding designation",
//       error: error.message,
//     });
//   }
// };

// export const handle_delete_designation = async (req, res) => {
//   try {
//     const { designation_id } = req.params;

//     const deleted_designation =
//       await designation_model.findByIdAndDelete(designation_id);

//     if (!deleted_designation) {
//       return res.status(404).json({
//         status: "error",
//         message: "Designation not found",
//       });
//     }

//     return res.status(200).json({
//       status: "success",
//       message: "Designation deleted successfully",
//       data: deleted_designation,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       status: "error",
//       message: "An error occurred while deleting designation",
//       error: error.message,
//     });
//   }
// };
