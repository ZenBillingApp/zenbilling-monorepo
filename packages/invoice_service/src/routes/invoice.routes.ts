import { Router } from "express";
import { InvoiceController } from "../controllers/invoice.controller";
import { authMiddleware, organizationRequired } from "@zenbilling/shared";
import { validateRequest } from "@zenbilling/shared";
import {
    createInvoiceSchema,
    updateInvoiceSchema,
    createPaymentSchema,
    sendInvoiceWithPaymentLinkSchema,
} from "@zenbilling/shared";

const router = Router();

router.use(authMiddleware, organizationRequired);

router.post(
    "/",
    validateRequest(createInvoiceSchema),
    InvoiceController.createInvoice
);

router.get("/", InvoiceController.getCompanyInvoices);

router.get("/customer/:customerId", InvoiceController.getCustomerInvoices);

// More specific routes must come before general ones
router.get("/:id/pdf", InvoiceController.generateInvoicePdf);

router.get("/:id", InvoiceController.getInvoice);

router.put(
    "/:id",
    validateRequest(updateInvoiceSchema),
    InvoiceController.updateInvoice
);

router.delete("/:id", InvoiceController.deleteInvoice);

router.post(
    "/:id/payments",
    validateRequest(createPaymentSchema),
    InvoiceController.createPayment
);

router.post("/:id/send", InvoiceController.sendInvoiceByEmail);

router.post(
    "/:id/send-with-payment-link",
    validateRequest(sendInvoiceWithPaymentLinkSchema),
    InvoiceController.sendInvoiceWithPaymentLink
);

export default router;
