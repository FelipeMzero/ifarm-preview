import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// O DATABASE_URL vem do .env do web (o mesmo que o Next e o docker-compose usam).
config({
  path: fileURLToPath(new URL("../../apps/web/.env", import.meta.url)),
  quiet: true,
});

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // O seed fica no web, porque também cria os usuários pela autenticação.
    seed: "pnpm --filter web seed",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
