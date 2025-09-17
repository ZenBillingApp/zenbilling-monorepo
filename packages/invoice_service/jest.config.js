module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/src"],
    testMatch: ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],
    testPathIgnorePatterns: [
        "/node_modules/",
        "/__tests__/mocks/",
        "/__tests__/setup.ts",
    ],
    transform: {
        "^.+\\.ts$": "ts-jest",
    },
    collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/app.ts"],
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov", "html"],
    setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
    moduleNameMapping: {
        "^@zenbilling/shared$": "<rootDir>/../shared/src/index.ts",
    },
    testTimeout: 10000,
};
