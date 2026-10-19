import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    rules: {
      semi: ["error", "always"], // Obriga o uso de ponto e vírgula e marca como erro
      // Datas sem hora passam pelas funções de packages/shared/src/date.ts.
      // "warn" até os demais módulos migrarem; depois, "error".
      "no-restricted-syntax": [
        "warn",
        {
          selector: "TemplateElement[value.raw=/T00:00:00$/]",
          message:
            "Use as funções de @ifarm/shared (toLocalDay/fromLocalDay para colunas timestamp que guardam um dia; toDbDate/fromDbDate para @db.Date; formatDate para exibir) em vez de montar a data com T00:00:00.",
        },
      ],
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
