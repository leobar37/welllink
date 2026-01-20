import { defineConfig, devices } from "@playwright/test";
import path from "path";

export default defineConfig({
  // Directorio base del proyecto
  testDir: "./tests/e2e",

  // Configuración de timeout global
  timeout: 30000,
  globalTimeout: 600000,

  // Reporters disponibles: line, list, html, json, blob
  reporter: [["line"], ["html", { outputFolder: "playwright-report" }]],

  // Configuración de servidor web para tests E2E
  webServer: {
    command: "bun run dev",
    url: "http://localhost:5179",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  // Configuración global para todos los tests
  use: {
    // Base URL para navegación relativa
    baseURL: "http://localhost:5179",

    // Capturar screenshots en failure
    screenshot: "only-on-failure",

    // Grabar video en failure
    video: "retain-on-failure",

    // Trace en failure para debugging
    trace: "retain-on-failure",

    // Ignorar errores de HTTPS
    ignoreHTTPSErrors: true,
  },

  // Proyectos para diferentes navegadores
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  // Directorio para artifacts de test
  outputDir: "test-results/",

  // Snapshot directory
  snapshotDir: "tests/snapshots",
});
