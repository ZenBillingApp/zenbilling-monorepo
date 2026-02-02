import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { prisma, createHealthRouter, logger } from "@zenbilling/shared";
import customerRoutes from "./routes/customer.routes";
import customerStatsRoutes from "./routes/customer.stats.routes";

const app = express();
const port = process.env.PORT || 3009;

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
        serviceName: "customer-service",
        version: "1.0.0",
        prisma,
    })
);

// Parse JSON bodies
app.use(express.json());

// Routes principales
app.use("/api/customers", customerRoutes);

// Routes de statistiques (pour appels inter-services)
app.use("/api/customers/stats", customerStatsRoutes);

app.listen(port, () => {
    logger.info(`Customer service listening on port ${port}`);
});
