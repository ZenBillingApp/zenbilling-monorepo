import { Router } from "express";
import { InvoiceStatsController } from "../controllers/invoice.stats.controller";
import { authMiddleware, organizationRequired } from "@zenbilling/shared";

const router = Router();

// Toutes les routes stats sont protégées par authMiddleware (vérifie x-internal-secret)
router.use(authMiddleware);
router.use(organizationRequired);

// GET /api/invoices/stats/all - Toutes les stats en une seule requête (optimisé)
router.get("/all", InvoiceStatsController.getAllStats);

// GET /api/invoices/stats/monthly-revenue
router.get("/monthly-revenue", InvoiceStatsController.getMonthlyRevenue);

// GET /api/invoices/stats/yearly-revenue
router.get("/yearly-revenue", InvoiceStatsController.getYearlyRevenue);

// GET /api/invoices/stats/pending-count
router.get("/pending-count", InvoiceStatsController.getPendingCount);

// GET /api/invoices/stats/overdue-count
router.get("/overdue-count", InvoiceStatsController.getOverdueCount);

// GET /api/invoices/stats/paid-count
router.get("/paid-count", InvoiceStatsController.getPaidCount);

// GET /api/invoices/stats/status-distribution
router.get("/status-distribution", InvoiceStatsController.getStatusDistribution);

export default router;
