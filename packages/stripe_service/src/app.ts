import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import stripeRoutes from "./routes/stripe.routes";

dotenv.config();

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

// Health check endpoint for Docker
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});

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
    console.log(`Example app listening on port ${port}`);
});
