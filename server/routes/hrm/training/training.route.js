import express from "express";
import {
  handle_add_trainer,
  handle_add_training,
  handle_add_training_type,
  handle_delete_trainer,
  handle_delete_training,
  handle_delete_training_type,
  handle_edit_trainer,
  handle_edit_training,
  handle_edit_training_type,
  handle_get_trainer,
  handle_get_trainers,
  handle_get_training,
  handle_get_training_type,
  handle_get_training_types,
  handle_get_trainings,
} from "../../../controllers/hrm/training/training.controller.js";
// import {
//   handle_add_designation,
//   handle_delete_designation,
//   handle_get_designation,
//   handle_get_designations,
// } from "../../controllers/hrm/designation.controller.js";

const training_router = express.Router();

training_router.post("/add_training_type", handle_add_training_type);

training_router.post(
  "/edit_training_type/:training_type_id",
  handle_edit_training_type,
);

training_router.get(
  "/training_types/:training_type_id",
  handle_get_training_type,
);

training_router.get("/training_types", handle_get_training_types);

training_router.post("/add_trainer", handle_add_trainer);

training_router.post("/edit_trainer/:trainer_id", handle_edit_trainer);

training_router.get("/trainers/:trainer_id", handle_get_trainer);

training_router.get("/trainers", handle_get_trainers);

training_router.get("/", handle_get_trainings);

training_router.get("/:training_id", handle_get_training);

training_router.post("/add_training", handle_add_training);

training_router.post("/edit_training/:training_id", handle_edit_training);

training_router.post("/delete_training/:training_id", handle_delete_training);

training_router.post("/delete_trainer/:trainer_id", handle_delete_trainer);

training_router.post("/delete_training_type/:training_type_id", handle_delete_training_type);

// designation_router.get("/", handle_get_designations);

// designation_router.get("/:designation_id", handle_get_designation);

// designation_router.post("/add", handle_add_designation);

// designation_router.post("/delete/:designation_id", handle_delete_designation);

export default training_router;
