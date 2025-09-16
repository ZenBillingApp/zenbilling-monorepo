import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pdfRoutes from "./routes/pdf.routes";

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

// Parse JSON bodies
app.use(express.json());

app.use("/api/pdf", pdfRoutes);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
