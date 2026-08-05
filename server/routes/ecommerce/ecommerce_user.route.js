import express from "express";
import multer from "multer";
import {
  handle_signup_ecommerce_user,
  handle_get_ecommerce_user_profile,
  handle_update_ecommerce_user_profile,
  handle_change_ecommerce_user_password,
  handle_get_payment,
  handle_add_payment_method,
  handle_edit_payment_method,
  handle_delete_payment_method,
  handle_update_payment_preferences,
  handle_get_notification_preferences,
  handle_update_notification_preferences,
  handle_signin_ecommerce_user,
  handle_forgot_password_ecommerce_user,
  handle_reset_password_ecommerce_user,
  handle_get_account_preferences,
  handle_update_account_preferences,
  handle_add_saved_property,
  handle_remove_saved_property,
} from "../../controllers/ecommerce/ecommerce_user.controller.js";

const ecommerce_user_router = express.Router();

const upload = multer({ dest: "temp/" });

ecommerce_user_router.post("/signup", handle_signup_ecommerce_user);

ecommerce_user_router.post("/signin", handle_signin_ecommerce_user);

ecommerce_user_router.get("/profile", handle_get_ecommerce_user_profile);

ecommerce_user_router.post(
  "/profile/update",
  upload.single("photo"),
  handle_update_ecommerce_user_profile,
);

ecommerce_user_router.post(
  "/password/change_password",
  handle_change_ecommerce_user_password,
);

ecommerce_user_router.post(
  "/password/forgot_password",
  handle_forgot_password_ecommerce_user,
);

ecommerce_user_router.post(
  "/password/reset_password",
  handle_reset_password_ecommerce_user,
);

ecommerce_user_router.get("/payment", handle_get_payment);

ecommerce_user_router.post("/payment/add", handle_add_payment_method);

ecommerce_user_router.post(
  "/payment/edit/:payment_method_id",
  handle_edit_payment_method,
);

ecommerce_user_router.post(
  "/payment/delete/:payment_method_id",
  handle_delete_payment_method,
);

ecommerce_user_router.post(
  "/payment/preferences/update",
  handle_update_payment_preferences,
);

ecommerce_user_router.get(
  "/notifications",
  handle_get_notification_preferences,
);

ecommerce_user_router.post(
  "/notifications/update",
  handle_update_notification_preferences,
);

ecommerce_user_router.get(
  "/account_preferences",
  handle_get_account_preferences,
);

ecommerce_user_router.post(
  "/account_preferences/update",
  handle_update_account_preferences,
);

ecommerce_user_router.post("/add_saved_property", handle_add_saved_property);

ecommerce_user_router.post(
  "/remove_saved_property",
  handle_remove_saved_property,
);

export default ecommerce_user_router;
