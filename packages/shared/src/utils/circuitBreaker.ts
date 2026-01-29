import logger from "./logger";

/**
 * Circuit Breaker States
 */
export enum CircuitBreakerState {
    CLOSED = "CLOSED",
    OPEN = "OPEN",
    HALF_OPEN = "HALF_OPEN",
}

/**
 * Configuration for the Circuit Breaker
 */
export interface CircuitBreakerConfig {
    /** Number of failures before opening the circuit */
    failureThreshold: number;
    /** Time in ms to wait before transitioning from OPEN to HALF_OPEN */
    resetTimeout: number;
    /** Number of successful requests needed to close the circuit from HALF_OPEN */
    successThreshold: number;
    /** Name for logging purposes */
    name: string;
}

/**
 * Default configuration values
 */
const defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeout: 30000,
    successThreshold: 2,
    name: "unknown",
};

/**
 * Circuit Breaker implementation for resilient service calls
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Circuit is tripped, requests fail immediately
 * - HALF_OPEN: Testing state, limited requests allowed through
 */
export class CircuitBreaker {
    private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
    private failureCount: number = 0;
    private successCount: number = 0;
    private lastFailureTime: number = 0;
    private config: CircuitBreakerConfig;

    constructor(config: Partial<CircuitBreakerConfig> = {}) {
        this.config = { ...defaultConfig, ...config };
    }

    /**
     * Gets the current state of the circuit breaker
     */
    getState(): CircuitBreakerState {
        return this.state;
    }

    /**
     * Gets the current failure count
     */
    getFailureCount(): number {
        return this.failureCount;
    }

    /**
     * Checks if the circuit breaker should allow a request
     */
    canRequest(): boolean {
        if (this.state === CircuitBreakerState.CLOSED) {
            return true;
        }

        if (this.state === CircuitBreakerState.OPEN) {
            const now = Date.now();
            if (now - this.lastFailureTime >= this.config.resetTimeout) {
                this.transitionTo(CircuitBreakerState.HALF_OPEN);
                return true;
            }
            return false;
        }

        // HALF_OPEN: Allow limited requests
        return true;
    }

    /**
     * Records a successful request
     */
    recordSuccess(): void {
        if (this.state === CircuitBreakerState.HALF_OPEN) {
            this.successCount++;
            logger.debug(
                {
                    circuitBreaker: this.config.name,
                    successCount: this.successCount,
                    threshold: this.config.successThreshold,
                },
                "Circuit breaker success recorded"
            );

            if (this.successCount >= this.config.successThreshold) {
                this.transitionTo(CircuitBreakerState.CLOSED);
            }
        } else if (this.state === CircuitBreakerState.CLOSED) {
            // Reset failure count on success
            this.failureCount = 0;
        }
    }

    /**
     * Records a failed request
     */
    recordFailure(): void {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        logger.warn(
            {
                circuitBreaker: this.config.name,
                failureCount: this.failureCount,
                threshold: this.config.failureThreshold,
                state: this.state,
            },
            "Circuit breaker failure recorded"
        );

        if (this.state === CircuitBreakerState.HALF_OPEN) {
            // Any failure in HALF_OPEN state opens the circuit again
            this.transitionTo(CircuitBreakerState.OPEN);
        } else if (
            this.state === CircuitBreakerState.CLOSED &&
            this.failureCount >= this.config.failureThreshold
        ) {
            this.transitionTo(CircuitBreakerState.OPEN);
        }
    }

    /**
     * Transitions to a new state
     */
    private transitionTo(newState: CircuitBreakerState): void {
        const previousState = this.state;
        this.state = newState;

        if (newState === CircuitBreakerState.CLOSED) {
            this.failureCount = 0;
            this.successCount = 0;
        } else if (newState === CircuitBreakerState.HALF_OPEN) {
            this.successCount = 0;
        }

        logger.info(
            {
                circuitBreaker: this.config.name,
                previousState,
                newState,
            },
            `Circuit breaker state transition: ${previousState} -> ${newState}`
        );
    }

    /**
     * Executes a function with circuit breaker protection
     * @param fn - Async function to execute
     * @returns Promise with the function result
     * @throws Error if circuit is open or function fails
     */
    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (!this.canRequest()) {
            const timeUntilRetry = Math.max(
                0,
                this.config.resetTimeout - (Date.now() - this.lastFailureTime)
            );
            logger.warn(
                {
                    circuitBreaker: this.config.name,
                    state: this.state,
                    timeUntilRetry,
                },
                "Circuit breaker is open, rejecting request"
            );
            throw new CircuitBreakerOpenError(
                `Circuit breaker ${this.config.name} is open`,
                timeUntilRetry
            );
        }

        try {
            const result = await fn();
            this.recordSuccess();
            return result;
        } catch (error) {
            this.recordFailure();
            throw error;
        }
    }

    /**
     * Resets the circuit breaker to its initial state
     */
    reset(): void {
        this.state = CircuitBreakerState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = 0;

        logger.info(
            { circuitBreaker: this.config.name },
            "Circuit breaker reset"
        );
    }

    /**
     * Gets circuit breaker statistics
     */
    getStats(): CircuitBreakerStats {
        return {
            state: this.state,
            failureCount: this.failureCount,
            successCount: this.successCount,
            lastFailureTime: this.lastFailureTime,
            config: this.config,
        };
    }
}

/**
 * Statistics for circuit breaker monitoring
 */
export interface CircuitBreakerStats {
    state: CircuitBreakerState;
    failureCount: number;
    successCount: number;
    lastFailureTime: number;
    config: CircuitBreakerConfig;
}

/**
 * Error thrown when circuit breaker is open
 */
export class CircuitBreakerOpenError extends Error {
    public readonly timeUntilRetry: number;
    public readonly statusCode: number = 503;

    constructor(message: string, timeUntilRetry: number) {
        super(message);
        this.name = "CircuitBreakerOpenError";
        this.timeUntilRetry = timeUntilRetry;
    }
}

/**
 * Registry for managing multiple circuit breakers
 */
export class CircuitBreakerRegistry {
    private static breakers: Map<string, CircuitBreaker> = new Map();

    /**
     * Gets or creates a circuit breaker for a service
     */
    static getBreaker(
        name: string,
        config?: Partial<CircuitBreakerConfig>
    ): CircuitBreaker {
        if (!this.breakers.has(name)) {
            this.breakers.set(
                name,
                new CircuitBreaker({ ...config, name })
            );
        }
        return this.breakers.get(name)!;
    }

    /**
     * Gets all circuit breaker statistics
     */
    static getAllStats(): Record<string, CircuitBreakerStats> {
        const stats: Record<string, CircuitBreakerStats> = {};
        this.breakers.forEach((breaker, name) => {
            stats[name] = breaker.getStats();
        });
        return stats;
    }

    /**
     * Resets all circuit breakers
     */
    static resetAll(): void {
        this.breakers.forEach((breaker) => breaker.reset());
    }

    /**
     * Clears all circuit breakers (useful for tests)
     */
    static clear(): void {
        this.breakers.clear();
    }
}
