import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { createHealthRouter, logger } from "@zenbilling/shared";
import pdfRoutes from "./routes/pdf.routes";

const app = express();
const port = process.env.PORT || 3010;

// Configure CORS middleware
app.use(
    cors({
        origin: [process.env.CLIENT_URL!, process.env.API_GATEWAY_URL!],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        credentials: true,
    })
);

// Health check routes (no database for PDF service)
app.use(
    createHealthRouter({
        serviceName: "pdf-service",
        version: "1.0.0",
    })
);

// Parse JSON bodies
app.use(express.json());

app.use("/api/pdf", pdfRoutes);

app.listen(port, () => {
    logger.info(`PDF service listening on port ${port}`);
});
