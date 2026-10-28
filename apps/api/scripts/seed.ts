// Seed de demonstração. Todas as datas são relativas ao dia em que o seed roda, então
// logo depois de rodar os indicadores (GMD, metas, lotação, rodízio de áreas, carências)
// estão "atuais". Só popula um banco vazio: para recriar, rode
//   pnpm exec prisma db push --force-reset && pnpm exec prisma db seed
import { prisma } from "@ifarm/db";
import type { Prisma } from "@ifarm/db/client";
import type { AnimalOrigin, AnimalStatus, Sex } from "@ifarm/db/enums";
import { DAY_MS, planStepSchema, type BrTimeZone } from "@ifarm/shared";
import { auth } from "../src/auth";
import { findCommitments } from "../src/features/animal/commitments.public";
import { consolidateSession } from "../src/features/management-session/confirm-management-session/consolidate";
import { saveAnimalStep } from "../src/features/management-session/session-animal/records";
import {
  type SessionStep,
  stepKey,
  toStepRows,
} from "../src/features/management-session/session-steps.public";
import { applyPlanSteps } from "../src/features/management-session/plan.public";
import {
  findReception,
  receiveAnimal,
} from "../src/features/purchase/reception.public";
import { toDbDate } from "../src/lib/db-dates";

// ---------------------------------------------------------------------------
// Datas relativas ao dia do seed
// ---------------------------------------------------------------------------

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

/** Data/hora `n` dias atrás (10h, para não cair em outro dia por fuso); negativo = futuro. */
const ago = (n: number) =>
  new Date(TODAY.getTime() - n * DAY_MS + 10 * 60 * 60 * 1000);
/** Data (sem horário) `n` dias atrás; negativo = futuro. */
const dateAgo = (n: number) => new Date(TODAY.getTime() - n * DAY_MS);

