import { Router } from "express";
import { QuoteController } from "../controllers/quote.controller";
import { authMiddleware } from "@zenbilling/shared";
import { validateRequest } from "@zenbilling/shared";
import {
    createQuoteSchema,
    updateQuoteSchema,
} from "@zenbilling/shared";

const router = Router();

router.post(
    "/",
    authMiddleware,
    validateRequest(createQuoteSchema),
    QuoteController.createQuote
);

router.get("/", authMiddleware, QuoteController.getCompanyQuotes);

router.get(
    "/customer/:customerId",
    authMiddleware,
    QuoteController.getCustomerQuotes
);

router.get("/:id", authMiddleware, QuoteController.getQuote);

// router.get("/:id/pdf", authMiddleware, QuoteController.downloadQuotePdf);

router.put(
    "/:id",
    authMiddleware,
    validateRequest(updateQuoteSchema),
    QuoteController.updateQuote
);

router.delete("/:id", authMiddleware, QuoteController.deleteQuote);

router.get("/:id/pdf", authMiddleware, QuoteController.downloadQuotePdf);

router.post("/:id/send", authMiddleware, QuoteController.sendQuoteByEmail);

export default router;
