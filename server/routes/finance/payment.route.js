import express from "express";
import { handle_get_payments } from "../../controllers/finance/payment.controller.js";

const payment_router = express.Router();

payment_router.get("/", handle_get_payments);

export default payment_router;
