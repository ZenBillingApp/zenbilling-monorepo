import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import { logger } from "@zenbilling/shared";
import aiRoutes from "./routes/ai.routes";

dotenv.config();

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
        origin: ["http://localhost:3000", "http://localhost:8080"],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        credentials: true,
    })
);

// Logging des requêtes
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
    });
    next();
});

// Parse JSON bodies avec limite plus élevée pour les prompts longs
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api/ai", aiRoutes);

// Route racine pour vérifier le statut
app.get("/", (_req, res) => {
    res.json({
        service: "AI Service",
        status: "running",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
    });
});

// Middleware de gestion d'erreurs global
app.use(
    (
        error: any,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction
    ) => {
        logger.error("Erreur non gérée:", error);
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

// Middleware pour les routes non trouvées
app.use("*splat", (req, res) => {
    res.status(404).json({
        success: false,
        message: "Route non trouvée",
        path: req.originalUrl,
    });
});

app.listen(port, () => {
    logger.info(`🤖 Service AI démarré sur le port ${port}`);
});
