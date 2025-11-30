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

router.use(authMiddleware);

router.post(
    "/",
    organizationRequired,
    validateRequest(createInvoiceSchema),
    InvoiceController.createInvoice
);

router.get(
    "/",
    organizationRequired,
    InvoiceController.getOrganizationInvoices
);

router.get(
    "/customer/:customerId",
    organizationRequired,
    InvoiceController.getCustomerInvoices
);

// More specific routes must come before general ones
router.get(
    "/:id/pdf",
    organizationRequired,
    InvoiceController.generateInvoicePdf
);

router.get("/:id", organizationRequired, InvoiceController.getInvoice);

router.put(
    "/:id",
    organizationRequired,
    validateRequest(updateInvoiceSchema),
    InvoiceController.updateInvoice
);

router.delete("/:id", organizationRequired, InvoiceController.deleteInvoice);

router.post(
    "/:id/payments",
    organizationRequired,
    validateRequest(createPaymentSchema),
    InvoiceController.createPayment
);

router.post(
    "/:id/send",
    organizationRequired,
    InvoiceController.sendInvoiceByEmail
);

router.post(
    "/:id/send-with-payment-link",
    organizationRequired,
    validateRequest(sendInvoiceWithPaymentLinkSchema),
    InvoiceController.sendInvoiceWithPaymentLink
);

export default router;
