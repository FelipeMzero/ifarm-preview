import { z } from "zod";

const enumValues = <T extends Record<string, string>>(e: T) =>
  Object.values(e) as [T[keyof T], ...T[keyof T][]];

export const EnumSexo = { MACHO: "MACHO", FEMEA: "FEMEA" } as const;
export const EnumAnimalOrigem = { NASCIMENTO: "NASCIMENTO", COMPRA: "COMPRA", TRANSFERENCIA: "TRANSFERENCIA" } as const;
export const EnumAnimalStatus = { ATIVO: "ATIVO", VENDIDO: "VENDIDO", MORTO: "MORTO", TRANSFERIDO: "TRANSFERIDO", DESCARTE: "DESCARTE", ABATE: "ABATE" } as const;

export const animalFormSchema = z.object({
  brinco:            z.string().min(1, "Este campo não pode ser vazio"),
  rfid:              z.string().optional(),
  nome:              z.string().optional(),
  sexo:              z.enum(enumValues(EnumSexo), "Este campo não pode ser vazio"),
  origem:            z.enum(enumValues(EnumAnimalOrigem), "Este campo não pode ser vazio"),
  status:            z.enum(enumValues(EnumAnimalStatus), "Este campo não pode ser vazio"),
  maeId:             z.string().optional(),
  paiId:             z.string().optional(),
  fazendaOrigemNome: z.string().optional(),
  dataNascimento:    z.string().optional(),
  pesoNascimentoKg:  z.string().optional(),
  racaId:            z.string().optional(),
  loteId:            z.string().optional(),
  fazendaOrigemId:   z.string().optional(),
  dataAquisicao:     z.string().optional(),
  valorCompra:       z.string().optional(),
  idadeEntradaMeses: z.string().optional(),
  pesoAtualKg:       z.string().optional(),
});


export type AnimalFormData = z.infer<typeof animalFormSchema>;