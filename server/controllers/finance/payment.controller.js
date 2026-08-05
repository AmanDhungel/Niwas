import invoice_model from "../../models/finance/invoice.model.js";

export const handle_get_payments = async (req, res) => {
  try {
    const payments = await invoice_model
      .find({
        status: "paid",
      })
      .populate("tax");

    return res.status(200).json({
      status: "success",
      message: "Payments fetched successfully",
      data: payments,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "An error occurred while fetching expense",
      error: error.message,
    });
  }
};
