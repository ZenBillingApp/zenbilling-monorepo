import { Router } from "express";
import { CustomerController } from "../controllers/customer.controller";
import { authMiddleware, organizationRequired } from "@zenbilling/shared";
import { validateRequest } from "@zenbilling/shared";
import { createCustomerSchema, updateCustomerSchema } from "@zenbilling/shared";

const router = Router();

router.use(authMiddleware);

router.post(
    "/",
    organizationRequired,
    validateRequest(createCustomerSchema),
    CustomerController.createCustomer
);

router.get("/", organizationRequired, CustomerController.getCompanyCustomers);

router.get("/:id", organizationRequired, CustomerController.getCustomer);

router.put(
    "/:id",
    organizationRequired,
    validateRequest(updateCustomerSchema),
    CustomerController.updateCustomer
);

router.delete("/:id", organizationRequired, CustomerController.deleteCustomer);

export default router;
