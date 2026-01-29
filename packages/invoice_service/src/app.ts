import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { prisma, createHealthRouter, logger } from "@zenbilling/shared";
import invoiceRoutes from "./routes/invoice.routes";

const app = express();
const port = process.env.PORT || 3005;

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
        serviceName: "invoice-service",
        version: "1.0.0",
        prisma,
    })
);

// Parse JSON bodies with increased limit for PDF processing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/invoice", invoiceRoutes);

app.listen(port, () => {
    logger.info(`Invoice service listening on port ${port}`);
});
