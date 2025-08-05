import { Router } from "express";
import { PdfController } from "../controllers/pdf.controller";

const router = Router();

router.post("/invoice", PdfController.generateInvoicePdf);
router.post("/quote", PdfController.generateQuotePdf);

export default router;
