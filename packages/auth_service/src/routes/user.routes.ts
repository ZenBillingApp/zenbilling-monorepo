import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authMiddleware } from "@zenbilling/shared";

const router = Router();

// Routes pour le profil de l'utilisateur connecté
router.get("/profile", authMiddleware, UserController.getProfile);
router.put("/profile", authMiddleware, UserController.updateProfile);
router.delete("/profile", authMiddleware, UserController.deleteProfile);

// Route pour récupérer un utilisateur par ID (pour les appels inter-services)
router.get("/:id", authMiddleware, UserController.getUserById);

export default router;
