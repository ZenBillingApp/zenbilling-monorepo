import { Router } from "express";
import { CustomerStatsController } from "../controllers/customer.stats.controller";
import { authMiddleware, organizationRequired } from "@zenbilling/shared";

const router = Router();

// Toutes les routes stats sont protégées par authMiddleware (vérifie x-internal-secret)
router.use(authMiddleware);
router.use(organizationRequired);

// GET /api/customers/stats/top?limit=5
router.get("/top", CustomerStatsController.getTopCustomers);

export default router;
