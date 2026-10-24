import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { contextStorage } from "hono/context-storage";
import { cors } from "hono/cors";
import { auth } from "./auth";
import { animalRoutes } from "./routes/animal";
import { areaRoutes } from "./routes/area";
import { batchRoutes } from "./routes/batch";
import { batchTransferRoutes } from "./routes/batch-transfer";
import { breedRoutes } from "./routes/breed";
import { healthManagementTypeRoutes } from "./routes/health-management-type";
import { managementSessionRoutes } from "./routes/management-session";
import { neuteringTechniqueRoutes } from "./routes/neutering-technique";
import { personRoutes } from "./routes/person";
import { propertyRoutes } from "./routes/property";
import { purchaseRoutes } from "./routes/purchase";
import { receptionRoutes } from "./routes/reception";
import { stockingPreviewRoutes } from "./routes/stocking-preview";
import { userRoutes } from "./routes/user";

const app = new Hono();

// Dá às rotas acesso à requisição atual (requireSession lê os headers da sessão por ele).
app.use(contextStorage());

// Só em desenvolvimento: libera CORS com credenciais para o app mobile rodando no navegador
// (outra origem: Metro bundler / navegador do celular) chamar a API pela rede local. Em
// produção o web e a API ficam na mesma origem (o proxy reverso repassa /api/*).
function isLocalDevOrigin(origin: string) {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)
    );
  } catch {
    return false;
  }
}

if (process.env.NODE_ENV !== "production") {
  app.use(
    "/api/*",
    cors({
      origin: (origin) => (isLocalDevOrigin(origin) ? origin : null),
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );
}

// Só em desenvolvimento: atrasa as respostas da API (menos a autenticação) para ver os estados
// de carregamento das telas. Ex.: API_DELAY_MS=2000 pnpm dev
const apiDelayMs = Number(process.env.API_DELAY_MS ?? 0);
if (process.env.NODE_ENV !== "production" && apiDelayMs > 0) {
  app.use("/api/*", async (c, next) => {
    if (!c.req.path.startsWith("/api/auth/")) {
      await new Promise((resolve) => setTimeout(resolve, apiDelayMs));
    }
    await next();
  });
  console.log(
    `Atraso de ${apiDelayMs} ms nas respostas da API (API_DELAY_MS).`,
  );
}

// Login, sessão e gestão de usuários (better-auth).
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.route("/api/animal", animalRoutes);
app.route("/api/area", areaRoutes);
app.route("/api/batch", batchRoutes);
app.route("/api/batch-transfer", batchTransferRoutes);
app.route("/api/breed", breedRoutes);
app.route("/api/health-management-type", healthManagementTypeRoutes);
app.route("/api/management-session", managementSessionRoutes);
app.route("/api/neutering-technique", neuteringTechniqueRoutes);
app.route("/api/person", personRoutes);
app.route("/api/property", propertyRoutes);
app.route("/api/purchase", purchaseRoutes);
app.route("/api/reception", receptionRoutes);
app.route("/api/stocking-preview", stockingPreviewRoutes);
app.route("/api/user", userRoutes);

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API do iFarm em http://localhost:${info.port}`);
});
