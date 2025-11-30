import { Router } from "express";
import { PdfController } from "../controllers/pdf.controller";
import { authMiddleware } from "@zenbilling/shared";

const router = Router();

router.use(authMiddleware);

router.post("/invoice", PdfController.generateInvoicePdf);
router.post("/quote", PdfController.generateQuotePdf);

export default router;
