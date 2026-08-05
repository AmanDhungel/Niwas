import activity_model from "../models/activity.model.js";

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

export const handle_get_activities = async (req, res) => {
  try {
    const activities = await activity_model
      .find()
      .populate("owner")
      .populate("guests")
      .populate("deals")
      .populate("contacts")
      .populate("companies");

    return res.status(200).json({
      status: "success",
      message: "Activities fetched successfully",
      data: activities,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching activities",
      error: error.message,
    });
  }
};

export const handle_get_activity = async (req, res) => {
  try {
    const { activity_id } = req.params;

    const activity = await activity_model
      .findById(activity_id)
      .populate("owner")
      .populate("guests")
      .populate("deals")
      .populate("contacts")
      .populate("companies");

    if (!activity) {
      return res.status(404).json({
        status: "error",
        message: "Activity not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Activity fetched successfully",
      data: activity,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching activity",
      error: error.message,
    });
  }
};

export const handle_add_activity = async (req, res) => {
  try {
    const {
      title,
      description,
      activity_type,
      call_duration,
      due_date,
      activity_time,
      owner,
      guests,
      deals,
      contacts,
      companies,
    } = req.body;

    const rawPayload = {
      title,
      description,
      activity_type,
      due_date,
      owner,
      call_duration,
      activity_time,

      ...(guests && { guests: JSON.parse(guests) }),
      ...(deals && { deals: JSON.parse(deals) }),
      ...(contacts && { contacts: JSON.parse(contacts) }),
      ...(companies && { companies: JSON.parse(companies) }),
    };

    const payload = sanitizePayload(rawPayload);

    const new_activity = await activity_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Activity added successfully",
      data: new_activity,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding activity",
      error: error.message,
    });
  }
};

export const handle_edit_activity = async (req, res) => {
  try {
    const { activity_id } = req.params;
    const {
      title,
      description,
      activity_type,
      call_duration,
      due_date,
      activity_time,
      owner,
      guests,
      deals,
      contacts,
      companies,
    } = req.body;

    const rawPayload = {
      title,
      description,
      activity_type,
      due_date,
      owner,
      call_duration,
      activity_time,

      ...(guests && { guests: JSON.parse(guests) }),
      ...(deals && { deals: JSON.parse(deals) }),
      ...(contacts && { contacts: JSON.parse(contacts) }),
      ...(companies && { companies: JSON.parse(companies) }),
    };

    const payload = sanitizePayload(rawPayload);

    const activity = await activity_model.findByIdAndUpdate(
      activity_id,
      payload,
      { new: true }
    );

    if (!activity) {
      return res.status(404).json({
        status: "error",
        message: "Activity not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Activity updated successfully",
      data: activity,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while editing activity",
      error: error.message,
    });
  }
};

export const handle_delete_activity = async (req, res) => {
  try {
    const { activity_id } = req.params;

    const activity = await activity_model.findByIdAndDelete(activity_id);

    if (!activity) {
      return res.status(404).json({
        status: "error",
        message: "Activity not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Activity deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting activity",
      error: error.message,
    });
  }
};
