import { z } from "zod";
import { Sexo, AnimalOrigem, AnimalStatus } from "@/generated/prisma/enums";


export const animalApiSchema = z.object({
  brinco:              z.string().min(1, "Este campo não pode ser vazio"),

  rfid:                z.string().optional().transform(v => v || null),
  nome_apelido:        z.string().optional().transform(v => v || null),
  mae_id:              z.string().optional().transform(v => v || null),
  pai_id:              z.string().optional().transform(v => v || null),
  fazenda_origem_nome: z.string().optional().transform(v => v || null),

  sexo:                z.preprocess( v => v === "" ? undefined : v, z.enum(Sexo).optional()),
  origem:              z.preprocess( v => v === "" ? undefined : v, z.enum(AnimalOrigem).optional()),
  status:              z.preprocess( v => v === "" ? undefined : v, z.enum(AnimalStatus).optional()),

  data_nascimento:     z.string().optional().transform(v => v ? new Date(`${v}T00:00:00`) : null),
  peso_nascimento_kg:  z.string().optional().transform(v => v ? parseFloat(v) : null),
  raca_id:             z.string().optional().transform(v => v ? parseInt(v) : null),
  lote_id:             z.string().optional().transform(v => v ? parseInt(v) : null),
  fazenda_origem_id:   z.string().optional().transform(v => v ? parseInt(v) : null),
  data_aquisicao:      z.string().optional().transform(v => v ? new Date(`${v}T00:00:00`) : null),
  valor_compra:        z.string().optional().transform(v => v ? parseFloat(v) : null),
  idade_entrada_meses: z.string().optional().transform(v => v ? parseInt(v) : null),
  peso_atual_kg:       z.string().optional().transform(v => v ? parseFloat(v) : null),
});

export const animalQuerySchema = z.object({
  page:     z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).optional().default(10),
  search:   z.string().trim().optional().default(""),
  status:   z.preprocess( v => v === "" ? undefined : v, z.enum(AnimalStatus).optional()),
  sexo:     z.preprocess( v => v === "" ? undefined : v, z.enum(Sexo).optional()),
});

export type AnimalQueryData = z.infer<typeof animalQuerySchema>;