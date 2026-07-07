import { z } from "zod";
import { Sexo, AnimalOrigem, AnimalStatus } from "@/generated/prisma/enums";


export const animalApiSchema = z.object({
  brinco:            z.string().min(1, "Este campo não pode ser vazio"),

  rfid:              z.string().optional().transform(v => v || null),
  nome:              z.string().optional().transform(v => v || null),
  maeId:             z.string().optional().transform(v => v || null),
  paiId:             z.string().optional().transform(v => v || null),
  fazendaOrigemNome: z.string().optional().transform(v => v || null),

  sexo:              z.preprocess( v => v === "" ? undefined : v, z.enum(Sexo).optional()),
  origem:            z.preprocess( v => v === "" ? undefined : v, z.enum(AnimalOrigem).optional()),
  status:            z.preprocess( v => v === "" ? undefined : v, z.enum(AnimalStatus).optional()),

  dataNascimento:    z.string().optional().transform(v => v ? new Date(`${v}T00:00:00`) : null),
  pesoNascimentoKg:  z.string().optional().transform(v => v ? parseFloat(v) : null),
  racaId:            z.string().optional().transform(v => v ? parseInt(v) : null),
  loteId:            z.string().optional().transform(v => v ? parseInt(v) : null),
  fazendaOrigemId:   z.string().optional().transform(v => v ? parseInt(v) : null),
  dataAquisicao:     z.string().optional().transform(v => v ? new Date(`${v}T00:00:00`) : null),
  valorCompra:       z.string().optional().transform(v => v ? parseFloat(v) : null),
  idadeEntradaMeses: z.string().optional().transform(v => v ? parseInt(v) : null),
  pesoAtualKg:       z.string().optional().transform(v => v ? parseFloat(v) : null),
});

export const animalQuerySchema = z.object({
  page:     z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).optional().default(10),
  search:   z.string().trim().optional().default(""),
  status:   z.preprocess( v => v === "" ? undefined : v, z.enum(AnimalStatus).optional()),
  sexo:     z.preprocess( v => v === "" ? undefined : v, z.enum(Sexo).optional()),
});

export type AnimalQueryData = z.infer<typeof animalQuerySchema>;