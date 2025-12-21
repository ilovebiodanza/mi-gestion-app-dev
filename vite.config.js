import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  // CAMBIO PRINCIPAL:
  // Usa '/app/' para que los assets carguen correctamente en producción.
  // Si usas "./", podrías tener problemas con rutas profundas o navegación.
  base: "/app/",

  publicDir: "public",

  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,

    // Asegúrate de tener instalado terser: npm install -D terser
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.info", "console.debug", "console.warn"],
      },
      format: {
        comments: false,
      },
    },

    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },

    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 3000,
    open: true,
  },
});