// PRNG determinístico: o seed gera sempre os mesmos pesos.
let prngState = 42;
function random() {
  prngState |= 0;
  prngState = (prngState + 0x6d2b79f5) | 0;
  let t = Math.imul(prngState ^ (prngState >>> 15), 1 | prngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const between = (min: number, max: number) => min + random() * (max - min);
const round = (n: number, digits = 1) =>
  Math.round(n * 10 ** digits) / 10 ** digits;

// ---------------------------------------------------------------------------
// Usuários, pessoas, raças e tipos de manejo sanitário
// ---------------------------------------------------------------------------

const PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "admin1234";

async function seedUsers() {
  const users = [
    {
      email: process.env.SEED_ADMIN_EMAIL ?? "admin@ifarm.local",
      name: process.env.SEED_ADMIN_NAME ?? "admin",
      role: "admin" as const,
    },
    {
      email: "gerente@ifarm.local",
      name: "Joana Gerente",
      role: "manager" as const,
    },
    {
      email: "tecnico@ifarm.local",
      name: "Rafael Técnico",
      role: "technician" as const,
    },
    {
      email: "vaqueiro@ifarm.local",
      name: "Zé Vaqueiro",
      role: "worker" as const,
    },
  ];

  for (const user of users) {
    const existing = await prisma.user.findUnique({
      where: { email: user.email },
    });
    if (existing) {
      console.log(`- usuário ${user.email} já existe, pulando`);
      continue;
    }
    await auth.api.createUser({ body: { ...user, password: PASSWORD } });
    console.log(`- usuário ${user.email} (${user.role}) criado`);
  }
}

type PersonSeed = Omit<Prisma.PersonCreateInput, "address"> & {
  address?: Prisma.AddressCreateWithoutPersonInput;
};

const PEOPLE = {
  carlos: {
    type: "INDIVIDUAL",
    taxId: "11122233477",
    name: "Carlos Eduardo Silva",
    phone: "34999998888",
    email: "carlos.silva@example.com",
    rg: "1234567",
    birthDate: toDbDate("1985-03-14"),
    maritalStatus: "MARRIED",
    address: {
      zipCode: "38400100",
      street: "Rua Goiás",
      number: "1200",
      neighborhood: "Centro",
      city: "Uberlândia",
      state: "MG",
    },
  },
  maria: {
    type: "INDIVIDUAL",
    taxId: "22233344588",
    name: "Maria Aparecida Souza",
    phone: "65988887777",
    email: "maria.souza@example.com",
    rg: "7654321",
    birthDate: toDbDate("1990-07-22"),
    maritalStatus: "SINGLE",
  },
  vet: {
    type: "INDIVIDUAL",
    taxId: "33344455508",
    name: "Dr. Paulo Henrique Mendes",
    phone: "34991112222",
    email: "paulo.vet@example.com",
    rg: "5551234",
    birthDate: toDbDate("1978-11-05"),
    maritalStatus: "MARRIED",
  },
  boaVista: {
    type: "COMPANY",
    taxId: "11122233000183",
    name: "Agropecuária Boa Vista Ltda",
    tradeName: "Fazenda Boa Vista",
    stateRegistration: "1234567890",
    phone: "6533221100",
    email: "contato@boavista.com.br",
    address: {
      zipCode: "78005000",
      street: "Avenida Getúlio Vargas",
      number: "500",
      complement: "Sala 12",
      neighborhood: "Centro Norte",
      city: "Cuiabá",
      state: "MT",
    },
  },
  insumos: {
    type: "COMPANY",
    taxId: "22233344000183",
    name: "Comércio de Insumos Rurais S.A.",
    tradeName: "Rural Insumos",
    stateRegistration: "0987654321",
    phone: "6533224400",
    email: "contato@ruralinsumos.com.br",
  },
  leiloes: {
    type: "COMPANY",
    taxId: "33344455000183",
    name: "Leilões Cerrado Ltda",
    tradeName: "Leilões Cerrado",
    stateRegistration: "5556667778",
    phone: "6232124455",
    email: "contato@leiloescerrado.com.br",
  },
  // Pessoa inativa, para o filtro de inativas.
  inativo: {
    type: "INDIVIDUAL",
    taxId: "44455566619",
    name: "João Batista Pereira",
    phone: "34988776655",
    deactivatedAt: ago(60),
  },
} satisfies Record<string, PersonSeed>;
type PersonKey = keyof typeof PEOPLE;

async function seedPeople() {
  const ids = {} as Record<PersonKey, string>;
  for (const [key, seed] of Object.entries(PEOPLE) as [
    PersonKey,
    PersonSeed,
  ][]) {
    const { address, ...data } = seed;
    const person = await prisma.person.create({
      data: { ...data, ...(address ? { address: { create: address } } : {}) },
    });
    ids[key] = person.id;
  }
  console.log(`- ${Object.keys(PEOPLE).length} pessoas criadas`);
  return ids;
}

const BREEDS = ["Nelore", "Brahman", "Gir", "Guzerá", "Tabapuã", "Angus"];

async function seedBreeds() {
  const ids: Record<string, string> = {};
  for (const name of BREEDS) {
    const breed = await prisma.breed.create({
      // Angus fica desativada, para o filtro de inativas.
      data: { name, deactivatedAt: name === "Angus" ? ago(30) : null },
    });
    ids[name] = breed.id;
  }
  console.log(`- ${BREEDS.length} raças criadas`);
  return ids;
}

const HEALTH_TYPES = [
  "Vacinação",
  "Vermifugação",
  "Controle de ectoparasitas",
  "Tratamento",
  "Exame",
] as const;
type HealthType = (typeof HEALTH_TYPES)[number];

async function seedHealthTypes() {
  const ids = {} as Record<HealthType, string>;
  for (const name of HEALTH_TYPES) {
    ids[name] = (
      await prisma.healthManagementType.create({ data: { name } })
    ).id;
  }
  return ids;
}

const NEUTERING_TECHNIQUES = ["Burdizzo", "Cirúrgica", "Elástico"] as const;
type NeuteringTechnique = (typeof NEUTERING_TECHNIQUES)[number];

async function seedNeuteringTechniques() {
  const ids = {} as Record<NeuteringTechnique, string>;
  for (const name of NEUTERING_TECHNIQUES) {
    ids[name] = (await prisma.neuteringTechnique.create({ data: { name } })).id;
  }
  return ids;
}

// Marca de ferro do dono de cada fazenda, registrada no município da fazenda. Os animais
// são marcados com a marca do dono da fazenda em que estão.
const BRANDS: Record<
  PropKey,
  Omit<Prisma.BrandUncheckedCreateInput, "ownerId" | "registrationDate"> & {
    registeredDaysAgo: number;
  }
> = {
  SR: {
    name: "Marca CES",
    registrationNumber: "0457",
    registrationBody: "Prefeitura Municipal de Uberlândia",
    registrationCity: "Uberlândia",
    registrationState: "MG",
    registeredDaysAgo: 3650,
  },
  BV: {
    name: "Marca Boa Vista",
    registrationNumber: "1288",
    registrationBody: "INDEA-MT",
    registrationCity: "Cuiabá",
    registrationState: "MT",
    registeredDaysAgo: 2900,
  },
};

async function seedBrands(people: Record<PersonKey, string>) {
  const ids = {} as Record<PropKey, string>;
  for (const [key, { registeredDaysAgo, ...data }] of Object.entries(
    BRANDS,
  ) as [PropKey, (typeof BRANDS)[PropKey]][]) {
    const brand = await prisma.brand.create({
      data: {
        ...data,
        registrationDate: dateAgo(registeredDaysAgo),
        ownerId: people[PROPERTIES[key].ownerKey],
      },
    });
    ids[key] = brand.id;
  }
  console.log(`- ${Object.keys(BRANDS).length} marcas criadas`);
  return ids;
}

// Bezerros nascidos na fazenda são marcados na desmama, por volta dos 8 meses.
const BRANDING_AGE_DAYS = 240;

// ---------------------------------------------------------------------------
// Propriedades, áreas e lotes
// ---------------------------------------------------------------------------

type PropKey = "SR" | "BV";

type PropertySeed = Omit<Prisma.PropertyCreateInput, "owner"> & {
  ownerKey: PersonKey;
  /** O fuso do local (RN-PROPRIEDADE-05), sem cair no padrão do banco. */
  timeZone: BrTimeZone;
  /** Canto noroeste da grade de piquetes. */
  origin: { lat: number; lng: number };
};

const PROPERTIES: Record<PropKey, PropertySeed> = {
  SR: {
    name: "Fazenda Santa Rita",
    ownerKey: "carlos",
    totalArea: 120,
    productiveArea: 95,
    cib: "SR12345-6",
    car: "MG-3170206-1A2B3C4D5E6F",
    latitude: -18.9636,
    longitude: -48.3532,
    timeZone: "America/Sao_Paulo",
    address: {
      create: {
        zipCode: "38400000",
        street: "Rodovia BR-050, km 12",
        city: "Uberlândia",
        state: "MG",
      },
    },
    origin: { lat: -18.958, lng: -48.357 },
  },
  BV: {
    name: "Fazenda Boa Vista",
    ownerKey: "boaVista",
    totalArea: 340,
    productiveArea: 300,
    ccir: "123.456.789.012-3",
    latitude: -15.5321,
    longitude: -55.8654,
    timeZone: "America/Cuiaba",
    address: {
      create: {
        zipCode: "78000000",
        street: "Rodovia MT-040, km 25",
        city: "Cuiabá",
        state: "MT",
      },
    },
    origin: { lat: -15.528, lng: -55.87 },
  },
};

// Piquetes retangulares em grade, a partir do canto noroeste.
function gridPolygon(
  origin: { lat: number; lng: number },
  row: number,
  col: number,
) {
  const d = 0.0022;
  const lat = origin.lat - row * d;
  const lng = origin.lng + col * d;
  return [
    { lat, lng },
    { lat, lng: lng + d },
    { lat: lat - d, lng: lng + d },
    { lat: lat - d, lng },
  ];
}

type AreaSpec = {
  name: string;
  hectares: number;
  stockingRate: number;
  occupationDays?: number;
  restDays?: number;
  notes?: string;
  closedDaysAgo?: number;
};

// Cada área representa uma situação do mapa (comentário ao lado).
const AREAS: Record<PropKey, AreaSpec[]> = {
  SR: [
    {
      name: "Piquete 01",
      hectares: 8,
      stockingRate: 2,
      occupationDays: 30,
      restDays: 45,
      notes: "Braquiarão adubado",
    }, // Engorda: verde, ocupação vencida
    {
      name: "Piquete 02",
      hectares: 5,
      stockingRate: 1.5,
      occupationDays: 90,
      restDays: 45,
    }, // Recria: perto do limite
    {
      name: "Piquete 03",
      hectares: 6,
      stockingRate: 1.8,
      notes: "Cocho de sal mineral",
    }, // Cria: sem dias de referência
    {
      name: "Piquete 04",
      hectares: 4,
      stockingRate: 1.5,
      occupationDays: 21,
      restDays: 30,
    }, // Reprodução: lotação excedida
    {
      name: "Piquete 05",
      hectares: 5,
      stockingRate: 2,
      occupationDays: 30,
      restDays: 30,
    }, // livre há 90 dias: descansada
    {
      name: "Piquete 06",
      hectares: 7,
      stockingRate: 1.8,
      occupationDays: 30,
      restDays: 60,
    }, // livre há 45 dias: em descanso
    {
      name: "Piquete 07",
      hectares: 5,
      stockingRate: 1.6,
      occupationDays: 30,
      restDays: 30,
    }, // livre há 20 dias: em descanso
    { name: "Piquete 08", hectares: 4.5, stockingRate: 1.4, restDays: 30 }, // nunca ocupada: descansada
    {
      name: "Piquete 09",
      hectares: 6,
      stockingRate: 1.7,
      occupationDays: 60,
      restDays: 90,
      notes: "Área de descanso prolongado",
    }, // livre há 60 dias: em descanso
    {
      name: "Piquete 10",
      hectares: 2,
      stockingRate: 2,
      occupationDays: 15,
      restDays: 15,
      notes: "Piquete de quarentena",
    }, // Quarentena (lote vazio)
    { name: "Piquete 11", hectares: 4, stockingRate: 1.3 }, // nunca ocupada, sem referência: livre
    {
      name: "Piquete 12",
      hectares: 5,
      stockingRate: 1.5,
      notes: "Em reforma de pastagem",
      closedDaysAgo: 200,
    }, // inativa
  ],
  BV: [
    {
      name: "Piquete 01",
      hectares: 9,
      stockingRate: 2,
      occupationDays: 120,
      restDays: 30,
    }, // Terminação
    {
      name: "Piquete 02",
      hectares: 8,
      stockingRate: 1.8,
      occupationDays: 60,
      restDays: 30,
    }, // Engorda
    { name: "Piquete 03", hectares: 6, stockingRate: 1.5 }, // Recria
    { name: "Piquete 04", hectares: 7, stockingRate: 1.6 }, // Cria
    {
      name: "Piquete 05",
      hectares: 6,
      stockingRate: 1.7,
      occupationDays: 45,
      restDays: 40,
    }, // livre há 20 dias: em descanso
    {
      name: "Piquete 06",
      hectares: 5,
      stockingRate: 1.4,
      occupationDays: 45,
      restDays: 30,
    }, // livre há 100 dias: descansada
  ],
};

type BatchSpec = {
  key: string;
  prop: PropKey;
  name: string;
  notes?: string;
  createdDaysAgo: number;
  /** Áreas pelas quais o lote passou: [área, entrou há N dias]. */
  areas: [string, number][];
  closedDaysAgo?: number;
  goal?: { weight: number; inDays?: number };
};

const BATCHES: BatchSpec[] = [
  // Santa Rita
  {
    key: "SR:Engorda",
    prop: "SR",
    name: "Lote Engorda",
    notes: "Garrotes comprados para terminação a pasto",
    createdDaysAgo: 210,
    areas: [
      ["Piquete 06", 210],
      ["Piquete 01", 45],
    ],
    goal: { weight: 560, inDays: 60 },
  }, // meta no ritmo
  {
    key: "SR:Recria",
    prop: "SR",
    name: "Lote Recria",
    notes: "Desmamados da fazenda e novilhos vindos da Boa Vista",
    createdDaysAgo: 240,
    areas: [
      ["Piquete 09", 240],
      ["Piquete 02", 60],
    ],
    goal: { weight: 380, inDays: 90 },
  }, // meta abaixo do ritmo
  {
    key: "SR:Cria",
    prop: "SR",
    name: "Lote Cria",
    notes: "Vacas paridas com bezerros ao pé",
    createdDaysAgo: 700,
    areas: [["Piquete 03", 700]],
  },
  {
    key: "SR:Reprodução",
    prop: "SR",
    name: "Lote Reprodução",
    notes: "Estação de monta",
    createdDaysAgo: 320,
    areas: [
      ["Piquete 07", 320],
      ["Piquete 04", 20],
    ],
  },
  {
    key: "SR:Quarentena",
    prop: "SR",
    name: "Lote Quarentena",
    notes: "Isolamento para tratamento",
    createdDaysAgo: 3,
    areas: [["Piquete 10", 3]],
  }, // vazio: pode ser encerrado
  {
    key: "SR:Desmama",
    prop: "SR",
    name: "Desmama 2025",
    notes: "Lote vendido",
    createdDaysAgo: 330,
    areas: [["Piquete 05", 330]],
    closedDaysAgo: 90,
  }, // encerrado
  // Boa Vista
  {
    key: "BV:Terminação",
    prop: "BV",
    name: "Lote Terminação",
    createdDaysAgo: 300,
    areas: [
      ["Piquete 06", 300],
      ["Piquete 01", 100],
    ],
    goal: { weight: 520, inDays: 20 },
  }, // meta atingida
  {
    key: "BV:Engorda",
    prop: "BV",
    name: "Lote Engorda",
    createdDaysAgo: 180,
    areas: [
      ["Piquete 05", 180],
      ["Piquete 02", 20],
    ],
    goal: { weight: 480 },
  }, // meta sem data
  {
    key: "BV:Recria",
    prop: "BV",
    name: "Lote Recria",
    createdDaysAgo: 460,
    areas: [["Piquete 03", 460]],
  },
  {
    key: "BV:Cria",
    prop: "BV",
    name: "Lote Cria",
    createdDaysAgo: 500,
    areas: [["Piquete 04", 500]],
  },
];

// ---------------------------------------------------------------------------
// Animais
// ---------------------------------------------------------------------------

type AnimalSpec = {
  sex: Sex;
  breed: string;
  origin: AnimalOrigin;
  name?: string;
  birthDaysAgo?: number;
  /** Chegada à fazenda (nascimento ou compra). */
  entryDaysAgo: number;
  /** Lotes pelos quais passou: [lote, entrou há N dias]. O prefixo indica a fazenda. */
  batches: [string, number][];
  /** Peso por crescimento desde o nascimento, ou ancorado no peso da última pesagem. */
  weight:
    | { fromBirth: number; adg: number }
    | { current: number; adg: number }
    | null;
  neuteredDaysAgo?: number;
  recastrationDaysAgo?: number;
  purchase?: string;
  exit?: { daysAgo: number; status: AnimalStatus; notes: string };
  skipRfid?: boolean;
  skipTag?: boolean;
};

const ANIMALS: AnimalSpec[] = [];
const add = (count: number, make: (i: number) => AnimalSpec) => {
  for (let i = 0; i < count; i++) ANIMALS.push(make(i));
};

const propOf = (batchKey: string) => batchKey.slice(0, 2) as PropKey;
const finalBatch = (spec: AnimalSpec) => spec.batches.at(-1)![0];
const finalProp = (spec: AnimalSpec) => propOf(finalBatch(spec));

// --- Santa Rita ---
// Engorda: 10 garrotes castrados, comprados por arroba há 200 dias.
add(10, (i) => ({
  sex: "MALE",
  breed: i % 3 === 0 ? "Brahman" : "Nelore",
  origin: "PURCHASE",
  birthDaysAgo: 600 + i * 12,
  entryDaysAgo: 200,
  batches: [["SR:Engorda", 200]],
  weight: { current: between(470, 520), adg: between(0.9, 1.15) },
  neuteredDaysAgo: 185,
  recastrationDaysAgo: i === 4 ? 140 : undefined,
  purchase: "SR:garrotes",
}));
// Recria: 6 bezerros nascidos na fazenda, desmamados (Cria → Recria) há 60 dias.
add(6, (i) => ({
  sex: i < 3 ? "MALE" : "FEMALE",
  breed: "Nelore",
  origin: "BIRTH",
  birthDaysAgo: 290 + i * 8,
  entryDaysAgo: 290 + i * 8,
  batches: [
    ["SR:Cria", 290 + i * 8],
    ["SR:Recria", 60],
  ],
  weight: { fromBirth: 34, adg: between(0.82, 0.95) },
  neuteredDaysAgo: i < 2 ? 72 : undefined,
}));
// Recria: 4 novilhos nascidos na Boa Vista e levados para a Santa Rita há 120 dias.
add(4, (i) => ({
  sex: i % 2 === 0 ? "MALE" : "FEMALE",
  breed: "Tabapuã",
  origin: "BIRTH",
  birthDaysAgo: 430 + i * 10,
  entryDaysAgo: 430 + i * 10,
  batches: [
    ["BV:Recria", 430 + i * 10],
    ["SR:Recria", 120],
  ],
  weight: { current: between(300, 330), adg: between(0.45, 0.6) },
}));
// Cria: 5 vacas adultas (uma sem data de nascimento).
add(5, (i) => ({
  sex: "FEMALE",
  breed: i % 2 === 0 ? "Nelore" : "Gir",
  origin: i < 2 ? "UNDEFINED" : "PURCHASE",
  birthDaysAgo: i === 4 ? undefined : 1500 + i * 90,
  entryDaysAgo: 700,
  batches: [["SR:Cria", 700]],
  weight: { current: between(420, 470), adg: between(0.05, 0.12) },
  purchase: i >= 2 ? "SR:vacas" : undefined,
}));
// Cria: bezerros ao pé; os dois mais novos ainda sem pesagem (UA estimada pela idade).
add(6, (i) => {
  const born = [150, 120, 95, 60, 25, 18][i];
  return {
    sex: i % 2 === 0 ? "MALE" : "FEMALE",
    breed: "Nelore",
    origin: "BIRTH",
    birthDaysAgo: born,
    entryDaysAgo: born,
    batches: [["SR:Cria", born]],
    weight: born > 30 ? { fromBirth: 33, adg: between(0.75, 0.9) } : null,
    skipRfid: born < 72,
    skipTag: born === 18, // ainda sem brinco: identificado só pelo ID
  };
});
// Cria: bezerro que morreu.
add(1, () => ({
  sex: "MALE",
  breed: "Nelore",
  origin: "BIRTH",
  birthDaysAgo: 110,
  entryDaysAgo: 110,
  batches: [["SR:Cria", 110]],
  weight: { fromBirth: 31, adg: 0.4 },
  skipRfid: true,
  exit: {
    daysAgo: 80,
    status: "DEAD",
    notes: "Óbito por tristeza parasitária",
  },
}));
// Cria: bezerra desaparecida do pasto.
add(1, () => ({
  sex: "FEMALE",
  breed: "Nelore",
  origin: "BIRTH",
  birthDaysAgo: 150,
  entryDaysAgo: 150,
  batches: [["SR:Cria", 150]],
  weight: { fromBirth: 29, adg: 0.55 },
  skipRfid: true,
  exit: {
    daysAgo: 35,
    status: "MISSING",
    notes: "Não encontrada na contagem do pasto",
  },
}));
// Reprodução: 3 vacas de descarte vendidas juntas para o frigorífico.
add(3, (i) => ({
  sex: "FEMALE",
  breed: i === 0 ? "Gir" : "Nelore",
  origin: "UNDEFINED",
  birthDaysAgo: 3000 + i * 120,
  entryDaysAgo: 900,
  batches: [
    ["SR:Cria", 900],
    ["SR:Reprodução", 500],
  ],
  weight: { current: between(420, 450), adg: between(0.03, 0.08) },
  exit: {
    daysAgo: 60,
    status: "SOLD",
    notes:
      "Vacas de descarte vendidas para frigorífico: idade avançada e falhas reprodutivas",
  },
}));
// Reprodução: 6 vacas vindas da cria, 1 doada e 1 touro comprado por valor fechado.
add(6, (i) => ({
  sex: "FEMALE",
  breed: i % 2 === 0 ? "Nelore" : "Guzerá",
  origin: "UNDEFINED",
  birthDaysAgo: 1400 + i * 60,
  entryDaysAgo: 600,
  batches: [
    ["SR:Cria", 600],
    ["SR:Reprodução", 320],
  ],
  weight: { current: between(430, 470), adg: between(0.1, 0.2) },
}));
add(1, () => ({
  sex: "FEMALE",
  breed: "Gir",
  origin: "DONATION",
  name: "Mimosa",
  birthDaysAgo: 1800,
  entryDaysAgo: 300,
  batches: [["SR:Reprodução", 300]],
  weight: { current: 455, adg: 0.12 },
}));
add(1, () => ({
  sex: "MALE",
  breed: "Nelore",
  origin: "PURCHASE",
  name: "Imperador",
  birthDaysAgo: 1300,
  entryDaysAgo: 150,
  batches: [["SR:Reprodução", 150]],
  weight: { current: 780, adg: 0.2 },
  purchase: "SR:touro",
}));
// Desmama 2025 (lote encerrado): 3 animais vendidos há 90 dias.
add(3, (i) => ({
  sex: "MALE",
  breed: "Nelore",
  origin: "PURCHASE",
  birthDaysAgo: 700 + i * 20,
  entryDaysAgo: 330,
  batches: [["SR:Desmama", 330]],
  weight: { current: 390 + i * 10, adg: 0.6 },
  purchase: "SR:desmama",
  exit: {
    daysAgo: 90,
    status: "SOLD",
    notes: "Vendidos para recria de terceiros",
  },
}));

// --- Boa Vista ---
// Terminação: meta atingida (dois ainda abaixo; um vendido há 20 dias).
add(8, (i) => ({
  sex: "MALE",
  breed: "Nelore",
  origin: "PURCHASE",
  birthDaysAgo: 800 + i * 15,
  entryDaysAgo: 300,
  batches: [["BV:Terminação", 300]],
  weight: {
    current: i < 2 ? between(500, 512) : between(530, 560),
    adg: between(0.75, 0.9),
  },
  neuteredDaysAgo: 290,
  purchase: "BV:terminação",
  exit:
    i === 7
      ? { daysAgo: 20, status: "SOLD", notes: "Vendido para frigorífico" }
      : undefined,
}));
// Terminação: boi que morreu (fora da compra, origem não informada).
add(1, () => ({
  sex: "MALE",
  breed: "Nelore",
  origin: "UNDEFINED",
  birthDaysAgo: 830,
  entryDaysAgo: 300,
  batches: [["BV:Terminação", 300]],
  weight: { current: 520, adg: 0.8 },
  neuteredDaysAgo: 290,
  exit: {
    daysAgo: 15,
    status: "DEAD",
    notes: "Óbito por picada de cobra",
  },
}));
// Engorda: meta de peso sem data (um abatido na fazenda para consumo).
add(8, (i) => ({
  sex: "MALE",
  breed: i % 2 === 0 ? "Nelore" : "Brahman",
  origin: "PURCHASE",
  birthDaysAgo: 650 + i * 10,
  entryDaysAgo: 180,
  batches: [["BV:Engorda", 180]],
  weight: { current: between(400, 440), adg: between(0.7, 0.9) },
  purchase: "BV:engorda",
  exit:
    i === 7
      ? {
          daysAgo: 40,
          status: "SLAUGHTERED",
          notes: "Abatido para consumo da sede (problema de casco)",
        }
      : undefined,
}));
// Recria: os que ficaram na Boa Vista.
add(5, (i) => ({
  sex: i % 2 === 0 ? "MALE" : "FEMALE",
  breed: "Tabapuã",
  origin: "BIRTH",
  birthDaysAgo: 400 + i * 10,
  entryDaysAgo: 400 + i * 10,
  batches: [["BV:Recria", 400 + i * 10]],
  weight: { current: between(290, 320), adg: between(0.45, 0.6) },
}));
// Recria: 3 garrotes desaparecidos juntos.
add(3, (i) => ({
  sex: "MALE",
  breed: "Tabapuã",
  origin: "BIRTH",
  birthDaysAgo: 380 + i * 12,
  entryDaysAgo: 380 + i * 12,
  batches: [["BV:Recria", 380 + i * 12]],
  weight: { fromBirth: 31, adg: between(0.5, 0.6) },
  exit: {
    daysAgo: 50,
    status: "MISSING",
    notes: "Sumiram após rompimento da cerca do Piquete 03",
  },
}));
// Cria: 5 vacas e 5 bezerros.
add(5, (i) => ({
  sex: "FEMALE",
  breed: "Nelore",
  origin: "UNDEFINED",
  birthDaysAgo: 1600 + i * 70,
  entryDaysAgo: 500,
  batches: [["BV:Cria", 500]],
  weight: { current: between(410, 450), adg: 0.08 },
}));
add(5, (i) => ({
  sex: i % 2 === 0 ? "MALE" : "FEMALE",
  breed: "Nelore",
  origin: "BIRTH",
  birthDaysAgo: 170 - i * 25,
  entryDaysAgo: 170 - i * 25,
  batches: [["BV:Cria", 170 - i * 25]],
  weight: { fromBirth: 32, adg: between(0.75, 0.85) },
}));

// Pesagens mensais do rebanho (sessões de manejo), em dias atrás.
const WEIGHING_SESSIONS: Record<PropKey, number[]> = {
  SR: [12, 42, 72, 102, 132, 162, 192, 222],
  BV: [8, 38, 68, 98, 128, 158, 188, 218],
};

type Purchase = {
  /** Título que distingue a compra (há vendedores com mais de uma). */
  title: string;
  prop: PropKey;
  daysAgo: number;
  seller: PersonKey;
  batch: string;
  pricing:
    | { type: "PER_ARROBA"; pricePerArroba: number }
    | { type: "PER_HEAD"; pricePerHead: number }
    | { type: "LUMP_SUM"; total: number };
  /** GTA e nota fiscal da (primeira) carga; ficam na recepção. */
  gta?: string;
  invoice?: string;
  notes?: string;
  /** Quebra de peso acordada (%) entre o embarque e a chegada. */
  shrinkPercent?: number;
  /** Idade informada pelo vendedor, sem registro de nascimento. */
  estimatedBirth?: boolean;
};

const PURCHASES: Record<string, Purchase> = {
  "SR:garrotes": {
    title: "Garrotes Nelore — leilão, lote 34",
    prop: "SR",
    daysAgo: 200,
    seller: "leiloes",
    batch: "SR:Engorda",
    pricing: { type: "PER_ARROBA", pricePerArroba: 300 },
    gta: "MG-4589123",
    invoice: "NF 001.245",
    notes: "Leilão de garrotes — lote 34",
    shrinkPercent: 3,
    estimatedBirth: true,
  },
  "SR:vacas": {
    title: "Vacas de cria",
    prop: "SR",
    daysAgo: 700,
    seller: "insumos",
    batch: "SR:Cria",
    pricing: { type: "LUMP_SUM", total: 9600 },
    gta: "MG-3011457",
    estimatedBirth: true,
  },
  "SR:touro": {
    title: "Touro PO reprodutor",
    prop: "SR",
    daysAgo: 150,
    seller: "boaVista",
    batch: "SR:Reprodução",
    pricing: { type: "PER_HEAD", pricePerHead: 18000 },
    gta: "MT-7788990",
    invoice: "NF 000.778",
    notes: "Touro PO com exame andrológico",
  },
  "SR:desmama": {
    title: "Bezerros de desmama",
    prop: "SR",
    daysAgo: 330,
    seller: "maria",
    batch: "SR:Desmama",
    pricing: { type: "PER_ARROBA", pricePerArroba: 280 },
  },
  "BV:terminação": {
    title: "Boi magro para terminação",
    prop: "BV",
    daysAgo: 300,
    seller: "leiloes",
    batch: "BV:Terminação",
    pricing: { type: "PER_ARROBA", pricePerArroba: 295 },
    gta: "MT-1122334",
  },
  "BV:engorda": {
    title: "Garrotes para engorda",
    prop: "BV",
    daysAgo: 180,
    seller: "insumos",
    batch: "BV:Engorda",
    pricing: { type: "LUMP_SUM", total: 28800 },
  },
};

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------

type Ctx = {
  people: Record<PersonKey, string>;
  breeds: Record<string, string>;
  healthTypes: Record<HealthType, string>;
  neuteringTechniques: Record<NeuteringTechnique, string>;
  brands: Record<PropKey, string>;
  properties: Record<PropKey, string>;
  batches: Record<string, string>; // "SR:Engorda" → id
};

async function seedPropertiesAreasBatches(people: Record<PersonKey, string>) {
  const properties = {} as Record<PropKey, string>;
  const areas: Record<string, string> = {};
  const batches: Record<string, string> = {};

  for (const [key, seed] of Object.entries(PROPERTIES) as [
    PropKey,
    PropertySeed,
  ][]) {
    const { ownerKey, origin, ...data } = seed;
    const property = await prisma.property.create({
      data: { ...data, owner: { connect: { id: people[ownerKey] } } },
    });
    properties[key] = property.id;

    for (const [index, area] of AREAS[key].entries()) {
      const created = await prisma.area.create({
        data: {
          name: area.name,
          hectares: area.hectares,
          stockingRate: area.stockingRate,
          defaultOccupationDays: area.occupationDays,
          defaultRestDays: area.restDays,
          notes: area.notes,
          closedAt: area.closedDaysAgo != null ? ago(area.closedDaysAgo) : null,
          polygon: gridPolygon(origin, Math.floor(index / 6), index % 6),
          propertyId: property.id,
        },
      });
      areas[`${key}:${area.name}`] = created.id;
    }
    console.log(`- ${data.name} criada com ${AREAS[key].length} áreas`);
  }

  for (const spec of BATCHES) {
    const batch = await prisma.batch.create({
      data: {
        name: spec.name,
        notes: spec.notes,
        propertyId: properties[spec.prop],
        createdAt: ago(spec.createdDaysAgo),
        closedAt: spec.closedDaysAgo != null ? ago(spec.closedDaysAgo) : null,
        ...(spec.goal
          ? {
              saleGoal: {
                create: {
                  targetWeight: spec.goal.weight,
                  targetDate:
                    spec.goal.inDays != null
                      ? dateAgo(-spec.goal.inDays)
                      : null,
                },
              },
            }
          : {}),
      },
    });
    batches[spec.key] = batch.id;

    for (const [i, [areaName, enteredDaysAgo]] of spec.areas.entries()) {
      const exitedDaysAgo = spec.areas[i + 1]?.[1] ?? spec.closedDaysAgo;
      await prisma.batchAreaHistory.create({
        data: {
          batchId: batch.id,
          areaId: areas[`${spec.prop}:${areaName}`],
          enteredAt: ago(enteredDaysAgo),
          exitedAt: exitedDaysAgo != null ? ago(exitedDaysAgo) : null,
          notes: i > 0 ? "Rodízio de pastagem" : null,
        },
      });
    }
  }
  console.log(`- ${BATCHES.length} lotes criados (1 encerrado)`);

  return { properties, batches };
}

type SeededAnimal = {
  id: string;
  spec: AnimalSpec;
  tag: string | null;
  rfid: string | null;
  /** Pesagens das sessões: dias atrás → peso. */
  weights: Map<number, number>;
};

// Em que lote o animal estava N dias atrás (null = ainda não tinha chegado ou já saiu).
function batchAt(spec: AnimalSpec, daysAgo: number): string | null {
  if (daysAgo > spec.entryDaysAgo) return null;
  if (spec.exit && daysAgo <= spec.exit.daysAgo) return null;
  let batch = spec.batches[0][0];
  for (const [key, since] of spec.batches) if (daysAgo <= since) batch = key;
  return batch;
}
const propAt = (spec: AnimalSpec, daysAgo: number) => {
  const batch = batchAt(spec, daysAgo);
  return batch ? propOf(batch) : null;
};

function weightAt(spec: AnimalSpec, daysAgo: number): number | null {
  const w = spec.weight;
  if (!w) return null;
  const lastSession = WEIGHING_SESSIONS[finalProp(spec)][0];
  const base =
    "fromBirth" in w
      ? w.fromBirth +
        w.adg * ((spec.birthDaysAgo ?? spec.entryDaysAgo) - daysAgo)
      : w.current - w.adg * (daysAgo - lastSession);
  // Pequena variação entre pesagens (balança, enchimento do rúmen).
  return round(Math.max(25, base * between(0.985, 1.015)));
}

async function seedAnimals(ctx: Ctx) {
  const tagCounter: Record<PropKey, number> = { SR: 0, BV: 0 };
  const nextTag = (prop: PropKey) =>
    `${prop}-${String(++tagCounter[prop]).padStart(4, "0")}`;
  let rfidCounter = 0;
  const nextRfid = () => `076000${String(1_000_000 + ++rfidCounter)}`;

  const seeded: SeededAnimal[] = [];

  for (const spec of ANIMALS) {
    const firstProp = propOf(spec.batches[0][0]);
    const lastProp = finalProp(spec);
    const moveToOtherProp = spec.batches.find(([b]) => propOf(b) !== firstProp);
    const exit = spec.exit;

    // Brinco na chegada; rebrinco ao mudar de fazenda.
    const tagEvents: { daysAgo: number; tag: string | null; notes?: string }[] =
      [];
    if (!spec.skipTag)
      tagEvents.push({ daysAgo: spec.entryDaysAgo, tag: nextTag(firstProp) });
    if (moveToOtherProp) {
      tagEvents.push({
        daysAgo: moveToOtherProp[1],
        tag: nextTag(lastProp),
        notes: "Rebrincado na chegada à Santa Rita",
      });
    }
    const currentTag = tagEvents.at(-1)?.tag ?? null;

    const animal = await prisma.animal.create({
      data: {
        name: spec.name,
        sex: spec.sex,
        origin: spec.origin,
        status: exit?.status ?? "ACTIVE",
        birthDate:
          spec.birthDaysAgo != null ? dateAgo(spec.birthDaysAgo) : null,
        breedId: ctx.breeds[spec.breed],
        neutered: spec.neuteredDaysAgo != null,
        currentTag,
        currentPropertyId: ctx.properties[lastProp],
        currentBatchId: exit ? null : ctx.batches[finalBatch(spec)],
        createdAt: ago(spec.entryDaysAgo),
      },
    });

    // Histórico de propriedades.
    const stints: [PropKey, number, number | null][] = moveToOtherProp
      ? [
          [firstProp, spec.entryDaysAgo, moveToOtherProp[1]],
          [lastProp, moveToOtherProp[1], exit?.daysAgo ?? null],
        ]
      : [[firstProp, spec.entryDaysAgo, exit?.daysAgo ?? null]];
    for (const [prop, from, to] of stints) {
      await prisma.animalPropertyHistory.create({
        data: {
          animalId: animal.id,
          propertyId: ctx.properties[prop],
          enteredAt: ago(from),
          exitedAt: to != null ? ago(to) : null,
          notes: exit && to === exit.daysAgo ? exit.notes : null,
        },
      });
    }

    // Histórico de lotes.
    for (const [i, [batch, from]] of spec.batches.entries()) {
      const to = spec.batches[i + 1]?.[1] ?? exit?.daysAgo ?? null;
      const notes =
        i === 0
          ? null
          : propOf(batch) !== propOf(spec.batches[i - 1][0])
            ? "Chegada da Fazenda Boa Vista"
            : spec.batches[i - 1][0].endsWith("Cria") &&
                batch.endsWith("Recria")
              ? "Desmama"
              : null;
      await prisma.animalBatchHistory.create({
        data: {
          animalId: animal.id,
          batchId: ctx.batches[batch],
          enteredAt: ago(from),
          exitedAt: to != null ? ago(to) : null,
          notes,
        },
      });
    }

    for (const t of tagEvents) {
      await prisma.animalTagging.create({
        data: {
          animalId: animal.id,
          tag: t.tag,
          identifiedAt: ago(t.daysAgo),
          notes: t.notes,
        },
      });
    }

    // Pesagem avulsa de entrada (compra) ou ao nascer (nem todo nascimento é pesado).
    const entryWeight = weightAt(spec, spec.entryDaysAgo);
    if (entryWeight != null && (spec.origin !== "BIRTH" || random() < 0.6)) {
      await prisma.animalWeighing.create({
        data: {
          animalId: animal.id,
          weight: entryWeight,
          weighedAt: ago(spec.entryDaysAgo),
          notes: spec.origin === "BIRTH" ? "Peso ao nascer" : "Peso de entrada",
        },
      });
    }

    // Pesos das sessões mensais em que o animal estava na fazenda.
    const weights = new Map<number, number>();
    for (const prop of ["SR", "BV"] as PropKey[]) {
      for (const session of WEIGHING_SESSIONS[prop]) {
        if (propAt(spec, session) !== prop || session === spec.entryDaysAgo)
          continue;
        const w = weightAt(spec, session);
        if (w != null) weights.set(session, w);
      }
    }

    // RFID avulso na chegada à Boa Vista (na Santa Rita, vem da sessão de identificação).
    let rfid: string | null = null;
    if (!spec.skipRfid && firstProp === "BV") {
      rfid = nextRfid();
      await prisma.animalRfidTagging.create({
        data: {
          animalId: animal.id,
          rfid,
          identifiedAt: ago(spec.entryDaysAgo),
        },
      });
      await prisma.animal.update({
        where: { id: animal.id },
        data: { currentRfid: rfid },
      });
    }

    // Castração avulsa (a de 72 dias atrás é feita na sessão) e recastração.
    if (spec.neuteredDaysAgo != null && spec.neuteredDaysAgo !== 72) {
      await prisma.animalNeutering.create({
        data: {
          animalId: animal.id,
          techniqueId: ctx.neuteringTechniques["Burdizzo"],
          neuteredAt: ago(spec.neuteredDaysAgo),
        },
      });
    }
    if (spec.recastrationDaysAgo != null) {
      await prisma.animalNeutering.create({
        data: {
          animalId: animal.id,
          techniqueId: ctx.neuteringTechniques["Cirúrgica"],
          neuteredAt: ago(spec.recastrationDaysAgo),
          notes: "Recastração: testículo remanescente",
        },
      });
    }

    // Marcação avulsa com a marca do dono da fazenda: na chegada (compra) ou na
    // desmama (nascidos na fazenda); de novo ao mudar para a fazenda de outro dono.
    const brandEvents: { daysAgo: number; prop: PropKey; notes?: string }[] =
      [];
    const firstBranding =
      spec.origin === "BIRTH" && spec.birthDaysAgo != null
        ? spec.birthDaysAgo - BRANDING_AGE_DAYS
        : spec.entryDaysAgo;
    if (firstBranding > (exit?.daysAgo ?? 0)) {
      brandEvents.push({ daysAgo: firstBranding, prop: firstProp });
    }
    if (moveToOtherProp && moveToOtherProp[1] > (exit?.daysAgo ?? 0)) {
      brandEvents.push({
        daysAgo: moveToOtherProp[1],
        prop: lastProp,
        notes: "Marcado na chegada à Santa Rita",
      });
    }
    for (const b of brandEvents) {
      await prisma.animalBranding.create({
        data: {
          animalId: animal.id,
          brandId: ctx.brands[b.prop],
          brandedAt: ago(b.daysAgo),
          notes: b.notes,
        },
      });
    }
    if (brandEvents.length) {
      await prisma.animal.update({
        where: { id: animal.id },
        data: { currentBrandId: ctx.brands[brandEvents.at(-1)!.prop] },
      });
    }

    seeded.push({ id: animal.id, spec, tag: currentTag, rfid, weights });
  }

  console.log(`- ${seeded.length} animais criados`);
  return seeded;
}

// Perdas (morte, desaparecimento) e abates na fazenda (consumo) dos animais que saíram
// do rebanho, já consolidados: o status final do animal vem deles. Cada item guarda o
// lote de onde o animal saiu, como na consolidação.
async function seedLossesAndSlaughters(ctx: Ctx, animals: SeededAnimal[]) {
  // Saídas do mesmo tipo, dia, fazenda e motivo formam um único evento.
  const groups = new Map<
    string,
    {
      exit: NonNullable<AnimalSpec["exit"]>;
      prop: PropKey;
      items: { animalId: string; originBatchId: string }[];
    }
  >();
  for (const { id, spec } of animals) {
    const exit = spec.exit;
    if (!exit || !["DEAD", "MISSING", "SLAUGHTERED"].includes(exit.status))
      continue;
    const prop = finalProp(spec);
    const key = `${exit.status}|${exit.daysAgo}|${prop}|${exit.notes}`;
    const group = groups.get(key) ?? { exit, prop, items: [] };
    group.items.push({
      animalId: id,
      originBatchId: ctx.batches[finalBatch(spec)],
    });
    groups.set(key, group);
  }

  let losses = 0;
  let slaughters = 0;
  for (const { exit, prop, items } of groups.values()) {
    const date = ago(exit.daysAgo);
    const propertyId = ctx.properties[prop];
    if (exit.status === "SLAUGHTERED") {
      // Planejado para dois dias antes do que de fato aconteceu.
      await prisma.slaughterEvent.create({
        data: {
          title: "Abate para consumo",
          description: exit.notes,
          scheduledAt: ago(exit.daysAgo + 2),
          slaughteredAt: date,
          confirmedAt: date,
          propertyId,
          items: { create: items },
        },
      });
      slaughters++;
    } else {
      const type = exit.status as "DEAD" | "MISSING";
      await prisma.lossEvent.create({
        data: {
          title: type === "DEAD" ? "Óbito" : "Desaparecimento",
          description: exit.notes,
          occurredAt: date,
          confirmedAt: date,
          propertyId,
          items: { create: items.map((item) => ({ ...item, type })) },
        },
      });
      losses++;
    }
  }
  console.log(`- ${losses} eventos de perda e ${slaughters} de abate criados`);
}

async function seedSessions(ctx: Ctx, animals: SeededAnimal[]) {
  let rfidCounter = 5000;
  const nextRfid = () => `076000${String(1_000_000 + ++rfidCounter)}`;

  for (const prop of ["SR", "BV"] as PropKey[]) {
    const sessions = WEIGHING_SESSIONS[prop];
    for (const daysAgo of sessions) {
      // A data da sessão é copiada para cada registro do manejo.
      const sessionDate = ago(daysAgo);
      const present = animals.filter((a) => propAt(a.spec, daysAgo) === prop);
      if (!present.length) continue;
      const weighed = present.filter((a) => a.weights.has(daysAgo));

      // Etapas na ordem em que foram feitas; gravadas no fim, com os ids dos sanitários.
      const steps: SessionStep[] = [{ type: "weighing" }];

      const session = await prisma.managementSession.create({
        data: {
          propertyId: ctx.properties[prop],
          scheduledAt: ago(daysAgo),
          performedAt: ago(daysAgo),
          confirmedAt: ago(daysAgo),
          title: `Pesagem mensal de ${sessionDate.toLocaleDateString("pt-BR", { month: "long" })}`,
          notes: "Pesagem mensal do rebanho",
          participants: { create: present.map((a) => ({ animalId: a.id })) },
          weighingManagement: {
            create: {
              items: {
                create: weighed.map((a) => ({
                  animalId: a.id,
                  weight: a.weights.get(daysAgo)!,
                  weighedAt: sessionDate,
                })),
              },
            },
          },
        },
      });

      // Santa Rita: identificação eletrônica do rebanho e castração dos bezerros.
      if (prop === "SR" && daysAgo === 72) {
        steps.push({ type: "rfid" }, { type: "neutering" });
        const rfidManagement = await prisma.rfidManagement.create({
          data: { managementSessionId: session.id },
        });
        for (const a of present.filter((p) => !p.spec.skipRfid && !p.rfid)) {
          a.rfid = nextRfid();
          await prisma.animalRfidTagging.create({
            data: {
              animalId: a.id,
              rfid: a.rfid,
              managementId: rfidManagement.id,
              identifiedAt: sessionDate,
            },
          });
          await prisma.animal.update({
            where: { id: a.id },
            data: { currentRfid: a.rfid },
          });
        }
        await prisma.neuteringManagement.create({
          data: {
            managementSessionId: session.id,
            items: {
              create: present
                .filter((p) => p.spec.neuteredDaysAgo === 72)
                .map((p) => ({
                  animalId: p.id,
                  techniqueId: ctx.neuteringTechniques["Cirúrgica"],
                  neuteredAt: sessionDate,
                })),
            },
          },
        });
      }

      // Vacinação contra aftosa (dose fixa por animal); próxima dose no futuro.
      if (daysAgo === sessions[3]) {
        const health = await prisma.healthManagement.create({
          data: {
            typeId: ctx.healthTypes["Vacinação"],
            title: "Febre aftosa",
            veterinarianId: ctx.people.vet,
            managementSessionId: session.id,
            performedAt: sessionDate,
            doseType: "FIXED",
            doseMl: 2,
            nextDueDate: dateAgo(daysAgo - 180),
            items: {
              create: present.map((a) => ({ animalId: a.id, doseMl: 2 })),
            },
          },
        });
        steps.push({ type: "health", healthManagementId: health.id });
      }
      // Vermifugação (dose por peso: 1 ml a cada 50 kg), carência já encerrada.
      if (daysAgo === sessions[2]) {
        const health = await prisma.healthManagement.create({
          data: {
            typeId: ctx.healthTypes["Vermifugação"],
            title: "Ivermectina 1%",
            managementSessionId: session.id,
            performedAt: sessionDate,
            doseType: "PER_WEIGHT",
            doseMl: 1,
            doseWeightKg: 50,
            withdrawalEndDate: dateAgo(daysAgo - 35),
            items: {
              create: weighed.map((a) => ({
                animalId: a.id,
                doseMl: round(a.weights.get(daysAgo)! / 50, 1),
              })),
            },
          },
        });
        steps.push({ type: "health", healthManagementId: health.id });
      }
      // Carrapaticida (dose por peso: 1 ml a cada 10 kg) com carência ainda vigente.
      if (daysAgo === sessions[0]) {
        const health = await prisma.healthManagement.create({
          data: {
            typeId: ctx.healthTypes["Controle de ectoparasitas"],
            title: "Carrapaticida pour-on",
            managementSessionId: session.id,
            performedAt: sessionDate,
            doseType: "PER_WEIGHT",
            doseMl: 1,
            doseWeightKg: 10,
            withdrawalEndDate: dateAgo(daysAgo - 30),
            nextDueDate: dateAgo(daysAgo - 60),
            items: {
              create: weighed.map((a) => ({
                animalId: a.id,
                doseMl: round(a.weights.get(daysAgo)! / 10, 1),
              })),
            },
          },
        });
        steps.push({ type: "health", healthManagementId: health.id });
      }

      await prisma.managementStep.createMany({
        data: toStepRows(steps).map((row) => ({
          ...row,
          managementSessionId: session.id,
        })),
      });
    }
  }

  // Sessão planejada, ainda não realizada: pesagem e vermifugação da recria. Sem
  // apartação: os mais pesados da recria já têm transferência pendente para a engorda
  // (seedTransfers), e as duas decidiriam o lote deles (docs/data-dictionary.md, 2.9).
  const recria = animals.filter(
    (a) => finalBatch(a.spec) === "SR:Recria" && !a.spec.exit,
  );
  const planned = await prisma.managementSession.create({
    data: {
      propertyId: ctx.properties.SR,
      scheduledAt: ago(-18),
      title: "Pesagem e vermifugação da recria",
      notes: "Próxima pesagem mensal",
      participants: { create: recria.map((a) => ({ animalId: a.id })) },
      weighingManagement: { create: {} },
    },
  });
  const plannedHealth = await prisma.healthManagement.create({
    data: {
      typeId: ctx.healthTypes["Vermifugação"],
      title: "Ivermectina 1%",
      managementSessionId: planned.id,
      performedAt: ago(-18),
      doseType: "PER_WEIGHT",
      doseMl: 1,
      doseWeightKg: 50,
      withdrawalEndDate: dateAgo(-18 - 35),
    },
  });
  await prisma.managementStep.createMany({
    data: toStepRows([
      { type: "weighing" },
      { type: "health", healthManagementId: plannedHealth.id },
    ]).map((row) => ({ ...row, managementSessionId: planned.id })),
  });

  console.log(
    "- sessões de manejo (pesagem, identificação, castração, sanitário) criadas",
  );
}

async function seedSpecialCases(ctx: Ctx, animals: SeededAnimal[]) {
  const activeIn = (batch: string) =>
    animals.filter((a) => finalBatch(a.spec) === batch && !a.spec.exit);
  const engorda = activeIn("SR:Engorda");
  const recria = activeIn("SR:Recria");
  const reproducao = activeIn("SR:Reprodução");

  // Pesagem corrigida (guarda o valor original) e pesagem cancelada (duplicada).
  const toCorrect = await prisma.animalWeighing.findFirst({
    where: { animalId: engorda[0].id, managementId: { not: null } },
    orderBy: { id: "desc" },
    skip: 1,
  });
  if (toCorrect) {
    await prisma.animalWeighing.update({
      where: { id: toCorrect.id },
      data: {
        originalWeight: toCorrect.weight.toNumber() + 50,
        correctedAt: ago(40),
        notes: "Correção: valor digitado errado na balança",
      },
    });
  }
  await prisma.animalWeighing.create({
    data: {
      animalId: engorda[1].id,
      weight: engorda[1].weights.get(12)!,
      weighedAt: ago(12),
      cancelledAt: ago(11),
      notes: "Pesagem lançada em duplicidade",
    },
  });

  // Brinco perdido e substituído; brinco removido (fica só o RFID).
  const lostTag = engorda[2];
  const newTag = `${lostTag.tag}B`;
  await prisma.animalTagging.create({
    data: {
      animalId: lostTag.id,
      tag: newTag,
      identifiedAt: ago(35),
      notes: "Brinco perdido no pasto; novo brinco aplicado",
    },
  });
  await prisma.animal.update({
    where: { id: lostTag.id },
    data: { currentTag: newTag },
  });
  lostTag.tag = newTag;

  const removedTag = reproducao[0];
  await prisma.animalTagging.create({
    data: {
      animalId: removedTag.id,
      tag: null,
      identifiedAt: ago(20),
      notes: "Brinco removido por lesão na orelha",
    },
  });
  await prisma.animal.update({
    where: { id: removedTag.id },
    data: { currentTag: null },
  });

  // Tratamento individual com veterinário, dose por peso e carência vigente.
  await prisma.healthManagement.create({
    data: {
      typeId: ctx.healthTypes["Tratamento"],
      title: "Pneumonia — antibiótico",
      veterinarianId: ctx.people.vet,
      performedAt: ago(9),
      withdrawalEndDate: dateAgo(-19),
      doseType: "PER_WEIGHT",
      doseMl: 1,
      doseWeightKg: 10,
      items: {
        create: [
          {
            animalId: engorda[3].id,
            doseMl: 42,
            notes: "Tosse e febre (40,2 °C)",
          },
          { animalId: recria[0].id, doseMl: 28, notes: "Secreção nasal" },
        ],
      },
    },
  });
  // Exame andrológico do touro.
  const bull = animals.find((a) => a.spec.name === "Imperador")!;
  await prisma.healthManagement.create({
    data: {
      typeId: ctx.healthTypes["Exame"],
      title: "Exame andrológico",
      veterinarianId: ctx.people.vet,
      performedAt: ago(140),
      items: {
        create: [
          {
            animalId: bull.id,
            notes: "Apto para a estação de monta",
          },
        ],
      },
    },
  });
  // Brucelose das bezerras (dose fixa).
  const heifers = animals.filter(
    (a) =>
      a.spec.sex === "FEMALE" &&
      a.spec.origin === "BIRTH" &&
      propAt(a.spec, 130) === "SR",
  );
  await prisma.healthManagement.create({
    data: {
      typeId: ctx.healthTypes["Vacinação"],
      title: "Brucelose (B19)",
      veterinarianId: ctx.people.vet,
      performedAt: ago(130),
      doseType: "FIXED",
      doseMl: 2,
      items: { create: heifers.map((a) => ({ animalId: a.id, doseMl: 2 })) },
    },
  });

  // Peso atual (desnormalizado) = pesagem válida mais recente.
  for (const a of animals) {
    const newest = await prisma.animalWeighing.findFirst({
      where: { animalId: a.id, cancelledAt: null },
      orderBy: [{ weighedAt: "desc" }, { id: "desc" }],
    });
    if (newest) {
      await prisma.animal.update({
        where: { id: a.id },
        data: { currentWeight: newest.weight },
      });
    }
  }

  return { engorda, recria };
}

async function seedPurchases(ctx: Ctx, animals: SeededAnimal[]) {
  for (const [key, p] of Object.entries(PURCHASES)) {
    const bought = animals.filter((a) => a.spec.purchase === key);
    const entryWeights = bought.map(
      (a) => weightAt(a.spec, a.spec.entryDaysAgo) ?? 0,
    );
    const totalWeight = entryWeights.reduce((s, w) => s + w, 0);

    const weightOf = new Map(bought.map((a, i) => [a.id, entryWeights[i]]));
    const pricing = p.pricing;

    // Paga na data da compra; consolidada depois da última recepção (abaixo).
    const event = await prisma.purchaseEvent.create({
      data: {
        title: p.title,
        purchaseDate: ago(p.daysAgo),
        paymentDate: ago(p.daysAgo),
        notes: p.notes,
        sellerId: ctx.people[p.seller],
        destinationPropertyId: ctx.properties[p.prop],
      },
    });

    // Custo individual. Por arroba: peso vivo ÷ 30 × preço; por cabeça: o preço;
    // valor fechado: rateio proporcional ao peso (costSplit BY_WEIGHT).
    const costOf = (a: SeededAnimal) => {
      const weight = weightOf.get(a.id)!;
      if (pricing.type === "PER_ARROBA")
        return (weight / 30) * pricing.pricePerArroba;
      if (pricing.type === "PER_HEAD") return pricing.pricePerHead;
      return (pricing.total * weight) / totalWeight;
    };

    // Uma categoria por sexo (é como o gado costuma ser negociado).
    const categoryOf = new Map<string, number>();
    for (const sex of ["MALE", "FEMALE"] as Sex[]) {
      const group = bought.filter((a) => a.spec.sex === sex);
      if (!group.length) continue;
      const groupWeight = group.reduce((s, a) => s + weightOf.get(a.id)!, 0);
      const ages = group
        .filter((a) => a.spec.birthDaysAgo != null)
        .map((a) => Math.floor((a.spec.birthDaysAgo! - p.daysAgo) / 30.4));
      const breeds = new Set(group.map((a) => a.spec.breed));

      const category = await prisma.purchaseCategory.create({
        data: {
          eventId: event.id,
          sex,
          breedId:
            breeds.size === 1 ? ctx.breeds[group[0].spec.breed] : undefined,
          minAgeMonths: ages.length ? Math.min(...ages) : null,
          maxAgeMonths: ages.length ? Math.max(...ages) : null,
          expectedQuantity: group.length,
          pricingType: pricing.type,
          unitPrice:
            pricing.type === "PER_ARROBA"
              ? pricing.pricePerArroba
              : pricing.type === "PER_HEAD"
                ? pricing.pricePerHead
                : null,
          totalPrice:
            pricing.type === "LUMP_SUM"
              ? round((pricing.total * groupWeight) / totalWeight, 2)
              : null,
          // Peso de embarque: o de chegada acrescido da quebra acordada.
          invoicedWeight:
            pricing.type === "PER_ARROBA"
              ? round(groupWeight / (1 - (p.shrinkPercent ?? 0) / 100), 2)
              : null,
          shrinkPercent: pricing.type === "PER_ARROBA" ? p.shrinkPercent : null,
          costSplit: pricing.type === "LUMP_SUM" ? "BY_WEIGHT" : "EQUAL",
        },
      });
      for (const a of group) categoryOf.set(a.id, category.id);
    }

    // Uma recepção (sessão de manejo já consolidada) por dia de chegada: compras
    // entregues em mais de uma viagem geram mais de uma recepção.
    const trips = [...new Set(bought.map((a) => a.spec.entryDaysAgo))].sort(
      (a, b) => b - a,
    );
    for (const [tripIndex, entryDaysAgo] of trips.entries()) {
      const arrived = bought.filter(
        (a) => a.spec.entryDaysAgo === entryDaysAgo,
      );
      const session = await prisma.managementSession.create({
        data: {
          propertyId: ctx.properties[p.prop],
          title: `Recepção ${tripIndex + 1} — ${p.title}`,
          scheduledAt: ago(entryDaysAgo),
          performedAt: ago(entryDaysAgo),
          confirmedAt: ago(entryDaysAgo),
          participants: { create: arrived.map((a) => ({ animalId: a.id })) },
        },
      });
      // A compra incorpora a sessão de manejo como recepção (lote de entrada = lote da compra).
      const reception = await prisma.purchaseReception.create({
        data: {
          purchaseEventId: event.id,
          managementSessionId: session.id,
          entryBatchId: ctx.batches[p.batch],
          // Cada carga tem seus documentos; as viagens seguintes ganham um sufixo.
          gtaNumber: p.gta && (tripIndex ? `${p.gta}-${tripIndex + 1}` : p.gta),
          invoiceNumber:
            p.invoice &&
            (tripIndex ? `${p.invoice}-${tripIndex + 1}` : p.invoice),
        },
      });

      for (const a of arrived) {
        await prisma.purchasedAnimal.create({
          data: {
            purchaseEventId: event.id,
            categoryId: categoryOf.get(a.id)!,
            receptionId: reception.id,
            animalId: a.id,
            cost: round(costOf(a), 2),
          },
        });
      }
    }

    // Consolidada no dia da última chegada: custos rateados.
    await prisma.purchaseEvent.update({
      where: { id: event.id },
      data: { confirmedAt: ago(Math.min(...trips)) },
    });

    if (p.estimatedBirth) {
      await prisma.animal.updateMany({
        where: {
          id: { in: bought.map((a) => a.id) },
          birthDate: { not: null },
        },
        data: { birthDateEstimated: true },
      });
    }
  }
  // Compra negociada e ainda não entregue (nem paga): para testar a recepção do começo.
  // Os machos são pesados na chegada: o peso faturado fica em branco até lá.
  await prisma.purchaseEvent.create({
    data: {
      title: "Bezerros desmamados — leilão set/26",
      purchaseDate: ago(3),
      notes: "Entrega prevista para esta semana; machos pesados na chegada",
      sellerId: ctx.people.leiloes,
      destinationPropertyId: ctx.properties.SR,
      categories: {
        create: [
          {
            sex: "MALE",
            minAgeMonths: 8,
            maxAgeMonths: 12,
            breedId: ctx.breeds.Nelore,
            expectedQuantity: 12,
            pricingType: "PER_ARROBA",
            unitPrice: 310,
          },
          {
            sex: "FEMALE",
            minAgeMonths: 8,
            maxAgeMonths: 12,
            breedId: ctx.breeds.Nelore,
            expectedQuantity: 8,
            pricingType: "LUMP_SUM",
            totalPrice: 14000,
          },
        ],
      },
    },
  });

  console.log(
    `- ${Object.keys(PURCHASES).length + 1} compras criadas (com categorias e recepções; 1 aguardando entrega)`,
  );
}

async function seedTransfers(
  ctx: Ctx,
  animals: SeededAnimal[],
  groups: { engorda: SeededAnimal[]; recria: SeededAnimal[] },
) {
  // Transferências de lote confirmadas, agrupando as trocas de lote do mesmo dia.
  const moves = new Map<
    string,
    { daysAgo: number; from: string; to: string; ids: string[] }
  >();
  for (const a of animals) {
    for (let i = 1; i < a.spec.batches.length; i++) {
      const [from] = a.spec.batches[i - 1];
      const [to, daysAgo] = a.spec.batches[i];
      if (propOf(from) !== propOf(to)) continue; // entre fazendas: tratada abaixo
      const key = `${daysAgo}|${from}|${to}`;
      const move = moves.get(key) ?? { daysAgo, from, to, ids: [] };
      move.ids.push(a.id);
      moves.set(key, move);
    }
  }
  for (const m of moves.values()) {
    await prisma.animalBatchTransfer.create({
      data: {
        transferredAt: ago(m.daysAgo),
        confirmedAt: ago(m.daysAgo),
        notes: m.to.endsWith("Recria")
          ? "Desmama"
          : "Formação do lote de reprodução",
        destinationBatchId: ctx.batches[m.to],
        propertyId: ctx.properties[propOf(m.to)],
        items: {
          create: m.ids.map((animalId) => ({
            animalId,
            originBatchId: ctx.batches[m.from],
          })),
        },
      },
    });
  }

  // Transferência entre fazendas (Boa Vista → Santa Rita), enviada e recebida.
  const moved = animals.filter((a) =>
    a.spec.batches.some(([b]) => propOf(b) !== propOf(a.spec.batches[0][0])),
  );
  if (moved.length) {
    const daysAgo = moved[0].spec.batches.at(-1)![1];
    await prisma.animalPropertyTransfer.create({
      data: {
        transferredAt: ago(daysAgo),
        confirmedAt: ago(daysAgo + 1),
        receivedAt: ago(daysAgo),
        gtaNumber: "MT-5566778",
        notes: "Novilhos para recria na Santa Rita",
        originPropertyId: ctx.properties.BV,
        destinationPropertyId: ctx.properties.SR,
        originBatchId: ctx.batches["BV:Recria"],
        destinationBatchId: ctx.batches["SR:Recria"],
        items: { create: moved.map((a) => ({ animalId: a.id })) },
      },
    });
  }

  // Planos pendentes (um com origens misturadas) e um cancelado.
  const heaviest = (list: SeededAnimal[], n: number) =>
    [...list]
      .sort(
        (x, y) =>
          Math.max(...y.weights.values()) - Math.max(...x.weights.values()),
      )
      .slice(0, n);
  await prisma.animalBatchTransfer.create({
    data: {
      transferredAt: eventAt(-5),
      notes: "Apartar os mais pesados da recria para a engorda",
      destinationBatchId: ctx.batches["SR:Engorda"],
      propertyId: ctx.properties.SR,
      items: {
        create: heaviest(groups.recria, 3).map((a) => ({ animalId: a.id })),
      },
    },
  });
  await prisma.animalBatchTransfer.create({
    data: {
      transferredAt: eventAt(0),
      notes: "Separar animais em tratamento",
      destinationBatchId: ctx.batches["SR:Quarentena"],
      propertyId: ctx.properties.SR,
      items: {
        create: [
          {
            animalId: groups.engorda[3].id,
            notes: "Em tratamento de pneumonia",
          },
          { animalId: groups.recria[0].id },
        ],
      },
    },
  });
  const oldCows = animals.filter(
    (a) =>
      finalBatch(a.spec) === "SR:Cria" &&
      a.spec.sex === "FEMALE" &&
      (a.spec.birthDaysAgo ?? 9999) > 1000,
  );
  await prisma.animalBatchTransfer.create({
    data: {
      transferredAt: eventAt(30),
      cancelledAt: ago(28),
      notes: "Reforço de vacas para a estação de monta (desistimos)",
      destinationBatchId: ctx.batches["SR:Reprodução"],
      propertyId: ctx.properties.SR,
      items: { create: oldCows.slice(0, 2).map((a) => ({ animalId: a.id })) },
    },
  });
  const bvEngorda = animals.filter(
    (a) => finalBatch(a.spec) === "BV:Engorda" && !a.spec.exit,
  );
  await prisma.animalBatchTransfer.create({
    data: {
      transferredAt: eventAt(-10),
      notes: "Completar a terminação",
      destinationBatchId: ctx.batches["BV:Terminação"],
      propertyId: ctx.properties.BV,
      items: {
        create: heaviest(bvEngorda, 2).map((a) => ({ animalId: a.id })),
      },
    },
  });

  console.log(
    `- ${moves.size} transferências de lote confirmadas, 3 pendentes, 1 cancelada e 1 entre fazendas`,
  );
}

async function seedUserSettings(ctx: Ctx) {
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const user of users) {
    await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: { userId: user.id, currentPropertyId: ctx.properties.SR },
      update: { currentPropertyId: ctx.properties.SR },
    });
  }
}

