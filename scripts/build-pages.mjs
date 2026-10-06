// Set this before loading Vite or its React plugin so the static bundle
// preserves the development-only StrictMode behavior being reproduced.
process.env.NODE_ENV = "development";
const { build } = await import("vite");
await build({ mode: "reproduction" });
