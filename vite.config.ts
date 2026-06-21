import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

function replitEnvPlugin(): Plugin {
  return {
    name: "replit-env-inject",
    enforce: "post",
    config() {
      const define: Record<string, string> = {};
      for (const [key, value] of Object.entries(process.env)) {
        if (key.startsWith("VITE_") && value !== undefined) {
          // Strip surrounding quotes that may have been preserved from .env or secrets
          const trimmed = value.trim();
          const clean = trimmed.replace(/^["'](.*)["']$/, "$1").trim();
          define[`import.meta.env.${key}`] = JSON.stringify(clean);
        }
      }
      return { define };
    },
  };
}

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  envDefine: false,
  vite: {
    plugins: [replitEnvPlugin()],
    server: {
      host: "0.0.0.0",
      port: 5000,
      strictPort: true,
      allowedHosts: true,
      hmr: {
        clientPort: 443,
      },
    },
  },
});