// ---------------------------------------------------------------------------
// Fluxos em andamento: sessões de manejo e compras/recepções em cada situação que o
// sistema prevê. Usa as mesmas funções das rotas da API (recebimento, registro das
// etapas, consolidação), para que os dados fiquem iguais aos produzidos pela aplicação.
// ---------------------------------------------------------------------------

type Tx = Prisma.TransactionClient;
type PlanStep = { type: string } & Record<string, unknown>;

const WORKFLOW_TX = { timeout: 120_000 };

// Instante durante o dia de `n` dias atrás (ex.: consolidação no fim do manejo).
const atHour = (n: number, hour: number) =>
  new Date(TODAY.getTime() - n * DAY_MS + hour * 60 * 60 * 1000);

// Data e hora informadas de um evento (sessão, transferência) `n` dias atrás, às 8h; negativo
// = futuro. Hoje, nunca depois de agora, para o evento não ficar no futuro.
function eventAt(n: number) {
  const at = atHour(n, 8);
  return n === 0 && at > new Date() ? new Date() : at;
}

// Cria a sessão já iniciada na data informada, com as etapas do plano.
async function createStartedSession(
  tx: Tx,
  data: {
    propertyId: string;
    title: string;
    daysAgo: number;
    notes?: string;
    steps: PlanStep[];
    animalIds?: string[];
  },
) {
  const session = await tx.managementSession.create({
    data: {
      propertyId: data.propertyId,
      title: data.title,
      notes: data.notes,
      scheduledAt: eventAt(data.daysAgo),
      performedAt: eventAt(data.daysAgo),
      participants: data.animalIds
        ? { create: data.animalIds.map((animalId) => ({ animalId })) }
        : undefined,
    },
  });
  const steps = await applyPlanSteps(
    tx,
    session,
    [],
    data.steps.map((s) => planStepSchema.parse(s)),
  );
  return { id: session.id, steps };
}

