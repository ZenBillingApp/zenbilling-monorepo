import { createClient } from "redis";
import logger from "../utils/logger";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redisClient = createClient({
    url: redisUrl,
});

redisClient.on("error", (err: Error) => {
    console.log("Erreur Redis:", err);
    logger.error({ err }, "Erreur Redis");
});

redisClient.on("connect", () => {
    logger.info("Connexion Redis établie");
});

export const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch (error) {
        logger.error({ error }, "Impossible de se connecter à Redis");
        throw error;
    }
};

export default redisClient;
