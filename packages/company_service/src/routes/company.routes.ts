import { Router } from "express";
import { CompanyController } from "../controllers/company.controller";
import { validateRequest } from "@zenbilling/shared/src/middlewares/validation.middleware";
import { companySchema } from "@zenbilling/shared/src/validations/company.validation";
import { authMiddleware } from "@zenbilling/shared/src/middlewares/auth.middleware";

const router = Router();

router.post(
    "/",
    authMiddleware,
    validateRequest(companySchema),
    CompanyController.createCompany
);

router.get("/", authMiddleware, CompanyController.getCompany);

router.put(
    "/",
    authMiddleware,
    validateRequest(companySchema),
    CompanyController.updateCompany
);

router.get("/users", authMiddleware, CompanyController.getCompanyUsers);

router.get(
    "/legal-forms",
    authMiddleware,
    CompanyController.getAvailableLegalForms
);

export default router;
