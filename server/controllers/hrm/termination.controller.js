import termination_model from "../../models/hrm/termination.model.js";

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

export const handle_get_terminations = async (req, res) => {
  try {
    const terminations = await termination_model
      .find()
      .populate("terminated_employee");
    return res.status(200).json({
      status: "success",
      message: "Terminations fetched successfully",
      data: terminations,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching terminations",
      error: error.message,
    });
  }
};

export const handle_get_termination = async (req, res) => {
  try {
    const { termination_id } = req.params;

    const termination = await termination_model
      .findById(termination_id)
      .populate("terminated_employee");
    if (!termination) {
      return res.status(404).json({
        status: "error",
        message: "Termination not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Termination fetched successfully",
      data: termination,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching termination",
      error: error.message,
    });
  }
};

export const handle_add_termination = async (req, res) => {
  try {
    const {
      terminated_employee,
      termination_type,
      notice_date,
      reason,
      termination_date,
    } = req.body;

    const rawPayload = {
      terminated_employee,
      termination_type,
      notice_date,
      reason,
      termination_date,
    };

    const payload = sanitizePayload(rawPayload);

    const new_termination = await termination_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Termination added successfully",
      data: new_termination,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding termination",
      error: error.message,
    });
  }
};

export const handle_edit_termination = async (req, res) => {
  try {
    const { termination_id } = req.params;
    const {
      terminated_employee,
      termination_type,
      notice_date,
      reason,
      termination_date,
    } = req.body;

    const rawPayload = {
      terminated_employee,
      termination_type,
      notice_date,
      reason,
      termination_date,
    };

    const payload = sanitizePayload(rawPayload);

    const updated_termination = await termination_model.findByIdAndUpdate(
      termination_id,
      payload,
      { new: true },
    );

    if (!updated_termination) {
      return res.status(404).json({
        status: "error",
        message: "Termination not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Termination updated successfully",
      data: updated_termination,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating termination",
      error: error.message,
    });
  }
};

export const handle_delete_termination = async (req, res) => {
  try {
    const { termination_id } = req.params;

    const deleted_termination =
      await termination_model.findByIdAndDelete(termination_id);

    if (!deleted_termination) {
      return res.status(404).json({
        status: "error",
        message: "Termination not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Termination deleted successfully",
      data: deleted_termination,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting termination",
      error: error.message,
    });
  }
};
//   try {
//     const resignations = await resignation_model
//       .find()
//       .populate("resigning_employee");

//     return res.status(200).json({
//       status: "success",
//       message: "Resignations fetched successfully",
//       data: resignations,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       status: "error",
//       message: "An error occurred while fetching resignations",
//       error: error.message,
//     });
//   }
// };

// export const handle_get_resignation = async (req, res) => {
//   try {
//     const { resignation_id } = req.params;

//     const resignation = await resignation_model
//       .findById(resignation_id)
//       .populate("resigning_employee");
//     if (!resignation) {
//       return res.status(404).json({
//         status: "error",
//         message: "Resignation not found",
//       });
//     }
//     return res.status(200).json({
//       status: "success",
//       message: "Resignation fetched successfully",
//       data: resignation,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       status: "error",
//       message: "An error occurred while fetching resignation",
//       error: error.message,
//     });
//   }
// };

// export const handle_add_resignation = async (req, res) => {
//   try {
//     const { resigning_employee, notice_date, resignation_date, reason } =
//       req.body;

//     const rawPayload = {
//       resigning_employee,
//       notice_date,
//       resignation_date,
//       reason,
//     };

//     const payload = sanitizePayload(rawPayload);

//     const new_resignation = await resignation_model.create(payload);

//     return res.status(201).json({
//       status: "success",
//       message: "Resignation added successfully",
//       data: new_resignation,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       status: "error",
//       message: "An error occurred while adding resignation",
//       error: error.message,
//     });
//   }
// };

// export const handle_delete_resignation = async (req, res) => {
//   try {
//     const { resignation_id } = req.params;

//     const deleted_resignation =
//       await resignation_model.findByIdAndDelete(resignation_id);

//     if (!deleted_resignation) {
//       return res.status(404).json({
//         status: "error",
//         message: "Resignation not found",
//       });
//     }

//     return res.status(200).json({
//       status: "success",
//       message: "Resignation deleted successfully",
//       data: deleted_resignation,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       status: "error",
//       message: "An error occurred while deleting resignation",
//       error: error.message,
//     });
//   }
// };
