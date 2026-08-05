import step_model from "../models/step.model.js";

export const handle_get_steps = async (req, res) => {
  try {
    const steps = await step_model.find();

    return res.status(200).json({
      status: "success",
      message: "Steps fetched successfully",
      data: steps,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "An error occurred while fetching steps",
      error: error.message,
    });
  }
};