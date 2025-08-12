import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/profile", authMiddleware, UserController.getProfile);
router.put("/profile", authMiddleware, UserController.updateProfile);
router.delete("/profile", authMiddleware, UserController.deleteProfile);
router.post(
    "/onboarding-finish",
    authMiddleware,
    UserController.onboardingFinish
);

export default router;
