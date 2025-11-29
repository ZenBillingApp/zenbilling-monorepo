import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { authMiddleware, organizationRequired } from "@zenbilling/shared";
import { validateRequest } from "@zenbilling/shared";
import { createProductSchema, updateProductSchema } from "@zenbilling/shared";

const router = Router();

router.use(authMiddleware, organizationRequired);

router.get("/units", ProductController.getAvailableUnits);

router.get("/vat-rates", ProductController.getAvailableVatRates);

router.post(
    "/",
    validateRequest(createProductSchema),
    ProductController.createProduct
);

router.get("/", ProductController.getCompanyProducts);

router.get("/:id", ProductController.getProduct);

router.put(
    "/:id",
    validateRequest(updateProductSchema),
    ProductController.updateProduct
);

router.delete("/:id", ProductController.deleteProduct);

export default router;
