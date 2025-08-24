import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { authMiddleware } from "@zenbilling/shared/src/middlewares/auth.middleware";

const router = Router();
const dashboardController = new DashboardController();

router.get("/metrics", authMiddleware, dashboardController.getDashboardMetrics.bind(dashboardController));

export default router;
