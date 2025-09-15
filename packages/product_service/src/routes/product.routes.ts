import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { authMiddleware } from "@zenbilling/shared";
import { validateRequest } from "@zenbilling/shared";
import {
    createProductSchema,
    updateProductSchema,
} from "@zenbilling/shared";

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

export default router;
