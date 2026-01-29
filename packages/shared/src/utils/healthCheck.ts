import { Request, Response, Router } from "express";
import { PrismaClient } from "@prisma/client";
import logger from "./logger";
import { CircuitBreakerRegistry } from "./circuitBreaker";

/**
 * Health check response interface
 */
export interface HealthCheckResponse {
    status: "healthy" | "unhealthy" | "degraded";
    service: string;
    version: string;
    timestamp: string;
    uptime: number;
    checks?: Record<string, HealthCheckResult>;
}

/**
 * Individual health check result
 */
export interface HealthCheckResult {
    status: "pass" | "fail" | "warn";
    message?: string;
    latency?: number;
}

/**
 * Configuration for health check routes
 */
export interface HealthCheckConfig {
    serviceName: string;
    version: string;
    prisma?: PrismaClient;
    customChecks?: Record<string, () => Promise<HealthCheckResult>>;
}

const startTime = Date.now();

/**
 * Creates Express router with health check endpoints
 *
 * Endpoints:
 * - GET /health/live - Liveness probe (is the process running?)
 * - GET /health/ready - Readiness probe (can the service handle requests?)
 * - GET /health - Combined health status with detailed checks
 *
 * @param config - Health check configuration
 * @returns Express Router with health endpoints
 */
export function createHealthRouter(config: HealthCheckConfig): Router {
    const router = Router();
    const { serviceName, version, prisma, customChecks = {} } = config;

    /**
     * Liveness probe - Simple check if the process is running
     * Used by Kubernetes/Docker to determine if the container should be restarted
     */
    router.get("/health/live", (_req: Request, res: Response) => {
        res.status(200).json({
            status: "healthy",
            service: serviceName,
            timestamp: new Date().toISOString(),
        });
    });

    /**
     * Readiness probe - Check if the service can handle requests
     * Used by load balancers to determine if traffic should be routed to this instance
     */
    router.get("/health/ready", async (_req: Request, res: Response) => {
        const checks: Record<string, HealthCheckResult> = {};
        let overallStatus: "healthy" | "unhealthy" | "degraded" = "healthy";

        // Database check (if Prisma is provided)
        if (prisma) {
            const dbCheck = await checkDatabase(prisma);
            checks.database = dbCheck;
            if (dbCheck.status === "fail") {
                overallStatus = "unhealthy";
            }
        }

        // Circuit breaker check
        const circuitBreakerCheck = checkCircuitBreakers();
        checks.circuitBreakers = circuitBreakerCheck;
        if (circuitBreakerCheck.status === "warn" && overallStatus === "healthy") {
            overallStatus = "degraded";
        }

        // Run custom checks
        for (const [name, checkFn] of Object.entries(customChecks)) {
            try {
                checks[name] = await checkFn();
                if (checks[name].status === "fail" && overallStatus !== "unhealthy") {
                    overallStatus = "unhealthy";
                } else if (checks[name].status === "warn" && overallStatus === "healthy") {
                    overallStatus = "degraded";
                }
            } catch (error) {
                checks[name] = {
                    status: "fail",
                    message: error instanceof Error ? error.message : "Unknown error",
                };
                overallStatus = "unhealthy";
            }
        }

        const statusCode = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503;

        res.status(statusCode).json({
            status: overallStatus,
            service: serviceName,
            version,
            timestamp: new Date().toISOString(),
            uptime: Math.floor((Date.now() - startTime) / 1000),
            checks,
        } as HealthCheckResponse);
    });

    /**
     * Combined health endpoint - Detailed health status
     */
    router.get("/health", async (_req: Request, res: Response) => {
        const checks: Record<string, HealthCheckResult> = {};
        let overallStatus: "healthy" | "unhealthy" | "degraded" = "healthy";

        // Database check
        if (prisma) {
            const dbCheck = await checkDatabase(prisma);
            checks.database = dbCheck;
            if (dbCheck.status === "fail") {
                overallStatus = "unhealthy";
            }
        }

        // Circuit breaker check
        const circuitBreakerCheck = checkCircuitBreakers();
        checks.circuitBreakers = circuitBreakerCheck;
        if (circuitBreakerCheck.status === "warn" && overallStatus === "healthy") {
            overallStatus = "degraded";
        }

        // Memory check
        checks.memory = checkMemory();

        // Run custom checks
        for (const [name, checkFn] of Object.entries(customChecks)) {
            try {
                checks[name] = await checkFn();
                if (checks[name].status === "fail" && overallStatus !== "unhealthy") {
                    overallStatus = "unhealthy";
                } else if (checks[name].status === "warn" && overallStatus === "healthy") {
                    overallStatus = "degraded";
                }
            } catch (error) {
                checks[name] = {
                    status: "fail",
                    message: error instanceof Error ? error.message : "Unknown error",
                };
                overallStatus = "unhealthy";
            }
        }

        const statusCode = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503;

        res.status(statusCode).json({
            status: overallStatus,
            service: serviceName,
            version,
            timestamp: new Date().toISOString(),
            uptime: Math.floor((Date.now() - startTime) / 1000),
            checks,
        } as HealthCheckResponse);
    });

    return router;
}

/**
 * Checks database connectivity
 */
async function checkDatabase(prisma: PrismaClient): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
        await prisma.$queryRaw`SELECT 1`;
        const latency = Date.now() - start;

        if (latency > 1000) {
            return {
                status: "warn",
                message: `High latency: ${latency}ms`,
                latency,
            };
        }

        return {
            status: "pass",
            message: "Connected",
            latency,
        };
    } catch (error) {
        logger.error({ err: error }, "Database health check failed");
        return {
            status: "fail",
            message: error instanceof Error ? error.message : "Connection failed",
            latency: Date.now() - start,
        };
    }
}

/**
 * Checks circuit breaker states
 */
function checkCircuitBreakers(): HealthCheckResult {
    const stats = CircuitBreakerRegistry.getAllStats();
    const entries = Object.entries(stats);

    if (entries.length === 0) {
        return {
            status: "pass",
            message: "No circuit breakers registered",
        };
    }

    const openBreakers = entries.filter(([_, s]) => s.state === "OPEN");
    const halfOpenBreakers = entries.filter(([_, s]) => s.state === "HALF_OPEN");

    if (openBreakers.length > 0) {
        return {
            status: "warn",
            message: `${openBreakers.length} circuit breaker(s) open: ${openBreakers.map(([n]) => n).join(", ")}`,
        };
    }

    if (halfOpenBreakers.length > 0) {
        return {
            status: "pass",
            message: `${halfOpenBreakers.length} circuit breaker(s) recovering`,
        };
    }

    return {
        status: "pass",
        message: `All ${entries.length} circuit breaker(s) closed`,
    };
}

/**
 * Checks memory usage
 */
function checkMemory(): HealthCheckResult {
    const used = process.memoryUsage();
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
    const percentUsed = Math.round((used.heapUsed / used.heapTotal) * 100);

    if (percentUsed > 90) {
        return {
            status: "warn",
            message: `High memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB (${percentUsed}%)`,
        };
    }

    return {
        status: "pass",
        message: `${heapUsedMB}MB / ${heapTotalMB}MB (${percentUsed}%)`,
    };
}
