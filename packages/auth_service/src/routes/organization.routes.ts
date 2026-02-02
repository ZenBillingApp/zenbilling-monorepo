import { Router } from "express";
import { OrganizationController } from "../controllers/organization.controller";
import { authMiddleware } from "@zenbilling/shared";

const router = Router();

// Routes pour les organisations (appels inter-services)
// Ces endpoints sont protégés par authMiddleware qui vérifie x-internal-secret
router.get("/find", authMiddleware, OrganizationController.findOrganization);
router.get("/:id", authMiddleware, OrganizationController.getOrganizationById);
router.patch("/:id", authMiddleware, OrganizationController.updateOrganization);

export default router;
