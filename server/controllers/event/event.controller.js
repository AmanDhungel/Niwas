import event_model from "../../models/event/event.model.js";

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

export const handle_get_events = async (req, res) => {
  try {
    const events = await event_model.find();

    return res.status(200).json({
      status: "success",
      message: "Events fetched successfully",
      data: events,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching events",
      error: error.message,
    });
  }
};

export const handle_add_event = async (req, res) => {
  try {
    const { name, type, date, start_time, end_time, description, location } =
      req.body;

    const rawPayload = {
      name,
      type,
      date,
      start_time,
      end_time,
      description,
      location,
    };

    const payload = sanitizePayload(rawPayload);

    const new_event = await event_model.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Event added successfully",
      data: new_event,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while adding event",
      error: error.message,
    });
  }
};

export const handle_edit_event = async (req, res) => {
  try {
    const { event_id } = req.params;
    const { name, type, date, start_time, end_time, description, location } =
      req.body;

    const rawPayload = {
      name,
      type,
      date,
      start_time,
      end_time,
      description,
      location,
    };

    const payload = sanitizePayload(rawPayload);

    const updated_event = await event_model.findByIdAndUpdate(
      event_id,
      payload,
      {
        new: true,
      }
    );

    if (!updated_event) {
      return res.status(404).json({
        status: "error",
        message: "Event not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Event updated successfully",
      data: updated_event,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while editing event",
      error: error.message,
    });
  }
};

export const handle_delete_event = async (req, res) => {
  try {
    const { event_id } = req.params;

    const deleted_event = await event_model.findByIdAndDelete(event_id);

    if (!deleted_event) {
      return res.status(404).json({
        status: "error",
        message: "Event not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Event deleted successfully",
      data: deleted_event,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting event",
      error: error.message,
    });
  }
};

export const handle_get_event = async (req, res) => {
  try {
    const { event_id } = req.params;

    const event = await event_model.findById(event_id);
    if (!event) {
      return res.status(404).json({
        status: "error",
        message: "Event not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Event fetched successfully",
      data: event,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching event",
      error: error.message,
    });
  }
};