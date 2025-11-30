import { Router } from "express";
import aiRoutes from "./ai.routes";
import productRoutes from "./product.routes";
import { authMiddleware } from "@zenbilling/shared";

const router = Router();

router.use("/product", authMiddleware, productRoutes, aiRoutes);

export default router;
