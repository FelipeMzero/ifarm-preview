import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  ...tseslint.configs.recommended,

  // Pegar a configuração lint deste pacote
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },

  {
    rules: {
      semi: ["error", "always"],
    },
  },

  globalIgnores(["dist/**", "build/**"]),
]);