const keyOf = (steps: SessionStep[], type: string) =>
  stepKey(steps.find((s) => s.type === type)!);

async function seedOpenSessions(ctx: Ctx) {
  // A sessão tem apartação: fica sem os animais que já têm transferência pendente.
  const engorda = await prisma.animal.findMany({
    where: {
      currentBatchId: ctx.batches["SR:Engorda"],
      status: "ACTIVE",
      batchTransferItems: {
        none: { transfer: { confirmedAt: null, cancelledAt: null } },
      },
    },
    orderBy: { code: "asc" },
    take: 12,
  });

  // Em andamento (hoje): uns completos, uns parciais, o resto a manejar.
  await prisma.$transaction(async (tx) => {
    const session = await createStartedSession(tx, {
      propertyId: ctx.properties.SR,
      title: "Pesagem, vermifugação e apartação da engorda",
      notes: "Separar os animais que voltam para a recria",
      daysAgo: 0,
      animalIds: engorda.map((a) => a.id),
      steps: [
        { type: "weighing" },
        {
          type: "health",
          typeId: ctx.healthTypes["Vermifugação"],
          title: "Ivermectina 1%",
          doseType: "PER_WEIGHT",
          doseMl: 1,
          doseWeightKg: 50,
        },
        {
          type: "batch",
          suggestedBatchIds: [
            ctx.batches["SR:Engorda"],
            ctx.batches["SR:Recria"],
          ],
        },
      ],
    });
    const weighing = keyOf(session.steps, "weighing");
    const health = keyOf(session.steps, "health");
    const batch = keyOf(session.steps, "batch");

    for (const [i, a] of engorda.entries()) {
      const weightKg = Math.round((a.currentWeight?.toNumber() ?? 380) + 12);
      if (i < 4) {
        // Completos; dois voltam para a recria.
        await saveAnimalStep(tx, session.id, a.id, weighing, { weightKg });
        await saveAnimalStep(tx, session.id, a.id, health, {
          doseMl: Math.round(weightKg / 5) / 10, // 1 ml a cada 50 kg
        });
        await saveAnimalStep(tx, session.id, a.id, batch, {
          batchId: i >= 2 ? ctx.batches["SR:Recria"] : null,
        });
      } else if (i < 7) {
        // Parciais: pesados; o sanitário ficou para depois.
        await saveAnimalStep(tx, session.id, a.id, weighing, { weightKg });
      }
    }
  }, WORKFLOW_TX);

  // Em andamento (hoje) com todos os tipos de manejo, para exercitar cada tela de etapa.
  // Os animais não podem estar em outra operação aberta (a apartação decide o lote).
  const candidates = await prisma.animal.findMany({
    where: {
      currentPropertyId: ctx.properties.SR,
      status: "ACTIVE",
      currentBatchId: { not: ctx.batches["SR:Engorda"] },
    },
    orderBy: { code: "asc" },
  });
  const committed = await findCommitments(
    prisma,
    candidates.map((a) => a.id),
  );
  const completo = candidates
    .filter((a) => !committed.get(a.id)?.length)
    .slice(0, 10);

  await prisma.$transaction(async (tx) => {
    const session = await createStartedSession(tx, {
      propertyId: ctx.properties.SR,
      title: "Manejo completo",
      notes: "Pesagem, castração, identificação, vacinação e apartação",
      daysAgo: 0,
      animalIds: completo.map((a) => a.id),
      steps: [
        { type: "weighing" },
        {
          type: "neutering",
          suggestedTechniqueId: ctx.neuteringTechniques["Burdizzo"],
        },
        { type: "tag" },
        { type: "rfid" },
        {
          type: "health",
          typeId: ctx.healthTypes["Vacinação"],
          title: "Vacina clostridiose",
          doseType: "FIXED",
          doseMl: 5,
        },
        {
          type: "batch",
          suggestedBatchIds: [
            ctx.batches["SR:Recria"],
            ctx.batches["SR:Engorda"],
          ],
        },
      ],
    });
    const weighing = keyOf(session.steps, "weighing");
    const neutering = keyOf(session.steps, "neutering");
    const tag = keyOf(session.steps, "tag");
    const rfid = keyOf(session.steps, "rfid");
    const health = keyOf(session.steps, "health");
    const batch = keyOf(session.steps, "batch");

    // Faixa própria de brincos e RFIDs, fora das usadas pelo restante do seed.
    let rfidCounter = 8000;
    const nextRfid = () => `076000${String(1_000_000 + ++rfidCounter)}`;

    for (const [i, a] of completo.entries()) {
      if (i >= 6) continue; // o resto ainda a manejar
      const weightKg = Math.round((a.currentWeight?.toNumber() ?? 250) + 8);
      await saveAnimalStep(tx, session.id, a.id, weighing, { weightKg });
      await saveAnimalStep(tx, session.id, a.id, tag, {
        value: `SR-${9001 + i}`,
      });
      if (i >= 3) continue; // parciais: só pesados e brincados

      // Completos: a castração só vale para machos ainda inteiros.
      if (a.sex === "MALE" && !a.neutered) {
        await saveAnimalStep(tx, session.id, a.id, neutering, {
          techniqueId: ctx.neuteringTechniques["Burdizzo"],
        });
      }
      await saveAnimalStep(tx, session.id, a.id, rfid, { value: nextRfid() });
      await saveAnimalStep(tx, session.id, a.id, health, { doseMl: 5 });
      await saveAnimalStep(tx, session.id, a.id, batch, {
        batchId: i === 0 ? ctx.batches["SR:Engorda"] : null,
      });
    }
  }, WORKFLOW_TX);

  // Cancelada antes de começar (sem registros).
  const cria = await prisma.animal.findMany({
    where: { currentBatchId: ctx.batches["SR:Cria"], status: "ACTIVE" },
    take: 6,
  });
  await prisma.$transaction(async (tx) => {
    const session = await createStartedSession(tx, {
      propertyId: ctx.properties.SR,
      title: "Pesagem da cria",
      notes: "Cancelada: chuva forte, curral alagado",
      daysAgo: 6,
      animalIds: cria.map((a) => a.id),
      steps: [{ type: "weighing" }],
    });
    await tx.managementSession.update({
      where: { id: session.id },
      data: { performedAt: null, cancelledAt: atHour(6, 7) },
    });
  }, WORKFLOW_TX);
}

