import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "game-day.spec.ts",
  timeout: 240000,
  workers: 1,
  outputDir: ".game-day/test-results",
  use: { baseURL: process.env.GAME_TEST_URL ?? "http://127.0.0.1:3000", actionTimeout: 10000, screenshot: "only-on-failure", trace: "retain-on-failure" },
});