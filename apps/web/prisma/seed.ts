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

async function seedProperties() {
  const properties = [
    {
      name: "Fazenda Santa Rita",
      ownerTaxId: "11122233477", // Carlos Eduardo Silva
      totalArea: 120,
      productiveArea: 95,
      cib: "SR12345-6",
      latitude: -18.9636,
      longitude: -48.3532,
      address: {
        zipCode: "38400000",
        street: "Rodovia BR-050, km 12",
        city: "Uberlândia",
        state: "MG",
        country: "Brasil",
      },
    },
    {
      name: "Fazenda Boa Vista",
      ownerTaxId: "11122233000183", // Agropecuária Boa Vista Ltda
      totalArea: 340,
      productiveArea: 300,
      ccir: "123.456.789.012-3",
      latitude: -15.5321,
      longitude: -55.8654,
      address: {
        zipCode: "78000000",
        street: "Rodovia MT-040, km 25",
        city: "Cuiabá",
        state: "MT",
        country: "Brasil",
      },
    },
  ];

  for (const { ownerTaxId, address, ...property } of properties) {
    const existing = await prisma.property.findFirst({ where: { name: property.name } });
    if (existing) {
      console.log(`- propriedade ${property.name} já existe, pulando`);
      continue;
    }

    const owner = await prisma.person.findUnique({ where: { taxId: ownerTaxId } });
    if (!owner) {
      console.log(`- titular (taxId ${ownerTaxId}) não encontrado, pulando propriedade ${property.name}`);
      continue;
    }

    await prisma.property.create({
      data: { ...property, owner: { connect: { id: owner.id } }, address: { create: address } },
    });
    console.log(`- propriedade ${property.name} criada`);
  }
}

async function seedAreas() {
  const areasByProperty = [
    {
      propertyName: "Fazenda Santa Rita",
      items: [
        {
          name: "Piquete 01",
          hectares: 4.6774,
          stockingRate: 1.8,
          polygon: [
            { lat: -18.96, lng: -48.355 },
            { lat: -18.96, lng: -48.353 },
            { lat: -18.962, lng: -48.353 },
            { lat: -18.962, lng: -48.355 },
          ],
        },
        {
          name: "Piquete 02",
          hectares: 4.6774,
          stockingRate: 2.1,
          polygon: [
            { lat: -18.96, lng: -48.353 },
            { lat: -18.96, lng: -48.351 },
            { lat: -18.962, lng: -48.351 },
            { lat: -18.962, lng: -48.353 },
          ],
        },
        {
          name: "Piquete 03",
          hectares: 4.6774,
          stockingRate: 1.5,
          notes: "Área de descanso",
          polygon: [
            { lat: -18.96, lng: -48.351 },
            { lat: -18.96, lng: -48.349 },
            { lat: -18.962, lng: -48.349 },
            { lat: -18.962, lng: -48.351 },
          ],
        },
      ],
    },
    {
      propertyName: "Fazenda Boa Vista",
      items: [
        {
          name: "Piquete 01",
          hectares: 4.7651,
          stockingRate: 1.6,
          polygon: [
            { lat: -15.53, lng: -55.868 },
            { lat: -15.53, lng: -55.866 },
            { lat: -15.532, lng: -55.866 },
            { lat: -15.532, lng: -55.868 },
          ],
        },
        {
          name: "Piquete 02",
          hectares: 4.7651,
          stockingRate: 1.9,
          polygon: [
            { lat: -15.53, lng: -55.866 },
            { lat: -15.53, lng: -55.864 },
            { lat: -15.532, lng: -55.864 },
            { lat: -15.532, lng: -55.866 },
          ],
        },
        {
          name: "Piquete 03",
          hectares: 4.7651,
          stockingRate: 1.3,
          notes: "Área de descanso",
          polygon: [
            { lat: -15.53, lng: -55.864 },
            { lat: -15.53, lng: -55.862 },
            { lat: -15.532, lng: -55.862 },
            { lat: -15.532, lng: -55.864 },
          ],
        },
      ],
    },
  ];

  for (const { propertyName, items } of areasByProperty) {
    const property = await prisma.property.findFirst({ where: { name: propertyName } });
    if (!property) {
      console.log(`- propriedade ${propertyName} não encontrada, pulando áreas`);
      continue;
    }

    for (const area of items) {
      const existing = await prisma.area.findFirst({ where: { name: area.name, propertyId: property.id } });
      if (existing) {
        console.log(`- área ${area.name} (${propertyName}) já existe, pulando`);
        continue;
      }

      await prisma.area.create({ data: { ...area, propertyId: property.id } });
      console.log(`- área ${area.name} (${propertyName}) criada`);
    }
  }
}

async function seedBreeds() {
  const breeds = ["Nelore", "Brahman", "Gir", "Guzerá", "Tabapuã"];

  for (const name of breeds) {
    const existing = await prisma.breed.findUnique({ where: { name } });
    if (existing) {
      console.log(`- raça ${name} já existe, pulando`);
      continue;
    }

    await prisma.breed.create({ data: { name } });
    console.log(`- raça ${name} criada`);
  }
}

async function main() {
  await seedAdmin();
  await seedPeople();
  await seedProperties();
  await seedAreas();
  await seedBreeds();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
