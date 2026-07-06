import { z } from "zod";

const enumValues = <T extends Record<string, string>>(e: T) =>
  Object.values(e) as [T[keyof T], ...T[keyof T][]];

export const EnumSexo = { M: "M", F: "F" } as const;
export const EnumAnimalOrigem = { NASCIMENTO: "NASCIMENTO", COMPRA: "COMPRA", TRANSFERENCIA: "TRANSFERENCIA" } as const;
export const EnumAnimalStatus = { ATIVO: "ATIVO", VENDIDO: "VENDIDO", MORTO: "MORTO", TRANSFERIDO: "TRANSFERIDO", DESCARTE: "DESCARTE", ABATE: "ABATE" } as const;

export const animalFormSchema = z.object({
  brinco:              z.string().min(1, "Este campo não pode ser vazio"),
  rfid:                z.string().optional(),
  nome_apelido:        z.string().optional(),
  sexo:                z.enum(enumValues(EnumSexo), "Este campo não pode ser vazio"),
  origem:              z.enum(enumValues(EnumAnimalOrigem), "Este campo não pode ser vazio"),
  status:              z.enum(enumValues(EnumAnimalStatus), "Este campo não pode ser vazio"),
  mae_id:              z.string().optional(),
  pai_id:              z.string().optional(),
  fazenda_origem_nome: z.string().optional(),
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


export type AnimalFormData = z.infer<typeof animalFormSchema>;