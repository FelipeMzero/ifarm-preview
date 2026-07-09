import { z } from "zod";
import { Sexo, AnimalOrigem, AnimalStatus, PessoaTipo, EstadoCivil } from "@/generated/prisma/enums";
import { isValidDocumento } from "@/lib/documento";


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



export const pessoaApiSchema = z
  .object({
    tipo:              z.enum(PessoaTipo),
    documento:         z.string().min(1, "Este campo não pode ser vazio"),
    nome:              z.string().min(1, "Este campo não pode ser vazio"),

    inscricaoEstadual: z.string().optional().transform(v => v || null),
    telefone:          z.string().optional().transform(v => v || null),
    email:             z.string().optional().transform(v => v || null),

    // Exclusivo de Pessoa Jurídica
    nomeFantasia:      z.string().optional().transform(v => v || null),

    // Exclusivos de Pessoa Física
    rg:                z.string().optional().transform(v => v || null),
    dataNascimento:    z.string().optional().transform(v => v ? new Date(`${v}T00:00:00`) : null),
    estadoCivil:       z.preprocess( v => v === "" ? undefined : v, z.enum(EstadoCivil).optional()),

    // Endereço
    cep:               z.string().optional().transform(v => v || null),
    logradouro:        z.string().optional().transform(v => v || null),
    numero:            z.string().optional().transform(v => v || null),
    complemento:       z.string().optional().transform(v => v || null),
    bairro:            z.string().optional().transform(v => v || null),
    municipio:         z.string().optional().transform(v => v || null),
    uf:                z.string().optional().transform(v => v || null),
  })
  .check((ctx) => {
    const { tipo, documento, cep, logradouro, municipio, uf } = ctx.value;

    if (documento && !isValidDocumento(tipo, documento)) {
      ctx.issues.push({
        code: "custom",
        input: documento,
        path: ["documento"],
        message: tipo === PessoaTipo.FISICA ? "CPF inválido" : "CNPJ inválido",
      });
    }

    const enderecoIniciado = cep || logradouro || municipio || uf;
    if (enderecoIniciado) {
      if (!cep) ctx.issues.push({ code: "custom", input: cep, path: ["cep"], message: "Este campo não pode ser vazio" });
      if (!logradouro) ctx.issues.push({ code: "custom", input: logradouro, path: ["logradouro"], message: "Este campo não pode ser vazio" });
      if (!municipio) ctx.issues.push({ code: "custom", input: municipio, path: ["municipio"], message: "Este campo não pode ser vazio" });
      if (!uf) ctx.issues.push({ code: "custom", input: uf, path: ["uf"], message: "Este campo não pode ser vazio" });
    }
  });

export type PessoaApiData = z.infer<typeof pessoaApiSchema>;

export const pessoaQuerySchema = z.object({
  page:     z.coerce.number().int().min(0).optional().default(0),
  pageSize: z.coerce.number().int().min(1).optional().default(10),
  search:   z.string().trim().optional().default(""),
  tipo:     z.preprocess( v => v === "" ? undefined : v, z.enum(PessoaTipo).optional()),
});

export type PessoaQueryData = z.infer<typeof pessoaQuerySchema>;