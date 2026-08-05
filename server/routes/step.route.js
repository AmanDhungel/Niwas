import express from "express";
import { handle_get_steps } from "../controllers/step.controller.js";

const step_router = express.Router();

step_router.get("/", handle_get_steps);

export default step_router;