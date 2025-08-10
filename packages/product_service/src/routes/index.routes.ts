import { Router } from "express";
import aiRoutes from "./ai.routes";
import productRoutes from "./product.routes";

const router = Router();

router.use("/product", productRoutes, aiRoutes);

export default router;
