import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// O CSS do geoman (desenho no mapa) traz ícones SVG embutidos (data:) que usam url(#id) por
// dentro; o Vite trata esse url() interno como um arquivo e quebra o CSS. Codificar os
// parênteses (%28/%29) deixa o SVG igual e tira o url() do caminho do Vite.
function geomanCss(): Plugin {
  return {
    name: "ifarm:geoman-css",
    enforce: "pre",
    transform(code, id) {
      if (!/leaflet-geoman.*\.css$/.test(id)) return;
      return code.replace(/url\(%23([\w-]+)\)/g, "url%28%23$1%29");
    },
  };
}

// O navegador chama /api/* no próprio site, e o Vite repassa para a API (apps/api): mesma
// origem, sem CORS. Em produção, o proxy reverso faz esse papel. A API fica em localhost:3001;
// para outro endereço: API_URL=http://… pnpm dev (só usado aqui, não vai para o navegador).
const proxy = {
  "/api": {
    target: process.env.API_URL ?? "http://localhost:3001",
    changeOrigin: false,
  },
};

export default defineConfig(() => {
  return {
    plugins: [geomanCss(), react(), tailwindcss()],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    // Porta 3000: a mesma de antes (e o endereço público configurado na API).
    server: { port: 3000, host: true, proxy },
    preview: { port: 3000, host: true, proxy },
  };
});
