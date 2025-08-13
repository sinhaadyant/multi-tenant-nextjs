module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests/e2e"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(e2e|integration).ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  setupFilesAfterEnv: ["<rootDir>/tests/e2e/setup.ts"],
  testTimeout: 30000,
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json",
    },
  },
  // E2E specific settings
  testSequencer: "<rootDir>/tests/e2e/sequencer.js",
  maxWorkers: 1, // Run tests sequentially for E2E
  bail: 1, // Stop on first failure
  verbose: true,
};
