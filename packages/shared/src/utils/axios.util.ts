import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
    AxiosError,
    InternalAxiosRequestConfig,
} from "axios";
import logger from "./logger";
import { CustomError } from "./customError";
import {
    CircuitBreaker,
    CircuitBreakerRegistry,
    CircuitBreakerOpenError,
    CircuitBreakerConfig,
} from "./circuitBreaker";

export interface UserContext {
    userId?: string;
    sessionId?: string;
    organizationId?: string;
    userEmail?: string;
    userName?: string;
}

export interface ServiceClientConfig {
    baseURL: string;
    serviceName: string;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    /** Enable circuit breaker for this client (default: true) */
    enableCircuitBreaker?: boolean;
    /** Circuit breaker configuration */
    circuitBreakerConfig?: Partial<CircuitBreakerConfig>;
    /** User context to propagate to the service (optional) */
    userContext?: UserContext;
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
        enableCircuitBreaker = true,
        circuitBreakerConfig,
        userContext,
    } = config;

    // Get or create circuit breaker for this service
    const circuitBreaker = enableCircuitBreaker
        ? CircuitBreakerRegistry.getBreaker(serviceName, {
              failureThreshold: 5,
              resetTimeout: 30000,
              successThreshold: 2,
              ...circuitBreakerConfig,
          })
        : null;

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

            // Injecter automatiquement le secret interne pour sécuriser les appels inter-services
            const internalSecret = process.env.INTERNAL_SHARED_SECRET;
            if (internalSecret) {
                config.headers.set("x-internal-secret", internalSecret);
            } else {
                logger.warn(
                    { serviceName },
                    "INTERNAL_SHARED_SECRET non défini - Les appels inter-services peuvent échouer"
                );
            }

            // Propager le contexte utilisateur si fourni
            if (userContext) {
                if (userContext.userId) {
                    config.headers.set("x-user-id", userContext.userId);
                }
                if (userContext.sessionId) {
                    config.headers.set("x-session-id", userContext.sessionId);
                }
                if (userContext.organizationId) {
                    config.headers.set(
                        "x-organization-id",
                        userContext.organizationId
                    );
                }
                if (userContext.userEmail) {
                    config.headers.set("x-user-email", userContext.userEmail);
                }
                if (userContext.userName) {
                    config.headers.set("x-user-name", userContext.userName);
                }
            }

            logger.debug(
                {
                    serviceName,
                    method: config.method?.toUpperCase(),
                    url: config.url,
                    requestId,
                    hasUserContext: !!userContext,
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

            // Record success for circuit breaker
            if (circuitBreaker) {
                circuitBreaker.recordSuccess();
            }

            return response;
        },
        async (error: AxiosError) => {
            const originalRequest = error.config as InternalAxiosRequestConfig & {
                _retry?: number;
                _circuitBreakerRecorded?: boolean;
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
                    // Record failure for circuit breaker (only once, not on retries)
                    if (
                        circuitBreaker &&
                        !originalRequest?._circuitBreakerRecorded
                    ) {
                        circuitBreaker.recordFailure();
                        if (originalRequest) {
                            originalRequest._circuitBreakerRecorded = true;
                        }
                    }

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

                // Record failure for circuit breaker (connection failures are critical)
                if (circuitBreaker) {
                    circuitBreaker.recordFailure();
                }

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

    // Intercepteur de requête pour vérifier le circuit breaker AVANT l'envoi
    if (circuitBreaker) {
        instance.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                if (!circuitBreaker.canRequest()) {
                    const stats = circuitBreaker.getStats();
                    const timeUntilRetry = Math.max(
                        0,
                        stats.config.resetTimeout -
                            (Date.now() - stats.lastFailureTime)
                    );
                    logger.warn(
                        {
                            serviceName,
                            state: stats.state,
                            timeUntilRetry,
                        },
                        `Circuit breaker ouvert pour ${serviceName}`
                    );
                    throw new CircuitBreakerOpenError(
                        `Circuit breaker pour ${serviceName} est ouvert`,
                        timeUntilRetry
                    );
                }
                return config;
            },
            (error) => Promise.reject(error)
        );
    }

    return instance;
};

/**
 * Extrait le contexte utilisateur depuis une requête Express
 * @param req - Requête Express (avec gatewayUser ou headers bruts)
 * @returns UserContext extrait
 */
const extractUserContext = (req: any): UserContext => {
    // Priorité à gatewayUser (après passage par authMiddleware)
    if (req.gatewayUser) {
        return {
            userId: req.gatewayUser.id,
            sessionId: req.gatewayUser.sessionId,
            organizationId: req.gatewayUser.organizationId,
        };
    }

    // Sinon, extraire directement des headers
    return {
        userId: req.headers?.["x-user-id"] as string,
        sessionId: req.headers?.["x-session-id"] as string,
        organizationId: req.headers?.["x-organization-id"] as string,
        userEmail: req.headers?.["x-user-email"] as string,
        userName: req.headers?.["x-user-name"] as string,
    };
};

/**
 * Utilitaire pour créer des clients de service pré-configurés
 *
 * @example
 * // Sans contexte utilisateur (appels internes sans auth)
 * const client = ServiceClients.getClient("email_service");
 * await client.post("/api/email/send", { to, subject, html });
 *
 * @example
 * // Avec contexte utilisateur (headers injectés automatiquement)
 * const client = ServiceClients.getClient("invoice_service", req);
 * const { data } = await client.get("/api/invoices/stats/all");
 */
export class ServiceClients {
    private static clients: Map<string, AxiosInstance> = new Map();

    /**
     * Résout l'URL de base d'un service depuis les variables d'environnement
     */
    private static resolveBaseURL(serviceName: string): string {
        const envKey = `${serviceName.toUpperCase()}_URL`;
        const baseURL = process.env[envKey];

        if (!baseURL) {
            throw new CustomError(
                `Variable d'environnement ${envKey} non définie`,
                500
            );
        }

        return baseURL;
    }

    /**
     * Obtient un client pour un service
     *
     * @param serviceName - Nom du service (ex: "invoice_service", "email_service")
     * @param req - Requête Express (optionnel). Si fourni, les headers d'authentification
     *              (x-user-id, x-session-id, x-organization-id) sont automatiquement injectés
     * @returns Instance axios configurée
     *
     * @example
     * // Dans un controller - avec propagation du contexte utilisateur
     * export const getInvoiceStats = async (req: Request, res: Response) => {
     *     const client = ServiceClients.getClient("invoice_service", req);
     *     const { data } = await client.get("/api/invoices/stats/all");
     *     res.json(data);
     * };
     *
     * @example
     * // Appel interne sans contexte utilisateur (ex: envoi d'email)
     * const client = ServiceClients.getClient("email_service");
     * await client.post("/api/email/send", { to, subject, html });
     */
    static getClient(serviceName: string, req?: any): AxiosInstance {
        const key = serviceName.toLowerCase();
        const baseURL = this.resolveBaseURL(serviceName);

        // Si une requête est fournie, créer un client avec contexte utilisateur
        // (pas de cache car le contexte change à chaque requête)
        if (req) {
            const userContext = extractUserContext(req);
            return createServiceClient({
                baseURL,
                serviceName,
                userContext,
            });
        }

        // Sans requête, utiliser le client en cache
        if (!this.clients.has(key)) {
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
     * Réinitialise tous les clients en cache (utile pour les tests)
     */
    static reset(): void {
        this.clients.clear();
    }
}
