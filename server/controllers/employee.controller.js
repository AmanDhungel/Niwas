import employee_model from "../models/employee.model.js";

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
    if (!isEmptyValue(value)) cleaned[key] = value;
  }
  return cleaned;
};

/* ================= GET EMPLOYEES ================= */
export const handle_get_employees = async (req, res) => {
  try {
    // multiple populate to get company, department and designation details in employee listing
    const employees = await employee_model.find().populate([
      { path: "department", model: "department" },
      { path: "designation", model: "designation" },
    ]);

    return res.status(200).json({
      status: "success",
      message: "Employees fetched successfully",
      data: employees,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching employees",
      error: error.message,
    });
  }
};

/* ================= GET EMPLOYEE ================= */
export const handle_get_employee = async (req, res) => {
  try {
    const { employee_id } = req.params;

    const employee = await employee_model
      .findById(employee_id)
      .populate([
        { path: "department", model: "department" },
        { path: "designation", model: "designation" },
      ]);


    if (!employee) {
      return res.status(404).json({
        status: "error",
        message: "Employee not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Employee fetched successfully",
      data: employee,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching employee",
      error: error.message,
    });
  }
};

/* ================= ADD EMPLOYEE ================= */
export const handle_add_employee = async (req, res) => {
  try {
    const {
      name,
      join_date,
      email,
      phone,
      gender,
      date_of_birth,
      address,
      passport_number,
      passport_expiry_date,
      nationality,
      religion,
      marital_status,
      employment_of_spouse,
      no_of_children,
      department,
      designation,
      about,
    } = req.body;

    const last_employee = await employee_model
      .findOne()
      .sort({ createdAt: -1 })
      .select("employee_id")
      .lean();

    let new_employee_id = "EMP-0001";

    if (last_employee?.employee_id) {
      const last_number = parseInt(last_employee.employee_id.split("-")[1], 10);
      const safe_number = isNaN(last_number) ? 0 : last_number;
      new_employee_id = `EMP-${String(safe_number + 1).padStart(4, "0")}`;
    }

    const rawPayload = {
      employee_id: new_employee_id,
      name,
      join_date,
      email,
      phone,
      gender,
      date_of_birth,
      passport_number,
      passport_expiry_date,
      nationality,
      religion,
      marital_status,
      employment_of_spouse,
      no_of_children,
      department,
      designation,
      about,
      ...(address && { address: JSON.parse(address) }),
    };

    const payload = sanitizePayload(rawPayload);
    const new_employee = await employee_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Employee added successfully",
      data: new_employee,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding employee",
      error: error.message,
    });
  }
};

/* ================= EDIT EMPLOYEE ================= */
export const handle_edit_employee = async (req, res) => {
  try {
    const { employee_id } = req.params;

    const {
      name,
      join_date,
      email,
      phone,
      gender,
      date_of_birth,
      address,
      passport_number,
      passport_expiry_date,
      nationality,
      religion,
      marital_status,
      employment_of_spouse,
      no_of_children,
      department,
      designation,
      about,
    } = req.body;

    const rawPayload = {
      name,
      join_date,
      email,
      phone,
      gender,
      date_of_birth,
      passport_number,
      passport_expiry_date,
      nationality,
      religion,
      marital_status,
      employment_of_spouse,
      no_of_children,
      department,
      designation,
      about,
      ...(address && { address: JSON.parse(address) }),
    };

    const payload = sanitizePayload(rawPayload);
    const updated_employee = await employee_model.findByIdAndUpdate(
      employee_id,
      payload,
      { new: true },
    );

    if (!updated_employee) {
      return res.status(404).json({
        status: "error",
        message: "Employee not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Employee updated successfully",
      data: updated_employee,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating employee",
      error: error.message,
    });
  }
};

/* ================= DELETE EMPLOYEE ================= */
export const handle_delete_employee = async (req, res) => {
  try {
    const { employee_id } = req.params;
    const deleted_employee =
      await employee_model.findByIdAndDelete(employee_id);

    if (!deleted_employee) {
      return res.status(404).json({
        status: "error",
        message: "Employee not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Employee deleted successfully",
      data: deleted_employee,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting employee",
      error: error.message,
    });
  }
};

/* ================= UPDATE EMPLOYEE PROFILE DETAILS ================= */
export const handle_update_employee_profile = async (req, res) => {
  try {
    const { employee_id } = req.params;

    const { bank_info, family_info, education, experience, about } = req.body;

    const safe_parse = (data) => {
      if (!data) return null;
      if (typeof data === "object") return data;
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    };

    const parsed_bank_info = safe_parse(bank_info);
    const parsed_family_info = safe_parse(family_info);
    const parsed_education = safe_parse(education);
    const parsed_experience = safe_parse(experience);

    const update = {};

    // bank_info — partial merge (only overwrite provided sub-fields)
    if (parsed_bank_info && typeof parsed_bank_info === "object") {
      const allowed = ["bank_name", "account_number", "ifsc_code", "branch"];
      for (const field of allowed) {
        if (parsed_bank_info[field] !== undefined) {
          update[`bank_info.${field}`] = parsed_bank_info[field];
        }
      }
    }

    if (about) {
      update.about = about
    }

    // Array fields — replace entirely when provided
    if (Array.isArray(parsed_family_info)) {
      update.family_info = parsed_family_info;
    }

    if (Array.isArray(parsed_education)) {
      update.education = parsed_education;
    }

    if (Array.isArray(parsed_experience)) {
      update.experience = parsed_experience;
    }

    // `findByIdAndUpdate` only validates the paths being set, unlike
    // `document.save()` which re-validates every required path on the
    // whole document — so profile-section edits no longer fail on
    // unrelated required fields (e.g. department/designation) that
    // this update never touches.
    const employee =
      Object.keys(update).length > 0
        ? await employee_model.findByIdAndUpdate(
          employee_id,
          { $set: update },
          { new: true, runValidators: true },
        )
        : await employee_model.findById(employee_id);

    if (!employee) {
      return res.status(404).json({
        status: "error",
        message: "Employee not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Employee profile details updated successfully",
      data: employee,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating employee profile details",
      error: error.message,
    });
  }
};
