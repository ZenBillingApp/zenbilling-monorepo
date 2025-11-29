import { Router } from "express";
import { CustomerController } from "../controllers/customer.controller";
import { authMiddleware, organizationRequired } from "@zenbilling/shared";
import { validateRequest } from "@zenbilling/shared";
import { createCustomerSchema, updateCustomerSchema } from "@zenbilling/shared";

const router = Router();

router.use(authMiddleware, organizationRequired);

router.post(
    "/",
    validateRequest(createCustomerSchema),
    CustomerController.createCustomer
);

router.get("/", CustomerController.getCompanyCustomers);

router.get("/:id", CustomerController.getCustomer);

router.put(
    "/:id",
    validateRequest(updateCustomerSchema),
    CustomerController.updateCustomer
);

router.delete("/:id", CustomerController.deleteCustomer);

export default router;
