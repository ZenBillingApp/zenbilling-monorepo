import pino from "pino";
import fs from "fs";
import path from "path";

// Création du dossier logs s'il n'existe pas
const logDirectory = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}

// Configuration du logger
const logger = pino({
    transport: {
        targets: [
            // Transport pour la console
            {
                target: "pino-pretty",
                level: process.env.NODE_ENV === "production" ? "info" : "debug",
                options: {
                    colorize: true,
                    translateTime: "SYS:standard",
                    ignore: "pid,hostname",
                },
            },
            // Transport pour le fichier
            {
                target: "pino/file",
                level: "info",
                options: {
                    destination: path.join(logDirectory, "app.log"),
                    mkdir: true,
                },
            },
        ],
    },
});

export default logger;
