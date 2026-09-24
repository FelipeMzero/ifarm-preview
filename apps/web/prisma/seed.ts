import { prisma } from "../src/lib/prisma";
import { auth } from "../src/lib/auth";
import type { Sex, AnimalOrigin } from "../src/generated/prisma/enums";

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
    const existing = await prisma.person.findUnique({
      where: { taxId: person.taxId },
    });
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
    const existing = await prisma.property.findFirst({
      where: { name: property.name },
    });
    if (existing) {
      console.log(`- propriedade ${property.name} já existe, pulando`);
      continue;
    }

    const owner = await prisma.person.findUnique({
      where: { taxId: ownerTaxId },
    });
    if (!owner) {
      console.log(
        `- titular (taxId ${ownerTaxId}) não encontrado, pulando propriedade ${property.name}`,
      );
      continue;
    }

    await prisma.property.create({
      data: {
        ...property,
        owner: { connect: { id: owner.id } },
        address: { create: address },
      },
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
        {
          name: "Piquete 04",
          hectares: 4.6774,
          stockingRate: 1.9,
          polygon: [
            { lat: -18.96, lng: -48.349 },
            { lat: -18.96, lng: -48.347 },
            { lat: -18.962, lng: -48.347 },
            { lat: -18.962, lng: -48.349 },
          ],
        },
        {
          name: "Piquete 05",
          hectares: 4.6774,
          stockingRate: 2.0,
          polygon: [
            { lat: -18.96, lng: -48.347 },
            { lat: -18.96, lng: -48.345 },
            { lat: -18.962, lng: -48.345 },
            { lat: -18.962, lng: -48.347 },
          ],
        },
        {
          name: "Piquete 06",
          hectares: 4.6774,
          stockingRate: 1.4,
          notes: "Área de descanso",
          polygon: [
            { lat: -18.96, lng: -48.345 },
            { lat: -18.96, lng: -48.343 },
            { lat: -18.962, lng: -48.343 },
            { lat: -18.962, lng: -48.345 },
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
        {
          name: "Piquete 04",
          hectares: 4.7651,
          stockingRate: 1.7,
          polygon: [
            { lat: -15.53, lng: -55.862 },
            { lat: -15.53, lng: -55.86 },
            { lat: -15.532, lng: -55.86 },
            { lat: -15.532, lng: -55.862 },
          ],
        },
        {
          name: "Piquete 05",
          hectares: 4.7651,
          stockingRate: 2.1,
          polygon: [
            { lat: -15.53, lng: -55.86 },
            { lat: -15.53, lng: -55.858 },
            { lat: -15.532, lng: -55.858 },
            { lat: -15.532, lng: -55.86 },
          ],
        },
        {
          name: "Piquete 06",
          hectares: 4.7651,
          stockingRate: 1.2,
          notes: "Área de descanso",
          polygon: [
            { lat: -15.53, lng: -55.858 },
            { lat: -15.53, lng: -55.856 },
            { lat: -15.532, lng: -55.856 },
            { lat: -15.532, lng: -55.858 },
          ],
        },
      ],
    },
  ];

  for (const { propertyName, items } of areasByProperty) {
    const property = await prisma.property.findFirst({
      where: { name: propertyName },
    });
    if (!property) {
      console.log(
        `- propriedade ${propertyName} não encontrada, pulando áreas`,
      );
      continue;
    }

    for (const area of items) {
      const existing = await prisma.area.findFirst({
        where: { name: area.name, propertyId: property.id },
      });
      if (existing) {
        console.log(`- área ${area.name} (${propertyName}) já existe, pulando`);
        continue;
      }

      await prisma.area.create({ data: { ...area, propertyId: property.id } });
      console.log(`- área ${area.name} (${propertyName}) criada`);
    }
  }
}

