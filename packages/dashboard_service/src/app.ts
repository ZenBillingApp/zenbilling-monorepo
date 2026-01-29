import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { prisma, createHealthRouter, logger } from "@zenbilling/shared";
import dashboardRoutes from "./routes/dashboard.routes";

const app = express();
const port = process.env.PORT || 3004;

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
        serviceName: "dashboard-service",
        version: "1.0.0",
        prisma,
    })
);

// Parse JSON bodies
app.use(express.json());

app.use("/api/dashboard", dashboardRoutes);

app.listen(port, () => {
    logger.info(`Dashboard service listening on port ${port}`);
});
