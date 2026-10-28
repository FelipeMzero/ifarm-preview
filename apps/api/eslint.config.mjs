import fs from "node:fs";
import path from "node:path";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

const FEATURES = path.join(import.meta.dirname, "src", "features") + path.sep;

// Fronteira dos domínios (src/features/<domínio>): de outro domínio, só se importam os arquivos
// *.public.ts, os pontos de contato. O resto (fatias, shared.ts, rules.ts) é interno do domínio.
// Os arquivos na raiz de features/ (ex.: status-where.test.ts) ficam de fora.
const domainBoundary = {
  meta: {
    type: "problem",
    messages: {
      private:
        '"{{spec}}" é interno do domínio {{target}}: de outro domínio, importe só arquivos *.public.ts.',
    },
  },
  create(context) {
    const file = context.filename;
    if (!file.startsWith(FEATURES)) return {};
    const parts = file.slice(FEATURES.length).split(path.sep);
    if (parts.length < 2) return {};
    const domain = parts[0];

    function check(node) {
      const spec = node.source?.value;
      if (typeof spec !== "string" || !spec.startsWith(".")) return;
      const target = path.resolve(path.dirname(file), spec);
      if (!target.startsWith(FEATURES)) return;
      const targetDomain = target.slice(FEATURES.length).split(path.sep)[0];
      if (targetDomain === domain || target.endsWith(".public")) return;
      context.report({
        node: node.source,
        messageId: "private",
        data: { spec, target: targetDomain },
      });
    }

    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
      ImportExpression: check,
    };
  },
};

// Fronteira das fatias: uma fatia é uma pasta com route.ts (o endpoint). O que está dentro dela
// é só dela; as outras fatias usam o que fica no nível do domínio (shared.ts, rules.ts e os
// módulos com nome). Exceção: o routes.ts que monta as fatias importa o route.ts de cada uma.
const sliceDirs = new Map();
function isSliceDir(dir) {
  if (!sliceDirs.has(dir)) {
    sliceDirs.set(dir, fs.existsSync(path.join(dir, "route.ts")));
  }
  return sliceDirs.get(dir);
}
function sliceOf(file) {
  for (
    let dir = path.dirname(file);
    dir.startsWith(FEATURES);
    dir = path.dirname(dir)
  ) {
    if (isSliceDir(dir)) return dir;
  }
  return null;
}

const sliceBoundary = {
  meta: {
    type: "problem",
    messages: {
      private:
        '"{{spec}}" é interno da fatia {{slice}}: o que mais de uma fatia usa fica no nível do domínio.',
    },
  },
  create(context) {
    const file = context.filename;
    if (!file.startsWith(FEATURES)) return {};
    const ownSlice = sliceOf(file);
    const isRoutes = path.basename(file) === "routes.ts";

    function check(node) {
      const spec = node.source?.value;
      if (typeof spec !== "string" || !spec.startsWith(".")) return;
      const target = path.resolve(path.dirname(file), spec);
      const slice = sliceOf(target);
      if (!slice || slice === ownSlice) return;
      if (isRoutes && path.basename(target) === "route") return;
      context.report({
        node: node.source,
        messageId: "private",
        data: { spec, slice: path.relative(FEATURES, slice) },
      });
    }

    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
      ImportExpression: check,
    };
  },
};

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

  {
    files: ["src/features/**/*.ts"],
    plugins: {
      ifarm: {
        rules: {
          "domain-boundary": domainBoundary,
          "slice-boundary": sliceBoundary,
        },
      },
    },
    rules: {
      "ifarm/domain-boundary": "error",
      "ifarm/slice-boundary": "error",
    },
  },

  globalIgnores(["dist/**", "build/**"]),
]);
