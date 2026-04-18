/**
 * jest.config.js — Jest configuration for the ClearSpeech frontend tests.
 *
 * Uses next/jest to integrate Jest with Next.js (handles module aliases,
 * transforms, etc.). Tests run in a jsdom browser-like environment.
 */
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};

module.exports = createJestConfig(customJestConfig);
