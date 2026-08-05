import employee_model from "../../models/employee.model.js";
import department_model from "../../models/hrm/department.model.js";

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

export const handle_get_departments = async (req, res) => {
  try {
    const departments = await department_model.find();

    // for each department, get the number of employees associated with it and add it to the response
    const departments_with_employee_count = await Promise.all(
      departments.map(async (department) => {
        const no_of_employees = await employee_model.countDocuments({
          department: department._id,
        });
        return {
          ...department.toObject(),
          no_of_employees,
        };
      }),
    );

    return res.status(200).json({
      status: "success",
      message: "Departments fetched successfully",
      data: departments_with_employee_count,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching departments",
      error: error.message,
    });
  }
};

export const handle_get_department = async (req, res) => {
  try {
    const { department_id } = req.params;

    const department = await department_model.findById(department_id);
    if (!department) {
      return res.status(404).json({
        status: "error",
        message: "Department not found",
      });
    }

    const number_of_employees = await employee_model.countDocuments({
      department: department_id,
    });

    const department_data = department.toObject();
    department_data.no_of_employees = number_of_employees;

    return res.status(200).json({
      status: "success",
      message: "Department fetched successfully",
      data: department_data,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching department",
      error: error.message,
    });
  }
};

export const handle_add_department = async (req, res) => {
  try {
    const { name, status, no_of_employees } = req.body;

    const rawPayload = {
      name,
      status,
      // no_of_employees,
    };

    const payload = sanitizePayload(rawPayload);

    const new_department = await department_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Department added successfully",
      data: new_department,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        status: "error",
        message: "Department name is required",
      });
    }
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding department",
      error: error.message,
    });
  }
};

export const handle_edit_department = async (req, res) => {
  try {
    const { department_id } = req.params;
    const { name, status } = req.body;

    const rawPayload = {
      name,
      status,
    };

    const payload = sanitizePayload(rawPayload);

    const updated_department = await department_model.findByIdAndUpdate(
      department_id,
      payload,
      { new: true },
    );

    if (!updated_department) {
      return res.status(404).json({
        status: "error",
        message: "Department not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Department updated successfully",
      data: updated_department,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating department",
      error: error.message,
    });
  }
};

export const handle_delete_department = async (req, res) => {
  try {
    const { department_id } = req.params;

    const deleted_department =
      await department_model.findByIdAndDelete(department_id);

    if (!deleted_department) {
      return res.status(404).json({
        status: "error",
        message: "Department not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Department deleted successfully",
      data: deleted_department,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting department",
      error: error.message,
    });
  }
};
