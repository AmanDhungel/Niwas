// app.js
import express from "express";
import dotenv from "dotenv";
import { Server } from "socket.io";
import http from "http";
import cors from "cors";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

// Models & Routes
import user_model from "./models/user.model.js";
import auth_routes from "./routes/auth.routes.js";
import contact_routes from "./routes/contact.route.js";
import company_routes from "./routes/company.route.js";
import employee_routes from "./routes/employee.route.js";
import deal_routes from "./routes/deal.route.js";
import lead_routes from "./routes/lead.route.js";
import activity_routes from "./routes/activity.route.js";
import workspace_routes from "./routes/workspace.route.js";
import board_routes from "./routes/board/board.route.js";
import ram_routes from "./routes/ram/ram.route.js";
import event_routes from "./routes/event/event.route.js";
import department_routes from "./routes/hrm/department.route.js";
import designation_routes from "./routes/hrm/designation.route.js";
import policy_routes from "./routes/hrm/policy.route.js";
import ticket_routes from "./routes/hrm/ticket.route.js";
import timeline_routes from "./routes/board/timeline.route.js";
import training_routes from "./routes/hrm/training/training.route.js";
import promotion_routes from "./routes/hrm/promotion.route.js";
import resignation_routes from "./routes/hrm/resignation.route.js";
import termination_routes from "./routes/hrm/termination.route.js";
import appraisal_routes from "./routes/hrm/appraisal.route.js";
import goal_routes from "./routes/hrm/goal/goal.route.js";
import holiday_routes from "./routes/hrm/holiday.route.js";
import leave_routes from "./routes/hrm/leave/leave.route.js";
import user_routes from "./routes/user.route.js";
import timesheet_routes from "./routes/hrm/timesheet.route.js";
import asset_routes from "./routes/administration/assets/asset.route.js";
import overtime_routes from "./routes/hrm/overtime.route.js";
import schedule_routes from "./routes/hrm/schedule.route.js";
import estimate_routes from "./routes/finance/estimate.route.js";
import tax_routes from "./routes/finance/tax.route.js";
import provident_fund_routes from "./routes/finance/provident_fund.route.js";
import expense_routes from "./routes/finance/expense.route.js";
import invoice_routes from "./routes/finance/invoice.route.js";
import payment_routes from "./routes/finance/payment.route.js";
import budget_routes from "./routes/accounting/budget.route.js";
import account_category_routes from "./routes/accounting/account_category.route.js";
import budget_expense_routes from "./routes/accounting/budget_expense.route.js";
import budget_revenue_routes from "./routes/accounting/budget_revenue.route.js";
import addition_routes from "./routes/payroll/addition.route.js";
import salary_routes from "./routes/payroll/salary.route.js";
import property_routes from "./routes/property/property.route.js";
import tenant_routes from "./routes/tenant/tenant.route.js";
import tenant_invoice_routes from "./routes/tenant/tenant_invoice.route.js";
import tenant_rating_routes from "./routes/tenant/tenant_rating.route.js";
import tenant_lease_routes from "./routes/tenant/tenant_lease.route.js";
import tenant_invitation_routes from "./routes/tenant/tenant_invitation.route.js";
import meter_routes from "./routes/utility/meter.route.js";
import utility_provider_routes from "./routes/utility/utility_provider.route.js";
import short_term_stay_routes from "./routes/occupancy/short_term_stay.route.js";
import long_term_occupant_routes from "./routes/occupancy/long_term_occupant.route.js";
import rental_routes from "./routes/rental/rental.route.js";
import owner_routes from "./routes/owner/owner.route.js";
import owner_lease_routes from "./routes/owner/owner_lease.route.js";
import owner_invoice_routes from "./routes/owner/owner_invoice.route.js";
import owner_invitation_routes from "./routes/owner/owner_invitation.route.js";
import owner_rating_routes from "./routes/owner/owner_rating.route.js";
import agreement_routes from "./routes/agreement/agreement.route.js";
import parking_facility_routes from "./routes/parking/parking_facility.route.js";
import parking_assignment_routes from "./routes/parking/parking_assignment.route.js";
import promotion_package_routes from "./routes/marketplace/promotion_package.route.js";
import listing_promotion_routes from "./routes/marketplace/listing_promotion.route.js";
import search_boost_routes from "./routes/marketplace/search_boost.route.js";
import ab_test_routes from "./routes/marketplace/ab_test.route.js";
import marketplace_settings_routes from "./routes/marketplace/marketplace_search_settings.route.js";
import marketplace_featured_settings_routes from "./routes/marketplace/marketplace_featured_settings.route.js";
import marketplace_listing_routes from "./routes/marketplace/marketplace_listing.route.js";
import complaint_routes from "./routes/complaint/complaint.route.js";
import attendance_routes from "./routes/hrm/attendance/attendance.route.js";
import pipeline_routes from "./routes/pipeline.route.js";
import performance_indicator_routes from "./routes/hrm/performance_indicator.route.js";
import workorder_vendor_routes from "./routes/workorder/workorder_vendor.route.js";
import workorder_routes from "./routes/workorder/workorder.route.js";
import general_setting_routes from "./routes/settings/general_setting.route.js";
import website_setting_routes from "./routes/settings/website_setting.route.js";
import app_setting_routes from "./routes/settings/app_setting.route.js";
import financial_setting_routes from "./routes/settings/financial_setting.route.js";
import system_setting_routes from "./routes/settings/system_setting.route.js";
import permission_policy_routes from "./routes/iam/permission_policy.route.js";
import permission_group_routes from "./routes/iam/permission_group.route.js";
import ecommerce_property_routes from "./routes/ecommerce/ecommerce_property.route.js";
import ecommerce_user_routes from "./routes/ecommerce/ecommerce_user.route.js";
import ecommerce_property_tour_routes from "./routes/ecommerce/property_tour.route.js";
import ecommerce_maintenance_service_routes from "./routes/ecommerce/maintenance_service.route.js";
import ecommerce_property_offer_routes from "./routes/ecommerce/property_offer.route.js";
import testimonial_routes from "./routes/content/testimonial.route.js";
import faq_routes from "./routes/content/faq.route.js";
import blog_category_routes from "./routes/content/blog/blog_category.route.js";
import blog_tag_routes from "./routes/content/blog/blog_tag.route.js";
import blog_comment_routes from "./routes/content/blog/blog_comment.route.js";
import blog_routes from "./routes/content/blog/blog.route.js";
import sms_setting_routes from "./routes/application/sms_setting.route.js";
import email_setting_routes from "./routes/application/email_setting.route.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// --- Socket.io Configuration ---
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const workspaceIo = io.of("/socket/workspaces");
const connected_users = new Map();

