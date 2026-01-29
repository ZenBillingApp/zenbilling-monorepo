import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { prisma, createHealthRouter, logger } from "@zenbilling/shared";
import productRoutes from "./routes/index.routes";

const app = express();
const port = process.env.PORT || 3008;

// Configure CORS middleware
app.use(
    cors({
        origin: [process.env.CLIENT_URL!, process.env.API_GATEWAY_URL!],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        credentials: true,
    })
);

// Health check routes (before body parsing)
app.use(
    createHealthRouter({
        serviceName: "product-service",
        version: "1.0.0",
        prisma,
    })
);

// Parse JSON bodies
app.use(express.json());

app.use("/api", productRoutes);

app.listen(port, () => {
    logger.info(`Product service listening on port ${port}`);
});
