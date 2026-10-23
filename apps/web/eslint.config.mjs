import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default defineConfig([
  ...tseslint.configs.recommended,
  reactHooks.configs.flat["recommended-latest"],

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

  globalIgnores(["dist/**"]),
]);