type CategoryInput = Omit<Prisma.PurchaseCategoryCreateManyInput, "eventId">;

async function createOpenPurchase(
  tx: Tx,
  ctx: Ctx,
  data: {
    title: string;
    seller: PersonKey;
    daysAgo: number;
    notes?: string;
    paidDaysAgo?: number;
    paymentReference?: string;
    cancelledDaysAgo?: number;
    categories: CategoryInput[];
  },
) {
  return tx.purchaseEvent.create({
    data: {
      title: data.title,
      purchaseDate: dateAgo(data.daysAgo),
      notes: data.notes,
      sellerId: ctx.people[data.seller],
      destinationPropertyId: ctx.properties.SR,
      paymentDate: data.paidDaysAgo != null ? dateAgo(data.paidDaysAgo) : null,
      paymentReference: data.paymentReference,
      cancelledAt:
        data.cancelledDaysAgo != null ? atHour(data.cancelledDaysAgo, 9) : null,
      categories: { create: data.categories },
    },
    include: { categories: { orderBy: { id: "asc" } } },
  });
}

// Abre uma recepção como a área de recepções: sessão iniciada, lote de entrada
// Quarentena e os documentos da carga.
async function openReception(
  tx: Tx,
  ctx: Ctx,
  purchase: { id: string; title: string },
  data: {
    trip: number;
    daysAgo: number;
    steps: PlanStep[];
    gta?: string;
    invoice?: string;
  },
) {
  const session = await createStartedSession(tx, {
    propertyId: ctx.properties.SR,
    title: `Recepção ${data.trip} — ${purchase.title}`,
    daysAgo: data.daysAgo,
    steps: data.steps,
  });
  await tx.purchaseReception.create({
    data: {
      purchaseEventId: purchase.id,
      managementSessionId: session.id,
      entryBatchId: ctx.batches["SR:Quarentena"],
      gtaNumber: data.gta,
      invoiceNumber: data.invoice,
    },
  });
  return session;
}

