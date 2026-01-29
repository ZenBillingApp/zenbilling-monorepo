import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { logger, createHealthRouter } from "@zenbilling/shared";
import aiRoutes from "./routes/ai.routes";

const app = express();
const port = process.env.PORT || 3011; // Port unique pour le service AI

// Sécurité avec Helmet
app.use(
    helmet({
        contentSecurityPolicy: false, // Désactivé pour l'API
    })
);

// Configure CORS middleware
app.use(
    cors({
        origin: [process.env.CLIENT_URL!, process.env.API_GATEWAY_URL!],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        credentials: true,
    })
);

// Health check routes (no database for AI service)
app.use(
    createHealthRouter({
        serviceName: "ai-service",
        version: "1.0.0",
    })
);

// Logging des requêtes
app.use((req, res, next) => {
    logger.info({ ip: req.ip, userAgent: req.get("User-Agent") }, `${req.method} ${req.path}`);
    next();
});

// Parse JSON bodies avec limite plus élevée pour les prompts longs
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api/ai", aiRoutes);

// Middleware de gestion d'erreurs global
app.use(
    (
        error: any,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction
    ) => {
        logger.error({ err: error }, "Erreur non gérée");
        res.status(500).json({
            success: false,
            message: "Erreur interne du serveur",
            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
);

app.listen(port, () => {
    logger.info(`🤖 Service AI démarré sur le port ${port}`);
});
