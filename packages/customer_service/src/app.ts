import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import customerRoutes from "./routes/customer.routes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3009;

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

app.use("/api/customer", customerRoutes);

app.listen(port, () => {
    console.log(`Customer service listening on port ${port}`);
});