workspaceIo.use(async (socket, next) => {
  const cookie = socket.handshake.query.cookie;
  try {
    if (!cookie) return next(new Error("No token provided"));
    const token = jwt.verify(cookie, process.env.JWT_SECRET);
    if (!token) return next(new Error("Invalid Token"));
    const user = await user_model.findOne({ _id: token.user_id });
    if (!user) return next(new Error("User not found"));
    next();
  } catch (err) {
    next(new Error(err.message));
  }
});

workspaceIo.on("connection", (socket) => {
  connected_users.set(socket.handshake.query.user_id, socket.id);
  socket.on("disconnect", () => {
    connected_users.delete(socket.handshake.query.user_id);
  });
});

// --- Middleware ---
app.use(cors({ origin: ["http://localhost:3000"], credentials: true }));
app.use(express.json({ limit: "1gb" }));
app.use(express.static("uploads"));
app.use(express.urlencoded({ limit: "1gb", extended: true }));
app.use(cookieParser());

// --- Routes ---
app.use("/api/auth", auth_routes);

app.use("/api/contact", contact_routes);

app.use("/api/company", company_routes);

app.use("/api/employee", employee_routes);

app.use("/api/deal", deal_routes);

app.use("/api/lead", lead_routes);

app.use("/api/activity", activity_routes);

app.use("/api/workspace", workspace_routes);

app.use("/api/board", board_routes);

app.use("/api/ram", ram_routes);

app.use("/api/event", event_routes);

app.use("/api/department", department_routes);

app.use("/api/designation", designation_routes);

app.use("/api/policy", policy_routes);

app.use("/api/ticket", ticket_routes);

app.use("/api/timeline", timeline_routes);

app.use("/api/training", training_routes);

app.use("/api/promotion", promotion_routes);

app.use("/api/resignation", resignation_routes);

app.use("/api/termination", termination_routes);

app.use("/api/appraisal", appraisal_routes);

app.use("/api/goal", goal_routes);