// Recebe um animal como no painel da recepção.
async function receive(
  tx: Tx,
  sessionId: string,
  categoryId: number,
  ageMonths: number,
) {
  const session = await tx.managementSession.findUniqueOrThrow({
    where: { id: sessionId },
  });
  const reception = await findReception(tx, sessionId);
  return receiveAnimal(
    tx,
    {
      id: session.id,
      propertyId: session.propertyId,
      performedAt: session.performedAt!,
    },
    reception!,
    { categoryId, ageMonths, name: null },
  );
}

async function seedOpenPurchases(ctx: Ctx) {
  const nelore = ctx.breeds.Nelore;
  let tagCounter = 700;
  const nextTag = () => `C-${++tagCounter}`;
  let rfidCounter = 9000;
  const nextRfid = () => `076000${String(1_000_000 + ++rfidCounter)}`;

  // 1. Em andamento e não paga, em duas viagens: a 1ª concluída; a 2ª recebendo
  //    agora (animais completos, parciais e a manejar).
  await prisma.$transaction(async (tx) => {
    const purchase = await createOpenPurchase(tx, ctx, {
      title: "Novilhas Nelore — Faz. Boa Vista",
      seller: "boaVista",
      daysAgo: 12,
      notes: "Entrega em duas viagens",
      categories: [
        {
          sex: "FEMALE",
          minAgeMonths: 14,
          maxAgeMonths: 20,
          breedId: nelore,
          expectedQuantity: 12,
          pricingType: "PER_HEAD",
          unitPrice: 2600,
        },
      ],
    });
    const [novilhas] = purchase.categories;

    const trip1 = await openReception(tx, ctx, purchase, {
      trip: 1,
      daysAgo: 5,
      gta: "MT-2203341",
      invoice: "NF 004.112",
      steps: [{ type: "tag" }, { type: "weighing" }],
    });
    for (let i = 0; i < 4; i++) {
      const id = await receive(tx, trip1.id, novilhas.id, 15 + i);
      await saveAnimalStep(tx, trip1.id, id, "tag", { value: nextTag() });
      await saveAnimalStep(tx, trip1.id, id, "weighing", {
        weightKg: 305 + i * 11,
      });
    }
    await consolidateSession(tx, trip1.id, atHour(5, 17));

    const trip2 = await openReception(tx, ctx, purchase, {
      trip: 2,
      daysAgo: 0,
      gta: "MT-2203398",
      steps: [{ type: "tag" }, { type: "rfid" }, { type: "weighing" }],
    });
    for (let i = 0; i < 5; i++) {
      const id = await receive(tx, trip2.id, novilhas.id, 16 + (i % 3));
      if (i < 2) {
        await saveAnimalStep(tx, trip2.id, id, "tag", { value: nextTag() });
        await saveAnimalStep(tx, trip2.id, id, "rfid", { value: nextRfid() });
        await saveAnimalStep(tx, trip2.id, id, "weighing", {
          weightKg: 298 + i * 9,
        });
      } else if (i < 4) {
        await saveAnimalStep(tx, trip2.id, id, "tag", { value: nextTag() });
      }
    }
  }, WORKFLOW_TX);

  // 2. Paga, tudo recebido e recepções concluídas: pronta para consolidar.
  await prisma.$transaction(async (tx) => {
    const purchase = await createOpenPurchase(tx, ctx, {
      title: "Garrotes anelorados — Maria",
      seller: "maria",
      daysAgo: 25,
      paidDaysAgo: 20,
      paymentReference: "TED — Banco do Brasil",
      categories: [
        {
          sex: "MALE",
          minAgeMonths: 18,
          maxAgeMonths: 24,
          expectedQuantity: 6,
          pricingType: "PER_ARROBA",
          unitPrice: 305,
          invoicedWeight: 2280,
          shrinkPercent: 3,
        },
      ],
    });
    const [garrotes] = purchase.categories;
    for (const [trip, daysAgo, count] of [
      [1, 18, 4],
      [2, 15, 2],
    ] as const) {
      const session = await openReception(tx, ctx, purchase, {
        trip,
        daysAgo,
        gta: `MG-77810${trip}`,
        invoice: `NF 010.55${trip}`,
        steps: [{ type: "weighing" }],
      });
      for (let i = 0; i < count; i++) {
        const id = await receive(tx, session.id, garrotes.id, 20);
        await saveAnimalStep(tx, session.id, id, "weighing", {
          weightKg: 362 + i * 8 + trip * 3,
        });
      }
      await consolidateSession(tx, session.id, atHour(daysAgo, 17));
    }
  }, WORKFLOW_TX);

  // 3. Paga, entrega incompleta (4 de 6) e um caminhão que não veio (recepção
  //    cancelada): consolidar declara que não vem mais nada. Valor fechado, rateio igual.
  await prisma.$transaction(async (tx) => {
    const purchase = await createOpenPurchase(tx, ctx, {
      title: "Bezerras de reposição — Insumos",
      seller: "insumos",
      daysAgo: 30,
      paidDaysAgo: 28,
      paymentReference: "PIX",
      categories: [
        {
          sex: "FEMALE",
          minAgeMonths: 7,
          maxAgeMonths: 10,
          expectedQuantity: 6,
          pricingType: "LUMP_SUM",
          totalPrice: 10200,
          costSplit: "EQUAL",
        },
      ],
    });
    const [bezerras] = purchase.categories;
    const session = await openReception(tx, ctx, purchase, {
      trip: 1,
      daysAgo: 22,
      gta: "GO-5501223",
      steps: [{ type: "weighing" }],
    });
    for (let i = 0; i < 4; i++) {
      const id = await receive(tx, session.id, bezerras.id, 8);
      await saveAnimalStep(tx, session.id, id, "weighing", {
        weightKg: 188 + i * 7,
      });
    }
    await consolidateSession(tx, session.id, atHour(22, 17));

    const noShow = await openReception(tx, ctx, purchase, {
      trip: 2,
      daysAgo: 16,
      steps: [{ type: "weighing" }],
    });
    await tx.managementSession.update({
      where: { id: noShow.id },
      data: { cancelledAt: atHour(16, 10) },
    });
  }, WORKFLOW_TX);

  // 4. Por arroba pesada na chegada: recepção concluída com todos pesados e o peso
  //    faturado ainda em branco (a tela sugere a soma de chegada); não paga.
  await prisma.$transaction(async (tx) => {
    const purchase = await createOpenPurchase(tx, ctx, {
      title: "Garrotes — pesados na chegada",
      seller: "leiloes",
      daysAgo: 10,
      notes: "Preço por arroba sobre o peso na balança da fazenda",
      categories: [
        {
          sex: "MALE",
          minAgeMonths: 12,
          maxAgeMonths: 18,
          breedId: nelore,
          expectedQuantity: 5,
          pricingType: "PER_ARROBA",
          unitPrice: 300,
        },
      ],
    });
    const [garrotes] = purchase.categories;
    const session = await openReception(tx, ctx, purchase, {
      trip: 1,
      daysAgo: 7,
      gta: "MG-6634102",
      invoice: "NF 000.931",
      steps: [{ type: "weighing" }, { type: "tag" }],
    });
    for (let i = 0; i < 5; i++) {
      const id = await receive(tx, session.id, garrotes.id, 14);
      await saveAnimalStep(tx, session.id, id, "weighing", {
        weightKg: 296 + i * 13,
      });
      await saveAnimalStep(tx, session.id, id, "tag", { value: nextTag() });
    }
    await consolidateSession(tx, session.id, atHour(7, 17));
  }, WORKFLOW_TX);

  // 5. Paga antes da entrega; recepção em andamento sem manejos (só o cadastro).
  await prisma.$transaction(async (tx) => {
    const purchase = await createOpenPurchase(tx, ctx, {
      title: "Touros Nelore PO — Faz. Boa Vista",
      seller: "boaVista",
      daysAgo: 8,
      paidDaysAgo: 6,
      categories: [
        {
          sex: "MALE",
          minAgeMonths: 30,
          maxAgeMonths: 40,
          breedId: nelore,
          expectedQuantity: 2,
          pricingType: "PER_HEAD",
          unitPrice: 17500,
          notes: "Com exame andrológico",
        },
      ],
    });
    const [touros] = purchase.categories;
    const session = await openReception(tx, ctx, purchase, {
      trip: 1,
      daysAgo: 0,
      gta: "MT-9910045",
      steps: [],
    });
    await receive(tx, session.id, touros.id, 34);
  }, WORKFLOW_TX);

  // 6. Cancelada: negociação desfeita antes da entrega (a recepção vazia também).
  await prisma.$transaction(async (tx) => {
    const purchase = await createOpenPurchase(tx, ctx, {
      title: "Vacas de descarte — negociação desfeita",
      seller: "carlos",
      daysAgo: 20,
      cancelledDaysAgo: 14,
      notes: "Vendedor desistiu da venda",
      categories: [
        {
          sex: "FEMALE",
          minAgeMonths: 60,
          expectedQuantity: 10,
          pricingType: "PER_ARROBA",
          unitPrice: 250,
        },
      ],
    });
    const session = await openReception(tx, ctx, purchase, {
      trip: 1,
      daysAgo: 15,
      steps: [{ type: "weighing" }],
    });
    await tx.managementSession.update({
      where: { id: session.id },
      data: { cancelledAt: atHour(14, 9) },
    });
  }, WORKFLOW_TX);
}

