import { Router } from "express";
import { InvoiceController } from "../controllers/invoice.controller";
import { authMiddleware } from "@zenbilling/shared/src/middlewares/auth.middleware";
import { validateRequest } from "@zenbilling/shared/src/middlewares/validation.middleware";
import {
    createInvoiceSchema,
    updateInvoiceSchema,
    createPaymentSchema,
    sendInvoiceWithPaymentLinkSchema,
} from "@zenbilling/shared/src/validations/invoice.validation";

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

router.get("/:id", authMiddleware, InvoiceController.getInvoice);

// router.get("/:id/pdf", authMiddleware, InvoiceController.downloadInvoicePdf);

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

// router.post(
//     "/:id/send-with-payment-link",
//     authMiddleware,
//     validateRequest(sendInvoiceWithPaymentLinkSchema),
//     InvoiceController.sendInvoiceByEmailWithPaymentLink
// );

router.get("/:id/pdf", authMiddleware, InvoiceController.generateInvoicePdf);

export default router;
