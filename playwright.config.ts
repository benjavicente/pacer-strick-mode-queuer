import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  workers: 1,
  reporter: "list",
  use: { ...devices["Desktop Chrome"], trace: "retain-on-failure" },
  webServer: [
    {
      command:
        "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5175 --strictPort",
      url: "http://127.0.0.1:5175",
    },
    {
      command:
        "node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4175 --strictPort",
      url: "http://127.0.0.1:4175",
    },
    {
      command:
        "node node_modules/vite/bin/vite.js preview --mode reproduction --host 127.0.0.1 --port 4176 --strictPort",
      url: "http://127.0.0.1:4176/pacer-strick-mode-queuer/",
    },
  ],
  projects: [
    { name: "development", use: { baseURL: "http://127.0.0.1:5175" } },
    { name: "production", use: { baseURL: "http://127.0.0.1:4175" } },
    {
      name: "pages",
      use: { baseURL: "http://127.0.0.1:4176/pacer-strick-mode-queuer/" },
    },
  ],
});
