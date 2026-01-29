import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { prisma, createHealthRouter, logger } from "@zenbilling/shared";
import stripeRoutes from "./routes/stripe.routes";

const app = express();
const port = process.env.PORT || 3003;

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
        serviceName: "stripe-service",
        version: "1.0.0",
        prisma,
    })
);

// Route pour Stripe Webhook - doit être avant bodyParser
app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    (req, res) => {
        const {
            handleWebhook,
        } = require("./controllers/stripe-webhook.controller");
        handleWebhook(req, res);
    }
);

// Parse JSON bodies
app.use(express.json());

app.use("/api/stripe", stripeRoutes);

app.listen(port, () => {
    logger.info(`Stripe service listening on port ${port}`);
});
