import { Router } from "express";
import { QuoteController } from "../controllers/quote.controller";
import { authMiddleware } from "@zenbilling/shared/src/middlewares/auth.middleware";
import { validateRequest } from "@zenbilling/shared/src/middlewares/validation.middleware";
import {
    createQuoteSchema,
    updateQuoteSchema,
} from "@zenbilling/shared/src/validations/quote.validation";

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

// router.post(
//     "/:id/send",
//     authMiddleware,
//     QuoteController.sendQuoteByEmail
// );

export default router;
