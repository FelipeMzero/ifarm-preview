import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "./generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

// Toda conexão abre a sessão em UTC, qualquer que seja o fuso do servidor do banco. O CLI e as
// ferramentas (psql, Studio) usam o padrão do banco: ALTER DATABASE ... SET timezone TO 'UTC'.
const pool = new Pool({ connectionString, options: "-c timezone=UTC" });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export { prisma, Prisma };
