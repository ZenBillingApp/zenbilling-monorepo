import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { organizationRequired } from "@zenbilling/shared";
import { validateRequest } from "@zenbilling/shared";
import { createProductSchema, updateProductSchema } from "@zenbilling/shared";

const router = Router();

router.get("/units", ProductController.getAvailableUnits);

router.get("/vat-rates", ProductController.getAvailableVatRates);

router.post(
    "/",
    organizationRequired,
    validateRequest(createProductSchema),
    ProductController.createProduct
);

router.get("/", organizationRequired, ProductController.getCompanyProducts);

router.get("/:id", organizationRequired, ProductController.getProduct);

router.put(
    "/:id",
    organizationRequired,
    validateRequest(updateProductSchema),
    ProductController.updateProduct
);

router.delete("/:id", organizationRequired, ProductController.deleteProduct);

export default router;
