import { z } from "zod";

const enumValues = <T extends Record<string, string>>(e: T) =>
  Object.values(e) as [T[keyof T], ...T[keyof T][]];

export const EnumSexo = { M: "M", F: "F" } as const;
export const EnumAnimalOrigem = { NASCIMENTO: "NASCIMENTO", COMPRA: "COMPRA", TRANSFERENCIA: "TRANSFERENCIA" } as const;
export const EnumAnimalStatus = { ATIVO: "ATIVO", VENDIDO: "VENDIDO", MORTO: "MORTO", TRANSFERIDO: "TRANSFERIDO", DESCARTE: "DESCARTE", ABATE: "ABATE" } as const;

const animalBaseSchema = z.object({
  brinco:              z.string().min(1, "Este campo não pode ser vazio"),
  rfid:                z.string().optional(),
  nome_apelido:        z.string().optional(),
  sexo:                z.enum(enumValues(EnumSexo)),
  origem:              z.enum(enumValues(EnumAnimalOrigem)),
  status:              z.enum(enumValues(EnumAnimalStatus)),
  mae_id:              z.string().min(1, "Este campo não pode ser vazio"), //z.string().optional(),
  pai_id:              z.string().optional(),
  fazenda_origem_nome: z.string().optional(),
});

export const animalFormSchema = animalBaseSchema.extend({
  data_nascimento:     z.string().optional(),
  peso_nascimento_kg:  z.string().optional(),
  raca_id:             z.string().optional(),
  lote_id:             z.string().optional(),
  fazenda_origem_id:   z.string().optional(),
  data_aquisicao:      z.string().optional(),
  valor_compra:        z.string().optional(),
  idade_entrada_meses: z.string().optional(),
  peso_atual_kg:       z.string().optional(),
});

export const animalApiSchema = animalBaseSchema.extend({
  brinco:              z.string().optional().transform(v => v || null),
  rfid:                z.string().optional().transform(v => v || null),
  nome_apelido:        z.string().optional().transform(v => v || null),
  mae_id:              z.string().optional().transform(v => v || null),
  pai_id:              z.string().optional().transform(v => v || null),
  fazenda_origem_nome: z.string().optional().transform(v => v || null),
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

export type AnimalFormData = z.infer<typeof animalFormSchema>;
export type AnimalApiData = z.infer<typeof animalApiSchema>;
