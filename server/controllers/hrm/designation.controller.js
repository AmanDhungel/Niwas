import employee_model from "../../models/employee.model.js";
import designation_model from "../../models/hrm/designation.model.js";

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

export const handle_get_designations = async (req, res) => {
  try {
    const designations = await designation_model.find().populate("department");

    // for each designation, get the number of employees associated with it and add it to the response
    const designations_with_employee_count = await Promise.all(
      designations.map(async (designation) => {
        const no_of_employees = await employee_model.countDocuments({
          designation: designation._id,
        });
        return {
          ...designation.toObject(),
          no_of_employees,
        };
      }),
    );

    return res.status(200).json({
      status: "success",
      message: "Designations fetched successfully",
      data: designations_with_employee_count,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching designations",
      error: error.message,
    });
  }
};

export const handle_get_designation = async (req, res) => {
  try {
    const { designation_id } = req.params;

    const designation = await designation_model
      .findById(designation_id)
      .populate("department");

    if (!designation) {
      return res.status(404).json({
        status: "error",
        message: "Designation not found",
      });
    }

    const no_of_employees = await employee_model.countDocuments({
      designation: designation_id,
    });

    const designation_data = {
      ...designation.toObject(),
      no_of_employees,
    };

    return res.status(200).json({
      status: "success",
      message: "Designation fetched successfully",
      data: designation_data,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching designation",
      error: error.message,
    });
  }
};

export const handle_add_designation = async (req, res) => {
  try {
    const { name, department, status } = req.body;

    const rawPayload = {
      name,
      department,
      // no_of_employees,
      status,
    };

    const payload = sanitizePayload(rawPayload);

    const new_designation = await designation_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Designation added successfully",
      data: new_designation,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        status: "error",
        message: "Designation name and department are required",
      });
    }
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding designation",
      error: error.message,
    });
  }
};

export const handle_edit_designation = async (req, res) => {
  try {
    const { designation_id } = req.params;
    const { name, department, status } = req.body;

    const rawPayload = {
      name,
      department,
      status,
    };

    const payload = sanitizePayload(rawPayload);

    const updated_designation = await designation_model
      .findByIdAndUpdate(designation_id, payload, { new: true })
      .populate("department");

    if (!updated_designation) {
      return res.status(404).json({
        status: "error",
        message: "Designation not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Designation updated successfully",
      data: updated_designation,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating designation",
      error: error.message,
    });
  }
};

export const handle_delete_designation = async (req, res) => {
  try {
    const { designation_id } = req.params;

    const deleted_designation =
      await designation_model.findByIdAndDelete(designation_id);

    if (!deleted_designation) {
      return res.status(404).json({
        status: "error",
        message: "Designation not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Designation deleted successfully",
      data: deleted_designation,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting designation",
      error: error.message,
    });
  }
};
