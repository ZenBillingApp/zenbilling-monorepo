import { Router } from "express";
import { QuoteController } from "../controllers/quote.controller";
import { authMiddleware, organizationRequired } from "@zenbilling/shared";
import { validateRequest } from "@zenbilling/shared";
import { createQuoteSchema, updateQuoteSchema } from "@zenbilling/shared";

const router = Router();

router.use(authMiddleware, organizationRequired);

router.post(
    "/",
    validateRequest(createQuoteSchema),
    QuoteController.createQuote
);

router.get("/", QuoteController.getCompanyQuotes);

router.get("/customer/:customerId", QuoteController.getCustomerQuotes);

router.get("/:id", QuoteController.getQuote);

// router.get("/:id/pdf", authMiddleware, QuoteController.downloadQuotePdf);

router.put(
    "/:id",
    validateRequest(updateQuoteSchema),
    QuoteController.updateQuote
);

router.delete("/:id", QuoteController.deleteQuote);

router.get("/:id/pdf", QuoteController.downloadQuotePdf);

router.post("/:id/send", QuoteController.sendQuoteByEmail);

export default router;
