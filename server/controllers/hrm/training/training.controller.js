import trainer_model from "../../../models/hrm/training/trainer.model.js";
import training_model from "../../../models/hrm/training/training.model.js";
import training_type_model from "../../../models/hrm/training/training_type.model.js";

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

export const handle_get_trainings = async (req, res) => {
  try {
    const trainings = await training_model
      .find()
      .populate("trainer")
      .populate("training_type")
      .populate("employees");

    return res.status(200).json({
      status: "success",
      message: "Trainings fetched successfully",
      data: trainings,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching trainings",
      error: error.message,
    });
  }
};

export const handle_get_training = async (req, res) => {
  try {
    const { training_id } = req.params;

    const training = await training_model
      .findById(training_id)
      .populate("trainer")
      .populate("training_type")
      .populate("employees");
    if (!training) {
      return res.status(404).json({
        status: "error",
        message: "Training not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Training fetched successfully",
      data: training,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching training",
      error: error.message,
    });
  }
};

export const handle_add_training = async (req, res) => {
  try {
    const {
      training_type,
      trainer,
      employees,
      training_cost,
      start_date,
      end_date,
      description,
      status,
    } = req.body;

    const rawPayload = {
      training_type,
      trainer,
      employees,
      training_cost,
      start_date,
      end_date,
      description,
      status,
    };

    const payload = sanitizePayload({
      ...rawPayload,
      employees: employees ? JSON.parse(employees) : undefined,
    });

    const new_training = await training_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Training added successfully",
      data: new_training,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding training",
      error: error.message,
    });
  }
};

export const handle_edit_training = async (req, res) => {
  try {
    const { training_id } = req.params;
    const {
      training_type,
      trainer,
      employees,
      training_cost,
      start_date,
      end_date,
      description,
      status,
    } = req.body;

    const rawPayload = {
      training_type,
      trainer,
      employees,
      training_cost,
      start_date,
      end_date,
      description,
      status,
    };

    const payload = sanitizePayload({
      ...rawPayload,
      employees: employees ? JSON.parse(employees) : undefined,
    });

    const updated_training = await training_model.findByIdAndUpdate(
      training_id,
      payload,
      { new: true },
    );

    if (!updated_training) {
      return res.status(404).json({
        status: "error",
        message: "Training not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Training updated successfully",
      data: updated_training,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating training",
      error: error.message,
    });
  }
};

export const handle_get_trainers = async (req, res) => {
  try {
    const trainers = await trainer_model.find();

    return res.status(200).json({
      status: "success",
      message: "Trainers fetched successfully",
      data: trainers,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching trainers",
      error: error.message,
    });
  }
};

export const handle_get_trainer = async (req, res) => {
  try {
    const { trainer_id } = req.params;

    const trainer = await trainer_model.findById(trainer_id);
    if (!trainer) {
      return res.status(404).json({
        status: "error",
        message: "Trainer not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Trainer fetched successfully",
      data: trainer,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching trainer",
      error: error.message,
    });
  }
};

export const handle_add_trainer = async (req, res) => {
  try {
    const { first_name, last_name, role, email, phone, description, status } =
      req.body;

    const rawPayload = {
      first_name,
      last_name,
      role,
      email,
      phone,
      description,
      status,
    };

    const payload = sanitizePayload(rawPayload);

    const new_trainer = await trainer_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Trainer added successfully",
      data: new_trainer,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding trainer",
      error: error.message,
    });
  }
};

export const handle_edit_trainer = async (req, res) => {
  try {
    const { trainer_id } = req.params;
    const { first_name, last_name, role, email, phone, description, status } =
      req.body;

    const rawPayload = {
      first_name,
      last_name,
      role,
      email,
      phone,
      description,
      status,
    };

    const payload = sanitizePayload(rawPayload);

    const updated_trainer = await trainer_model.findByIdAndUpdate(
      trainer_id,
      payload,
      { new: true },
    );

    if (!updated_trainer) {
      return res.status(404).json({
        status: "error",
        message: "Trainer not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Trainer updated successfully",
      data: updated_trainer,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating trainer",
      error: error.message,
    });
  }
};

export const handle_get_training_types = async (req, res) => {
  try {
    const training_types = await training_type_model.find();

    return res.status(200).json({
      status: "success",
      message: "Training types fetched successfully",
      data: training_types,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching training types",
      error: error.message,
    });
  }
};

export const handle_get_training_type = async (req, res) => {
  try {
    const { training_type_id } = req.params;

    const training_type = await training_type_model.findById(training_type_id);
    if (!training_type) {
      return res.status(404).json({
        status: "error",
        message: "Training type not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Training type fetched successfully",
      data: training_type,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching training type",
      error: error.message,
    });
  }
};

export const handle_add_training_type = async (req, res) => {
  try {
    const { type, description, status } = req.body;

    const rawPayload = {
      type,
      description,
      status,
    };

    const payload = sanitizePayload(rawPayload);

    const new_training_type = await training_type_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Training type added successfully",
      data: new_training_type,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding training type",
      error: error.message,
    });
  }
};

export const handle_edit_training_type = async (req, res) => {
  try {
    const { training_type_id } = req.params;
    const { type, description, status } = req.body;

    const rawPayload = {
      type,
      description,
      status,
    };

    const payload = sanitizePayload(rawPayload);

    const updated_training_type = await training_type_model.findByIdAndUpdate(
      training_type_id,
      payload,
      { new: true },
    );

    if (!updated_training_type) {
      return res.status(404).json({
        status: "error",
        message: "Training type not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Training type updated successfully",
      data: updated_training_type,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while updating training type",
      error: error.message,
    });
  }
};

export const handle_delete_training_type = async (req, res) => {
  try {
    const { training_type_id } = req.params;

    const deleted_training_type =
      await training_type_model.findByIdAndDelete(training_type_id);

    if (!deleted_training_type) {
      return res.status(404).json({
        status: "error",
        message: "Training type not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Training type deleted successfully",
      data: deleted_training_type,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting training type",
      error: error.message,
    });
  }
};

export const handle_delete_training = async (req, res) => {
  try {
    const { training_id } = req.params;

    const deleted_training =
      await training_model.findByIdAndDelete(training_id);

    if (!deleted_training) {
      return res.status(404).json({
        status: "error",
        message: "Training not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Training deleted successfully",
      data: deleted_training,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting training",
      error: error.message,
    });
  }
};

export const handle_delete_trainer = async (req, res) => {
  try {
    const { trainer_id } = req.params;

    const deleted_trainer = await trainer_model.findByIdAndDelete(trainer_id);

    if (!deleted_trainer) {
      return res.status(404).json({
        status: "error",
        message: "Trainer not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Trainer deleted successfully",
      data: deleted_trainer,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting trainer",
      error: error.message,
    });
  }
};