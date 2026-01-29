import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth, prisma, createHealthRouter, logger } from "@zenbilling/shared";
import cors from "cors";
import userRoutes from "./routes/user.routes";

const app = express();
const port = process.env.PORT || 3001;

const corsOptions = {
    origin: [process.env.CLIENT_URL!, process.env.API_GATEWAY_URL!],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
};

app.use(cors(corsOptions));

// Health check routes (before auth routes)
app.use(
    createHealthRouter({
        serviceName: "auth-service",
        version: "1.0.0",
        prisma,
    })
);

// Routes d'authentification Better Auth
app.all("/api/auth/*splat", toNodeHandler(auth));

// Parse JSON bodies
app.use(express.json());

// Routes utilisateur protégées
app.use("/api/user", userRoutes);

app.listen(port, () => {
    logger.info(`Auth service listening on port ${port}`);
});
