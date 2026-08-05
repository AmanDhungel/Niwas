import holiday_model from "../../models/hrm/holiday.model.js";

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

export const handle_get_holidays = async (req, res) => {
  try {
    const holidays = await holiday_model.find();

    return res.status(200).json({
      status: "success",
      message: "Holidays fetched successfully",
      data: holidays,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching holidays",
      error: error.message,
    });
  }
};

export const handle_get_holiday = async (req, res) => {
  try {
    const { holiday_id } = req.params;

    const holiday = await holiday_model.findById(holiday_id);
    if (!holiday) {
      return res.status(404).json({
        status: "error",
        message: "Holiday not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Holiday fetched successfully",
      data: holiday,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching holiday",
      error: error.message,
    });
  }
};

export const handle_delete_holiday = async (req, res) => {
  try {
    const { holiday_id } = req.params;

    const deleted_holiday = await holiday_model.findByIdAndDelete(holiday_id);

    if (!deleted_holiday) {
      return res.status(404).json({
        status: "error",
        message: "Holiday not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Holiday deleted successfully",
      data: deleted_holiday,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting holiday",
      error: error.message,
    });
  }
};

export const handle_add_holiday = async (req, res) => {
  try {
    const { title, date, description, status } = req.body;

    const rawPayload = {
      title,
      date,
      description,
      status,
    };

    const payload = sanitizePayload(rawPayload);

    const new_holiday = await holiday_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Holiday added successfully",
      data: new_holiday,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding holiday",
      error: error.message,
    });
  }
};

export const handle_edit_holiday = async (req, res) => {
  try {
    const { holiday_id } = req.params;
    const { title, date, description, status } = req.body;

    const rawPayload = {
      title,
      date,
      description,
      status,
    };

    const payload = sanitizePayload(rawPayload);

    const updated_holiday = await holiday_model.findByIdAndUpdate(
      holiday_id,
      payload,
      { new: true },
    );

    if (!updated_holiday) {
      return res.status(404).json({
        status: "error",
        message: "Holiday not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Holiday updated successfully",
      data: updated_holiday,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating holiday",
      error: error.message,
    });
  }
};

// export const handle_get_resignations = async (req, res) => {
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
