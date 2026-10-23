import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  ...tseslint.configs.recommended,

  {
    rules: {
      // Como no web (eslint-config-next): sem uso é aviso, não erro.
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      semi: ["error", "always"], // Obriga o uso de ponto e vírgula e marca como erro
    },
  },

  globalIgnores(["dist/**", "build/**"]),
]);
