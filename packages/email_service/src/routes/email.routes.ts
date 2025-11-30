import { Router } from "express";
import { EmailController } from "../controllers/email.controller";
import { authMiddleware } from "@zenbilling/shared";

const router = Router();

router.use(authMiddleware);

router.post("/send", EmailController.sendEmail);
router.post("/send-template", EmailController.sendTemplateEmail);
router.post("/send-with-attachment", EmailController.sendEmailWithAttachment);

export default router;
