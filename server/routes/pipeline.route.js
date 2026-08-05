import express from "express";
import {
  handle_get_pipelines,
  handle_get_pipeline,
  handle_add_pipeline,
  handle_edit_pipeline,
  handle_delete_pipeline,
} from "../controllers/pipeline.controller.js";

const pipeline_router = express.Router();

pipeline_router.get("/", handle_get_pipelines);
pipeline_router.get("/:pipeline_id", handle_get_pipeline);
pipeline_router.post("/add", handle_add_pipeline);
pipeline_router.post("/edit/:pipeline_id", handle_edit_pipeline);
pipeline_router.post("/delete/:pipeline_id", handle_delete_pipeline);

export default pipeline_router;
