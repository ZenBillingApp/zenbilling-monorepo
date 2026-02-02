import { Router } from "express";
import { QuoteStatsController } from "../controllers/quote.stats.controller";
import { authMiddleware, organizationRequired } from "@zenbilling/shared";

const router = Router();

// Toutes les routes stats sont protégées par authMiddleware (vérifie x-internal-secret)
router.use(authMiddleware);
router.use(organizationRequired);

// GET /api/quotes/stats/all - Toutes les stats en une seule requête (optimisé)
router.get("/all", QuoteStatsController.getAllStats);

// GET /api/quotes/stats/monthly-count
router.get("/monthly-count", QuoteStatsController.getMonthlyCount);

// GET /api/quotes/stats/yearly-count
router.get("/yearly-count", QuoteStatsController.getYearlyCount);

// GET /api/quotes/stats/pending-count
router.get("/pending-count", QuoteStatsController.getPendingCount);

// GET /api/quotes/stats/accepted-count
router.get("/accepted-count", QuoteStatsController.getAcceptedCount);

// GET /api/quotes/stats/status-distribution
router.get("/status-distribution", QuoteStatsController.getStatusDistribution);

export default router;
