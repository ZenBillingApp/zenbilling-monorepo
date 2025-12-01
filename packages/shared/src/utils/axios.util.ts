import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
    AxiosError,
    InternalAxiosRequestConfig,
} from "axios";
import logger from "./logger";
import { CustomError } from "./customError";

export interface ServiceClientConfig {
    baseURL: string;
    serviceName: string;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}

/**
 * Crée une instance axios configurée pour les appels inter-services
 * @param config - Configuration du client de service
 * @returns Instance axios configurée
 */
export const createServiceClient = (
    config: ServiceClientConfig
): AxiosInstance => {
    const {
        baseURL,
        serviceName,
        timeout = 30000,
        retries = 3,
        retryDelay = 1000,
    } = config;

    const instance = axios.create({
        baseURL,
        timeout,
        headers: {
            "Content-Type": "application/json",
        },
        withCredentials: true,
    });

    // Intercepteur de requête - Logging et ajout d'informations
    instance.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            const requestId = `${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)}`;
            config.headers.set("X-Request-ID", requestId);

            logger.debug(
                {
                    serviceName,
                    method: config.method?.toUpperCase(),
                    url: config.url,
                    requestId,
                },
                `Appel vers ${serviceName}`
            );

            return config;
        },
        (error: AxiosError) => {
            logger.error(
                {
                    serviceName,
                    error: error.message,
                },
                `Erreur de configuration de la requête vers ${serviceName}`
            );
            return Promise.reject(error);
        }
    );

    // Intercepteur de réponse - Logging et gestion des erreurs
    instance.interceptors.response.use(
        (response: AxiosResponse) => {
            const requestId = response.config.headers.get("X-Request-ID");
            logger.debug(
                {
                    serviceName,
                    status: response.status,
                    requestId,
                },
                `Réponse réussie de ${serviceName}`
            );
            return response;
        },
        async (error: AxiosError) => {
            const originalRequest = error.config as InternalAxiosRequestConfig & {
                _retry?: number;
            };

            // Logging détaillé de l'erreur
            if (error.response) {
                // Le serveur a répondu avec un code d'erreur
                logger.error(
                    {
                        serviceName,
                        status: error.response.status,
                        data: error.response.data,
                        url: originalRequest?.url,
                    },
                    `Erreur ${error.response.status} de ${serviceName}`
                );

                // Gestion des erreurs spécifiques
                if (error.response.status === 401) {
                    throw new CustomError("Non autorisé", 401);
                } else if (error.response.status === 403) {
                    throw new CustomError("Accès interdit", 403);
                } else if (error.response.status === 404) {
                    throw new CustomError("Ressource non trouvée", 404);
                } else if (error.response.status >= 500) {
                    // Retry logic pour les erreurs serveur (5xx)
                    if (originalRequest && !originalRequest._retry) {
                        originalRequest._retry = 0;
                    }

                    if (
                        originalRequest &&
                        originalRequest._retry !== undefined &&
                        originalRequest._retry < retries
                    ) {
                        originalRequest._retry++;
                        logger.warn(
                            {
                                serviceName,
                                attempt: originalRequest._retry,
                                maxRetries: retries,
                            },
                            `Nouvelle tentative vers ${serviceName}`
                        );

                        // Attendre avant de réessayer
                        await new Promise((resolve) =>
                            setTimeout(resolve, retryDelay * originalRequest._retry!)
                        );

                        return instance(originalRequest);
                    }

                    throw new CustomError(
                        `Erreur serveur de ${serviceName}`,
                        error.response.status
                    );
                }
            } else if (error.request) {
                // La requête a été envoyée mais aucune réponse n'a été reçue
                logger.error(
                    {
                        serviceName,
                        error: error.message,
                        url: originalRequest?.url,
                    },
                    `Aucune réponse de ${serviceName}`
                );

                throw new CustomError(
                    `Service ${serviceName} injoignable`,
                    503
                );
            } else {
                // Erreur lors de la configuration de la requête
                logger.error(
                    {
                        serviceName,
                        error: error.message,
                    },
                    `Erreur de configuration de la requête vers ${serviceName}`
                );

                throw new CustomError(
                    `Erreur de configuration de la requête vers ${serviceName}`,
                    500
                );
            }

            throw error;
        }
    );

    return instance;
};

/**
 * Utilitaire pour créer des clients de service pré-configurés
 */
export class ServiceClients {
    private static clients: Map<string, AxiosInstance> = new Map();

    /**
     * Obtient ou crée un client pour un service
     * @param serviceName - Nom du service
     * @param baseURL - URL de base du service (optionnel si déjà configuré)
     * @returns Instance axios pour le service
     */
    static getClient(serviceName: string, baseURL?: string): AxiosInstance {
        const key = serviceName.toLowerCase();

        if (!this.clients.has(key)) {
            if (!baseURL) {
                const envKey = `${serviceName.toUpperCase()}_URL`;
                baseURL = process.env[envKey];

                if (!baseURL) {
                    throw new CustomError(
                        `Variable d'environnement ${envKey} non définie`,
                        500
                    );
                }
            }

            this.clients.set(
                key,
                createServiceClient({
                    baseURL,
                    serviceName,
                })
            );
        }

        return this.clients.get(key)!;
    }

    /**
     * Client pour le service d'email
     */
    static get email(): AxiosInstance {
        return this.getClient("email_service", process.env.EMAIL_SERVICE_URL);
    }

    /**
     * Client pour le service PDF
     */
    static get pdf(): AxiosInstance {
        return this.getClient("pdf_service", process.env.PDF_SERVICE_URL);
    }

    /**
     * Client pour le service Stripe
     */
    static get stripe(): AxiosInstance {
        return this.getClient("stripe_service", process.env.STRIPE_SERVICE_URL);
    }

    /**
     * Client pour le service AI
     */
    static get ai(): AxiosInstance {
        return this.getClient("ai_service", process.env.AI_SERVICE_URL);
    }

    /**
     * Client pour le service de produits
     */
    static get product(): AxiosInstance {
        return this.getClient("product_service", process.env.PRODUCT_SERVICE_URL);
    }

    /**
     * Client pour le service de clients
     */
    static get customer(): AxiosInstance {
        return this.getClient("customer_service", process.env.CUSTOMER_SERVICE_URL);
    }

    /**
     * Client pour le service de factures
     */
    static get invoice(): AxiosInstance {
        return this.getClient("invoice_service", process.env.INVOICE_SERVICE_URL);
    }

    /**
     * Client pour le service de devis
     */
    static get quote(): AxiosInstance {
        return this.getClient("quote_service", process.env.QUOTE_SERVICE_URL);
    }

    /**
     * Client pour le service de dashboard
     */
    static get dashboard(): AxiosInstance {
        return this.getClient("dashboard_service", process.env.DASHBOARD_SERVICE_URL);
    }

    /**
     * Réinitialise tous les clients (utile pour les tests)
     */
    static reset(): void {
        this.clients.clear();
    }
}
