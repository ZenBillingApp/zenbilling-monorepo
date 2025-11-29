import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { authMiddleware, organizationRequired } from "@zenbilling/shared";

const router = Router();
const dashboardController = new DashboardController();

router.use(authMiddleware, organizationRequired);

router.get(
    "/metrics",
    dashboardController.getDashboardMetrics.bind(dashboardController)
);

export default router;
