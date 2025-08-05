import { Router } from "express";
import { CustomerController } from "../controllers/customer.controller";
import { authMiddleware } from "@zenbilling/shared/src/middlewares/auth.middleware";
import { validateRequest } from "@zenbilling/shared/src/middlewares/validation.middleware";
import {
    createCustomerSchema,
    updateCustomerSchema,
} from "@zenbilling/shared/src/validations/customer.validation";

const router = Router();

router.post(
    "/",
    authMiddleware,
    validateRequest(createCustomerSchema),
    CustomerController.createCustomer
);

router.get("/", authMiddleware, CustomerController.getCompanyCustomers);

router.get("/:id", authMiddleware, CustomerController.getCustomer);

router.put(
    "/:id",
    authMiddleware,
    validateRequest(updateCustomerSchema),
    CustomerController.updateCustomer
);

router.delete("/:id", authMiddleware, CustomerController.deleteCustomer);

export default router;
