import express from "express";
import {
  handle_add_addition,
  handle_delete_addition,
  handle_edit_addition,
  handle_get_addition,
  handle_get_additions,
} from "../../controllers/payroll/addition.controller.js";

const addition_router = express.Router();

addition_router.post("/add", handle_add_addition);

addition_router.get("/", handle_get_additions);

addition_router.get("/addition/:addition_id", handle_get_addition);

addition_router.post("/edit/:addition_id", handle_edit_addition);

addition_router.post("/delete/:addition_id", handle_delete_addition);

export default addition_router;