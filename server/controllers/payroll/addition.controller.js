import addition_model from "../../models/payroll/addition.model.js";

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

export const handle_get_additions = async (req, res) => {
  try {
    const additions = await addition_model
      .find()
      .populate("assigned_employees");

    return res.status(200).json({
      status: "success",
      message: "Additions fetched successfully",
      data: additions,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching additions",
      error: error.message,
    });
  }
};

export const handle_get_addition = async (req, res) => {
  try {
    const { addition_id } = req.params;

    const addition = await addition_model
      .findById(addition_id)
      .populate("assigned_employees");
    if (!addition) {
      return res.status(404).json({
        status: "error",
        message: "Addition not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Addition fetched successfully",
      data: addition,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching addition",
      error: error.message,
    });
  }
};

export const handle_add_addition = async (req, res) => {
  try {
    const {
      name,
      category,
      amount,
      unit_calculation,
      assigned_type,
      assigned_employees,
    } = req.body;

    const rawPayload = {
      name,
      category,
      amount,
      unit_calculation,
      assigned_type,
      assigned_employees: assigned_employees
        ? JSON.parse(assigned_employees) || []
        : [],
    };

    const payload = sanitizePayload(rawPayload);

    const new_addition = await addition_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Addition added successfully",
      data: new_addition,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding addition",
      error: error.message,
    });
  }
};

export const handle_edit_addition = async (req, res) => {
  try {
    const { addition_id } = req.params;
    const {
      name,
      category,
      amount,
      unit_calculation,
      assigned_type,
      assigned_employees,
    } = req.body;

    const rawPayload = {
      name,
      category,
      amount,
      unit_calculation,
      assigned_type,
      assigned_employees: assigned_employees
        ? JSON.parse(assigned_employees) || []
        : [],
    };

    const payload = sanitizePayload(rawPayload);

    const updated_addition = await addition_model.findByIdAndUpdate(
      addition_id,
      payload,
      {
        new: true,
      },
    );

    if (!updated_addition) {
      return res.status(404).json({
        status: "error",
        message: "Addition not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Addition updated successfully",
      data: updated_addition,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating addition",
      error: error.message,
    });
  }
};

export const handle_delete_addition = async (req, res) => {
  try {
    const { addition_id } = req.params;

    const deleted_addition =
      await addition_model.findByIdAndDelete(addition_id);

    if (!deleted_addition) {
      return res.status(404).json({
        status: "error",
        message: "Addition not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Addition deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting addition",
      error: error.message,
    });
  }
};
//   try {
//     const salaries = await salary_model.find().populate("employee");

//     return res.status(200).json({
//       status: "success",
//       message: "Salaries fetched successfully",
//       data: salaries,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       status: "error",
//       message: "An error occurred while fetching salaries",
//       error: error.message,
//     });
//   }
// };

// export const handle_get_salary = async (req, res) => {
//   try {
//     const { salary_id } = req.params;

//     const salary = await salary_model.findById(salary_id).populate("employee");
//     if (!salary) {
//       return res.status(404).json({
//         status: "error",
//         message: "Salary not found",
//       });
//     }
//     return res.status(200).json({
//       status: "success",
//       message: "Salary fetched successfully",
//       data: salary,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       status: "error",
//       message: "An error occurred while fetching salary",
//       error: error.message,
//     });
//   }
// };

// export const handle_add_salary = async (req, res) => {
//   try {
//     const { employee, net_salary, expected_revenues, deductions } = req.body;

//     const rawPayload = {
//       employee,
//       net_salary,
//       expected_revenues: JSON.parse(expected_revenues) || [],
//       deductions: JSON.parse(deductions) || [],
//     };

//     const payload = sanitizePayload(rawPayload);

//     const new_salary = await salary_model.create(payload);

//     return res.status(201).json({
//       status: "success",
//       message: "Salary added successfully",
//       data: new_salary,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       status: "error",
//       message: "An error occurred while adding salary",
//       error: error.message,
//     });
//   }
// };

// export const handle_edit_salary = async (req, res) => {
//   try {
//     const { salary_id } = req.params;
//     const { employee, net_salary, expected_revenues, deductions } = req.body;

//     const rawPayload = {
//       employee,
//       net_salary,
//       expected_revenues: JSON.parse(expected_revenues) || [],
//       deductions: JSON.parse(deductions) || [],
//     };

//     const payload = sanitizePayload(rawPayload);

//     const updated_salary = await salary_model.findByIdAndUpdate(
//       salary_id,
//       payload,
//       {
//         new: true,
//       },
//     );

//     if (!updated_salary) {
//       return res.status(404).json({
//         status: "error",
//         message: "Salary not found",
//       });
//     }

//     return res.status(200).json({
//       status: "success",
//       message: "Salary updated successfully",
//       data: updated_salary,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       status: "error",
//       message: "An error occurred while updating salary",
//       error: error.message,
//     });
//   }
// };

// export const handle_delete_salary = async (req, res) => {
//   try {
//     const { salary_id } = req.params;

//     const deleted_salary = await salary_model.findByIdAndDelete(salary_id);

//     if (!deleted_salary) {
//       return res.status(404).json({
//         status: "error",
//         message: "Salary not found",
//       });
//     }

//     return res.status(200).json({
//       status: "success",
//       message: "Salary deleted successfully",
//     });
//   } catch (error) {
//     return res.status(500).json({
//       status: "error",
//       message: "An error occurred while deleting salary",
//       error: error.message,
//     });
//   }
// };
