import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import companyRoutes from "./routes/company.routes";
import { logger } from "@zenbilling/shared";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

// Configure CORS middleware
app.use(
    cors({
        origin: [process.env.CLIENT_URL!, process.env.API_GATEWAY_URL!],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        credentials: true,
    })
);

// Middleware pour sécuriser les requêtes
app.use(helmet());

// Parse JSON bodies
app.use(express.json());

// Middleware pour limiter les requêtes
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Maximum 100 requêtes par IP par fenêtre
        message: {
            success: false,
            message: "Trop de requêtes. Veuillez réessayer plus tard.",
            error: "RATE_LIMIT_EXCEEDED",
        },
        standardHeaders: true,
        legacyHeaders: false,
    })
);

app.use("/api/company", companyRoutes);

app.listen(port, () => {
    logger.info(`📝 Service Company démarré sur le port ${port}`);
});