app.use("/api/holiday", holiday_routes);

app.use("/api/hrm/leave", leave_routes);

app.use("/api/user", user_routes);

app.use("/api/asset", asset_routes);

app.use("/api/timesheet", timesheet_routes);

app.use("/api/overtime", overtime_routes);

app.use("/api/schedule", schedule_routes);

app.use("/api/finance/estimate", estimate_routes);

app.use("/api/finance/tax", tax_routes);

app.use("/api/finance/provident_fund", provident_fund_routes);

app.use("/api/finance/expense", expense_routes);

app.use("/api/finance/invoice", invoice_routes);

app.use("/api/finance/payment", payment_routes);

app.use("/api/accounting/budget", budget_routes);

app.use("/api/accounting/account_category", account_category_routes);

app.use("/api/accounting/budget_expense", budget_expense_routes);

app.use("/api/accounting/budget_revenue", budget_revenue_routes);

app.use("/api/payroll/addition", addition_routes);

app.use("/api/payroll/salary", salary_routes);

app.use("/api/property", property_routes);

app.use("/api/tenant", tenant_routes);

app.use("/api/tenant_lease", tenant_lease_routes);

app.use("/api/tenant_invitation", tenant_invitation_routes);

app.use("/api/tenant_invoice", tenant_invoice_routes);

app.use("/api/tenant_rating", tenant_rating_routes);

app.use("/api/utility/meter", meter_routes);

app.use("/api/utility/utility_provider", utility_provider_routes);

app.use("/api/occupancy/short_term_stay", short_term_stay_routes);

app.use("/api/occupancy/long_term_occupant", long_term_occupant_routes);

app.use("/api/rental", rental_routes);

app.use("/api/owner", owner_routes);

app.use("/api/owner_lease", owner_lease_routes);

app.use("/api/owner_invoice", owner_invoice_routes);

app.use("/api/owner_invitation", owner_invitation_routes);

app.use("/api/owner_rating", owner_rating_routes);

app.use("/api/agreement", agreement_routes);

app.use("/api/parking/parking_facility", parking_facility_routes);

app.use("/api/parking/parking_assignment", parking_assignment_routes);

app.use("/api/marketplace/promotion_package", promotion_package_routes);

app.use("/api/marketplace/listing_promotion", listing_promotion_routes);

app.use("/api/marketplace/search_boost", search_boost_routes);

app.use("/api/marketplace/ab_test", ab_test_routes);

app.use("/api/marketplace/settings", marketplace_settings_routes);

app.use(
  "/api/marketplace/featured/settings",
  marketplace_featured_settings_routes,
);

app.use("/api/marketplace/listing", marketplace_listing_routes);

app.use("/api/complaint", complaint_routes);

app.use("/api/attendance", attendance_routes);

app.use("/api/pipeline", pipeline_routes);

app.use("/api/hrm/performance_indicator", performance_indicator_routes);

app.use("/api/workorder/vendor", workorder_vendor_routes);

app.use("/api/workorder", workorder_routes);

app.use("/api/settings/general", general_setting_routes);

app.use("/api/settings/website", website_setting_routes);

app.use("/api/settings/app", app_setting_routes);

app.use("/api/settings/financial", financial_setting_routes);

app.use("/api/settings/system", system_setting_routes);

app.use("/api/iam/permission_policy", permission_policy_routes);

app.use("/api/iam/permission_group", permission_group_routes);

app.use("/api/ecommerce_property", ecommerce_property_routes);

app.use("/api/ecommerce_user", ecommerce_user_routes);

app.use("/api/ecommerce_property_tour", ecommerce_property_tour_routes);

app.use("/api/ecommerce_maintenance_service", ecommerce_maintenance_service_routes);

app.use("/api/ecommerce_property_offer", ecommerce_property_offer_routes);

app.use("/api/content/testimonial", testimonial_routes);

app.use("/api/content/faq", faq_routes);

app.use("/api/content/blog/category", blog_category_routes);

app.use("/api/content/blog/tag", blog_tag_routes);

app.use("/api/content/blog/comment", blog_comment_routes);

app.use("/api/content/blog/blog", blog_routes);

app.use("/api/application/sms_setting", sms_setting_routes);

app.use("/api/application/email_setting", email_setting_routes);

app.get("/", (req, res) => {
  res.send("Backend Script API");
});

export { app, server };