async function seedWorkflows(ctx: Ctx) {
  await seedOpenSessions(ctx);
  await seedOpenPurchases(ctx);
  console.log(
    "- fluxos em andamento: sessões (duas em andamento, cancelada) e 6 compras (recebendo, pronta para consolidar, entrega incompleta, pesada na chegada, paga antes da entrega, cancelada)",
  );
}

async function main() {
  await seedUsers();

  if ((await prisma.property.count()) > 0) {
    console.log(
      "\nO banco já tem propriedades; o seed de demonstração só popula um banco vazio.\n" +
        "Para recriar: pnpm exec prisma db push --force-reset && pnpm exec prisma db seed",
    );
    return;
  }

  const people = await seedPeople();
  const breeds = await seedBreeds();
  const healthTypes = await seedHealthTypes();
  const neuteringTechniques = await seedNeuteringTechniques();
  const brands = await seedBrands(people);
  const { properties, batches } = await seedPropertiesAreasBatches(people);
  const ctx: Ctx = {
    people,
    breeds,
    healthTypes,
    neuteringTechniques,
    brands,
    properties,
    batches,
  };

  const animals = await seedAnimals(ctx);
  await seedLossesAndSlaughters(ctx, animals);
  await seedSessions(ctx, animals);
  const groups = await seedSpecialCases(ctx, animals);
  await seedPurchases(ctx, animals);
  await seedTransfers(ctx, animals, groups);
  await seedWorkflows(ctx);
  await seedUserSettings(ctx);

  console.log(`\nSeed concluído. Login: admin@ifarm.local / ${PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
