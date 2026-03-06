import { Router } from "express";
import requireAuth from "../middlewares/authMiddleware.mjs";
import requireAdmin from "../middlewares/adminMiddleware.mjs";
import adminController from "../controllers/adminController.mjs";

const adminRouter = Router();

// =======================================================
// ADMIN DASHBOARD
// =======================================================

adminRouter.get(
  "/dashboard",
  requireAuth,
  requireAdmin,
  adminController.getDashboard
);

// =======================================================
// GET ALL USERS
// =======================================================

adminRouter.get(
  "/users",
  requireAuth,
  requireAdmin,
  adminController.getUsers
);

// =======================================================
// GET ALL ORDERS
// =======================================================

adminRouter.get(
  "/orders",
  requireAuth,
  requireAdmin,
  adminController.getOrders
);

export default adminRouter;