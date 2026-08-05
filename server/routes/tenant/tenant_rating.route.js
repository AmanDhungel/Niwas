import express from "express";
import {
  handle_get_tenant_ratings,
  handle_get_tenant_rating,
  handle_add_tenant_rating,
  handle_edit_tenant_rating,
  handle_delete_tenant_rating,
  handle_update_tenant_rating_visibility,
} from "../../controllers/tenant/tenant_rating.controller.js";

const tenant_rating_router = express.Router();

tenant_rating_router.get("/",                               handle_get_tenant_ratings);
tenant_rating_router.get("/:rating_id",                     handle_get_tenant_rating);
tenant_rating_router.post("/add",                           handle_add_tenant_rating);
tenant_rating_router.post("/edit/:rating_id",               handle_edit_tenant_rating);
tenant_rating_router.post("/delete/:rating_id",             handle_delete_tenant_rating);
tenant_rating_router.post("/update_visibility/:rating_id",  handle_update_tenant_rating_visibility);

export default tenant_rating_router;