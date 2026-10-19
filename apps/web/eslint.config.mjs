import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    rules: {
      semi: ["error", "always"], // Obriga o uso de ponto e vírgula e marca como erro
      // Datas sem hora passam por toDbDate/fromDbDate/formatDate de @ifarm/shared.
      // "warn" até os demais módulos migrarem; depois, "error".
      "no-restricted-syntax": [
        "warn",
        {
          selector: "TemplateElement[value.raw=/T00:00:00$/]",
          message:
            "Use toDbDate/fromDbDate/formatDate de @ifarm/shared em vez de montar a data com T00:00:00.",
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
