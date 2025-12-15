import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: "/mi-gestion-app/", // Raíz del proyecto
  publicDir: "assets", // Carpeta para archivos estáticos
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
