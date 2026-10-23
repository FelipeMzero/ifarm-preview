import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Testes unitários de regras puras (sem banco nem navegador), ao lado do código:
// src/**/*.test.ts, aqui e nos pacotes shared e domain.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: [
      "src/**/*.test.ts",
      "../../packages/shared/src/**/*.test.ts",
      "../../packages/domain/src/**/*.test.ts",
    ],
  },
});
