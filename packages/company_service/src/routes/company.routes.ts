import { Router } from "express";
import { CompanyController } from "../controllers/company.controller";
import { validateRequest } from "@zenbilling/shared";
import { companySchema } from "@zenbilling/shared";
import { authMiddleware } from "@zenbilling/shared";

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
