import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import emailRoutes from "./routes/email.routes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3010;

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

// Parse JSON bodies with increased limit for PDF attachments
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/email", emailRoutes);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
