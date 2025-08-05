import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { authMiddleware } from "@zenbilling/shared/src/middlewares/auth.middleware";
import { validateRequest } from "@zenbilling/shared/src/middlewares/validation.middleware";
import {
    createProductSchema,
    updateProductSchema,
} from "@zenbilling/shared/src/validations/product.validation";
// import {
//     generateDescriptionSchema,
//     generateDescriptionSuggestionsSchema,
// } from "@zenbilling/shared/src/validations/ai.validation";

const router = Router();

router.get("/units", ProductController.getAvailableUnits);

router.get("/vat-rates", ProductController.getAvailableVatRates);

router.post(
    "/",
    authMiddleware,
    validateRequest(createProductSchema),
    ProductController.createProduct
);

router.get("/", authMiddleware, ProductController.getCompanyProducts);

router.get("/:id", authMiddleware, ProductController.getProduct);

router.put(
    "/:id",
    authMiddleware,
    validateRequest(updateProductSchema),
    ProductController.updateProduct
);

router.delete("/:id", authMiddleware, ProductController.deleteProduct);

// // Routes IA pour génération de descriptions
// router.post(
//     "/generate-description",
//     authMiddleware,
//     validateRequest(generateDescriptionSchema),
//     ProductController.generateProductDescription
// );

// router.post(
//     "/generate-description-suggestions",
//     authMiddleware,
//     validateRequest(generateDescriptionSuggestionsSchema),
//     ProductController.generateProductDescriptionSuggestions
// );

export default router;
