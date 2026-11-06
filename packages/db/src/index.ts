import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "./generated/prisma/client";

const DEFAULT_SUPABASE_URL =
  "postgresql://postgres.zdhsgkzywzffxvmrtppp:felipemzeroSleep1990@aws-1-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require";

let rawConnectionString =
  process.env.DATABASE_URL && process.env.DATABASE_URL !== "undefined"
    ? process.env.DATABASE_URL
    : DEFAULT_SUPABASE_URL;

// Converte automaticamente URL direta IPv6 do Supabase para o pooler IPv4
if (rawConnectionString.includes("db.zdhsgkzywzffxvmrtppp.supabase.co")) {
  rawConnectionString = rawConnectionString
    .replace("db.zdhsgkzywzffxvmrtppp.supabase.co", "aws-1-us-west-2.pooler.supabase.com")
    .replace("postgres:", "postgres.zdhsgkzywzffxvmrtppp:");
}

// Toda conexão abre a sessão em UTC, qualquer que seja o fuso do servidor do banco. O CLI e as
// ferramentas (psql, Studio) usam o padrão do banco: ALTER DATABASE ... SET timezone TO 'UTC'.
const isRemote =
  rawConnectionString.includes("sslmode=require") ||
  rawConnectionString.includes("supabase.co") ||
  rawConnectionString.includes("pooler.supabase.com");

// Remove ?sslmode=* para que pg não sobrescreva o rejectUnauthorized
const connectionString = isRemote
  ? rawConnectionString.split("?")[0]
  : rawConnectionString;

const pool = new Pool({
  connectionString,
  options: "-c timezone=UTC",
  ssl: isRemote ? { rejectUnauthorized: false } : undefined,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export { prisma, Prisma };
