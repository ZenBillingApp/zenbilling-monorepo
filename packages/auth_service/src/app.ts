import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import dotenv from "dotenv";
import userRoutes from "./routes/user.routes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Routes d'authentification Better Auth
app.all("/api/auth/*splat", toNodeHandler(auth));

// Parse JSON bodies
app.use(express.json());

// Routes utilisateur protégées
app.use("/api/user", userRoutes);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
