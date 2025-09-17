import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/user.routes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Configure CORS middleware FIRST
const corsOptions = {
    origin: [
        "http://localhost:3000",
        "https://zenbilling-dev.dynamicwebforge.fr",
        "https://zenbillingapi-dev.dynamicwebforge.fr",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
        "Cache-Control",
        "Pragma",
    ],
    exposedHeaders: ["Set-Cookie"],
    optionsSuccessStatus: 200,
    preflightContinue: false, // Important pour gérer les preflight
};

app.use(cors(corsOptions));

// Handler explicite pour les requêtes OPTIONS sur les routes auth
app.options("/api/auth/*", cors(corsOptions));

// Routes d'authentification Better Auth (AVANT express.json())
app.all("/api/auth/*", toNodeHandler(auth));

// Parse JSON bodies AFTER Better Auth handler
app.use(express.json());

// Routes utilisateur protégées
app.use("/api/user", userRoutes);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