async function seedBatches() {
  const batchesByProperty = [
    {
      propertyName: "Fazenda Santa Rita",
      items: [
        { name: "Lote Cria", areaName: "Piquete 01" },
        { name: "Lote Recria", areaName: "Piquete 02" },
        { name: "Lote Engorda", areaName: "Piquete 03" },
        { name: "Lote Reprodução", areaName: "Piquete 04" },
      ],
    },
    {
      propertyName: "Fazenda Boa Vista",
      items: [
        { name: "Lote Cria", areaName: "Piquete 01" },
        { name: "Lote Recria", areaName: "Piquete 02" },
        { name: "Lote Engorda", areaName: "Piquete 03" },
        { name: "Lote Reprodução", areaName: "Piquete 04" },
      ],
    },
  ];

  for (const { propertyName, items } of batchesByProperty) {
    const property = await prisma.property.findFirst({
      where: { name: propertyName },
    });
    if (!property) {
      console.log(
        `- propriedade ${propertyName} não encontrada, pulando lotes`,
      );
      continue;
    }

    for (const { name, areaName } of items) {
      const existing = await prisma.batch.findFirst({
        where: { name, propertyId: property.id },
      });
      if (existing) {
        console.log(`- lote ${name} (${propertyName}) já existe, pulando`);
        continue;
      }

      const area = await prisma.area.findFirst({
        where: { name: areaName, propertyId: property.id },
      });
      if (!area) {
        console.log(
          `- área ${areaName} (${propertyName}) não encontrada, pulando lote ${name}`,
        );
        continue;
      }

      const batch = await prisma.batch.create({
        data: { name, propertyId: property.id },
      });
      await prisma.batchAreaHistory.create({
        data: { batchId: batch.id, areaId: area.id, enteredAt: new Date() },
      });
      console.log(`- lote ${name} (${propertyName}) criado`);
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

// Vendedor padrão usado nos animais de origem "Compra" (empresa de comércio de insumos/gado já seedada)
const SELLER_TAX_ID = "22233344000183";

const PROPERTY_TAG_PREFIXES: Record<string, string> = {
  "Fazenda Santa Rita": "SR",
  "Fazenda Boa Vista": "BV",
};

const BATCH_TAG_PREFIXES: Record<string, string> = {
  "Lote Cria": "CRIA",
  "Lote Recria": "RECR",
  "Lote Engorda": "ENGO",
  "Lote Reprodução": "REPR",
};

type AnimalTemplate = {
  sex: Sex;
  neutered: boolean;
  origin: AnimalOrigin;
  weightKg: number;
  purchasePrice?: number;
  birthDate?: string;
};

// 5 animais por lote: ~metade macho, ~metade castrado, ~metade compra, 25% indeterminada, 25% nascimento
const ANIMAL_TEMPLATE: AnimalTemplate[] = [
  {
    sex: "MALE",
    neutered: true,
    origin: "PURCHASE",
    weightKg: 320,
    purchasePrice: 3200,
  },
  {
    sex: "FEMALE",
    neutered: false,
    origin: "PURCHASE",
    weightKg: 280,
    purchasePrice: 2600,
  },
  {
    sex: "MALE",
    neutered: true,
    origin: "PURCHASE",
    weightKg: 350,
    purchasePrice: 3450,
  },
  { sex: "FEMALE", neutered: false, origin: "UNDEFINED", weightKg: 265 },
  {
    sex: "MALE",
    neutered: false,
    origin: "BIRTH",
    weightKg: 38,
    birthDate: "2025-06-20",
  },
];

async function seedAnimals() {
  const breeds = await prisma.breed.findMany({ orderBy: { name: "asc" } });
  const seller = await prisma.person.findUnique({
    where: { taxId: SELLER_TAX_ID },
  });
  if (!seller) {
    console.log("- vendedor padrão não encontrado, pulando animais");
    return;
  }

  let rfidCounter = 0;
  const entryDate = new Date("2025-04-01T00:00:00");

  for (const propertyName of Object.keys(PROPERTY_TAG_PREFIXES)) {
    const property = await prisma.property.findFirst({
      where: { name: propertyName },
    });
    if (!property) {
      console.log(
        `- propriedade ${propertyName} não encontrada, pulando animais`,
      );
      continue;
    }

    const propPrefix = PROPERTY_TAG_PREFIXES[propertyName];
    const batches = await prisma.batch.findMany({
      where: { propertyId: property.id },
    });

    for (const batch of batches) {
      const batchPrefix = BATCH_TAG_PREFIXES[batch.name] ?? "LOTE";

      for (let i = 0; i < ANIMAL_TEMPLATE.length; i++) {
        const tpl = ANIMAL_TEMPLATE[i];
        const tag = `${propPrefix}-${batchPrefix}-${i + 1}`;

        const existing = await prisma.animal.findFirst({
          where: { currentTag: tag, currentPropertyId: property.id },
        });
        if (existing) {
          console.log(`- animal ${tag} já existe, pulando`);
          continue;
        }

        rfidCounter += 1;
        const rfid = `9000820${String(10000 + rfidCounter).padStart(6, "0")}`;
        const breed = breeds[i % breeds.length];

        await prisma.$transaction(async (tx) => {
          const animal = await tx.animal.create({
            data: {
              currentTag: tag,
              currentRfid: rfid,
              sex: tpl.sex,
              origin: tpl.origin,
              status: "ACTIVE",
              birthDate: tpl.birthDate
                ? new Date(`${tpl.birthDate}T00:00:00`)
                : null,
              breedId: breed?.id,
              currentBatchId: batch.id,
              currentPropertyId: property.id,
              currentWeight: tpl.weightKg,
              neutered: tpl.neutered,
            },
          });

          await tx.animalPropertyHistory.create({
            data: {
              animalId: animal.id,
              propertyId: property.id,
              enteredAt: entryDate,
            },
          });
          await tx.animalBatchHistory.create({
            data: {
              animalId: animal.id,
              batchId: batch.id,
              enteredAt: entryDate,
            },
          });
          await tx.tagManagementItem.create({
            data: { animalId: animal.id, tag, identifiedAt: entryDate },
          });
          await tx.rfidManagementItem.create({
            data: { animalId: animal.id, rfid, identifiedAt: entryDate },
          });
          await tx.weighingManagementItem.create({
            data: {
              animalId: animal.id,
              weight: tpl.weightKg,
              weighedAt: entryDate,
            },
          });

          if (tpl.neutered) {
            await tx.neuteringManagementItem.create({
              data: {
                animalId: animal.id,
                notes: "Cirúrgico",
                neuteredAt: entryDate,
              },
            });
          }

          if (tpl.origin === "PURCHASE") {
            const purchaseEvent = await tx.purchaseEvent.create({
              data: {
                purchaseDate: entryDate,
                confirmedAt: entryDate,
                pricingType: "LUMP_SUM",
                totalPrice: tpl.purchasePrice,
                sellerId: seller.id,
                destinationPropertyId: property.id,
                destinationBatchId: batch.id,
              },
            });
            await tx.purchaseEventItem.create({
              data: {
                eventId: purchaseEvent.id,
                animalId: animal.id,
                weight: tpl.weightKg,
                tag,
                rfid,
                sex: tpl.sex,
                breedId: breed?.id,
              },
            });
          }
        });

        console.log(`- animal ${tag} (${propertyName} / ${batch.name}) criado`);
      }
    }
  }
}

async function main() {
  await seedAdmin();
  await seedPeople();
  await seedProperties();
  await seedAreas();
  await seedBatches();
  await seedBreeds();
  await seedAnimals();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
