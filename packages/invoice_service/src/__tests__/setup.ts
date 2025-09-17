// Configuration globale pour les tests

// Mock des variables d'environnement
process.env.PDF_SERVICE_URL = "http://localhost:3006";
process.env.EMAIL_SERVICE_URL = "http://localhost:3007";
process.env.STRIPE_SERVICE_URL = "http://localhost:3008";

// Import des mocks
import "./mocks/prisma.mock";
import "./mocks/axios.mock";
