import express from "express";
import {
  handle_add_appraisal,
  handle_delete_appraisal,
  handle_edit_appraisal,
  handle_get_appraisal,
  handle_get_appraisals,
} from "../../controllers/hrm/appraisal.controller.js";

const appraisal_router = express.Router();

appraisal_router.get("/", handle_get_appraisals);

appraisal_router.post("/add", handle_add_appraisal);

appraisal_router.get("/:appraisal_id", handle_get_appraisal);

appraisal_router.post("/delete/:appraisal_id", handle_delete_appraisal);

appraisal_router.post("/edit/:appraisal_id", handle_edit_appraisal);

export default appraisal_router;
