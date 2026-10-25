import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import { DEFAULT_APP_NAME } from "./src/brand";

// En desarrollo, las llamadas a /api se reenvían al backend. Así el navegador
// habla siempre con su propio origen y no hace falta CORS mientras el
// backend no lo tenga (ver "Pedidos al backend" en TODO.md).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.VITE_API_PROXY_TARGET || "http://localhost:3001";

  return {
    plugins: [
      react(),
      {
        // El título de la pestaña sale del mismo nombre que el resto de la app.
        name: "app-name-in-html",
        transformIndexHtml: (html: string) => html.replace("%APP_NAME%", env.VITE_APP_NAME?.trim() || DEFAULT_APP_NAME),
      },
    ],
    server: {
      proxy: {
        "/api": { target, changeOrigin: true, rewrite: (path: string) => path.replace(/^\/api/, "") },
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: "./src/test/setup.ts",
    },
  };
});
