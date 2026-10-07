import { defineConfig } from "@playwright/test";
import "./tests/setup";
export default defineConfig({
  testDir: "tests/e2e",
  workers: 1,
  timeout: 120000,
  use: {
    actionTimeout: 30000,
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  globalSetup: "./tests/e2e/setup.ts",
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL!,
      DIRECT_URL: process.env.DIRECT_URL!,
      APP_URL: "http://localhost:3000",
      STORAGE_DRIVER: "local",
      LOCAL_STORAGE_PATH: ".local-storage/e2e",
      NEXT_TELEMETRY_DISABLED: "1",
      OPENROUTER_API_KEY: "",
      OPENROUTER_MODEL: "",
      OPENROUTER_ALLOW_PROVIDER_LOGGING: "false",
    },
  },
});
