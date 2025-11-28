import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import quoteRoutes from "./routes/quote.routes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3006;

// Configure CORS middleware
app.use(
    cors({
        origin: [process.env.CLIENT_URL!, process.env.API_GATEWAY_URL!],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        credentials: true,
    })
);

// Parse JSON bodies with increased limit for PDF processing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/quote", quoteRoutes);

app.listen(port, () => {
    console.log(`Quote service listening on port ${port}`);
});
