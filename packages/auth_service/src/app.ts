import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/user.routes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const corsOptions = {
    origin: [process.env.CLIENT_URL!, process.env.API_GATEWAY_URL!],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true,
};

app.use(cors(corsOptions));

// Routes d'authentification Better Auth
app.all("/api/auth/*splat", toNodeHandler(auth));

// Parse JSON bodies
app.use(express.json());

// Routes utilisateur protégées
app.use("/api/user", userRoutes);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
