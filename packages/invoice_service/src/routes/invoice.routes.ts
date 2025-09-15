import { Router } from "express";
import { InvoiceController } from "../controllers/invoice.controller";
import { authMiddleware } from "@zenbilling/shared";
import { validateRequest } from "@zenbilling/shared";
import {
    createInvoiceSchema,
    updateInvoiceSchema,
    createPaymentSchema,
    sendInvoiceWithPaymentLinkSchema,
} from "@zenbilling/shared";

const router = Router();

router.post(
    "/",
    authMiddleware,
    validateRequest(createInvoiceSchema),
    InvoiceController.createInvoice
);

router.get("/", authMiddleware, InvoiceController.getCompanyInvoices);

router.get(
    "/customer/:customerId",
    authMiddleware,
    InvoiceController.getCustomerInvoices
);

// More specific routes must come before general ones
router.get("/:id/pdf", authMiddleware, InvoiceController.generateInvoicePdf);

router.get("/:id", authMiddleware, InvoiceController.getInvoice);

router.put(
    "/:id",
    authMiddleware,
    validateRequest(updateInvoiceSchema),
    InvoiceController.updateInvoice
);

router.delete("/:id", authMiddleware, InvoiceController.deleteInvoice);

router.post(
    "/:id/payments",
    authMiddleware,
    validateRequest(createPaymentSchema),
    InvoiceController.createPayment
);

router.post("/:id/send", authMiddleware, InvoiceController.sendInvoiceByEmail);

router.post(
    "/:id/send-with-payment-link",
    authMiddleware,
    validateRequest(sendInvoiceWithPaymentLinkSchema),
    InvoiceController.sendInvoiceWithPaymentLink
);

export default router;
