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
      // Datas sem hora passam pelas funções de packages/shared/src/date.ts.
      "no-restricted-syntax": [
        "error",
        {
          selector: "TemplateElement[value.raw=/T00:00:00$/]",
          message:
            "Use as funções de @ifarm/shared (toLocalDay/fromLocalDay para colunas timestamp que guardam um dia; toDbDate/fromDbDate para @db.Date; formatDate para exibir) em vez de montar a data com T00:00:00.",
        },
      ],
    },
  },

  globalIgnores(["dist/**", "build/**"]),
]);
