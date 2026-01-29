import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { createHealthRouter, logger } from "@zenbilling/shared";
import emailRoutes from "./routes/email.routes";

const app = express();
const port = process.env.PORT || 3007;

// Configure CORS middleware
app.use(
    cors({
        origin: [process.env.CLIENT_URL!, process.env.API_GATEWAY_URL!],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        credentials: true,
    })
);

// Health check routes (no database for email service)
app.use(
    createHealthRouter({
        serviceName: "email-service",
        version: "1.0.0",
    })
);

// Parse JSON bodies with increased limit for PDF attachments
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/email", emailRoutes);

app.listen(port, () => {
    logger.info(`Email service listening on port ${port}`);
});
