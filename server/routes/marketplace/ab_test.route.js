import express from "express";
import {
  handle_get_ab_tests,
  handle_get_ab_test,
  handle_add_ab_test,
  handle_edit_ab_test,
  handle_delete_ab_test,
} from "../../controllers/marketplace/ab_test.controller.js";

const ab_test_router = express.Router();

ab_test_router.get("/", handle_get_ab_tests);

ab_test_router.get("/ab_test/:test_id", handle_get_ab_test);

ab_test_router.post("/add", handle_add_ab_test);

ab_test_router.post("/edit/:test_id", handle_edit_ab_test);

ab_test_router.post("/delete/:test_id", handle_delete_ab_test);

export default ab_test_router;
