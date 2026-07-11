import { prisma } from "../src/lib/prisma";
import { auth } from "../src/lib/auth";

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@ifarm.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin1234";
  const name = process.env.SEED_ADMIN_NAME ?? "admin";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`- admin (${email}) já existe, pulando`);
    return;
  }

  await auth.api.createUser({ body: { email, password, name, role: "admin" } });
  console.log(`- admin (${email}) criado`);
}

async function seedPeople() {
  const people = [
    {
      type: "INDIVIDUAL" as const,
      taxId: "11122233477",
      name: "Carlos Eduardo Silva",
      phone: "65999998888",
      email: "carlos.silva@example.com",
      rg: "1234567",
      birthDate: new Date("1985-03-14T00:00:00"),
      maritalStatus: "MARRIED" as const,
    },
    {
      type: "INDIVIDUAL" as const,
      taxId: "22233344588",
      name: "Maria Aparecida Souza",
      phone: "65988887777",
      email: "maria.souza@example.com",
      rg: "7654321",
      birthDate: new Date("1990-07-22T00:00:00"),
      maritalStatus: "SINGLE" as const,
    },
    {
      type: "COMPANY" as const,
      taxId: "11122233000183",
      name: "Agropecuária Boa Vista Ltda",
      tradeName: "Fazenda Boa Vista",
      stateRegistration: "1234567890",
      phone: "6533221100",
      email: "contato@boavista.com.br",
    },
    {
      type: "COMPANY" as const,
      taxId: "22233344000183",
      name: "Comércio de Insumos Rurais S.A.",
      tradeName: "Rural Insumos",
      stateRegistration: "0987654321",
      phone: "6533224400",
      email: "contato@ruralinsumos.com.br",
    },
  ];

  for (const person of people) {
    const existing = await prisma.person.findUnique({ where: { taxId: person.taxId } });
    if (existing) {
      console.log(`- pessoa ${person.name} já existe, pulando`);
      continue;
    }

    await prisma.person.create({ data: person });
    console.log(`- pessoa ${person.name} criada`);
  }
}

async function main() {
  await seedAdmin();
  await seedPeople();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
