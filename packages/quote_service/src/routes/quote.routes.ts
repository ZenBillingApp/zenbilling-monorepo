import { Router } from "express";
import { QuoteController } from "../controllers/quote.controller";
import { authMiddleware, organizationRequired } from "@zenbilling/shared";
import { validateRequest } from "@zenbilling/shared";
import { createQuoteSchema, updateQuoteSchema } from "@zenbilling/shared";

const router = Router();

router.use(authMiddleware);

router.post(
    "/",
    organizationRequired,
    validateRequest(createQuoteSchema),
    QuoteController.createQuote
);

router.get("/", organizationRequired, QuoteController.getOrganizationQuotes);
router.get(
    "/customer/:customerId",
    organizationRequired,
    QuoteController.getCustomerQuotes
);
router.get("/:id", organizationRequired, QuoteController.getQuote);
router.put(
    "/:id",
    organizationRequired,
    validateRequest(updateQuoteSchema),
    QuoteController.updateQuote
);

router.delete("/:id", organizationRequired, QuoteController.deleteQuote);

router.get("/:id/pdf", organizationRequired, QuoteController.downloadQuotePdf);

router.post(
    "/:id/send",
    organizationRequired,
    QuoteController.sendQuoteByEmail
);

export default router;
