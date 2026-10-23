import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// O DATABASE_URL vem do .env desta pasta (modelo em .env.example).
config({
  path: fileURLToPath(new URL(".env", import.meta.url)),
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
