import { z } from "zod";
import { isValidDocumento } from "@/lib/documento";

const enumValues = <T extends Record<string, string>>(e: T) =>
  Object.values(e) as [T[keyof T], ...T[keyof T][]];

export const EnumPessoaTipo = { FISICA: "FISICA", JURIDICA: "JURIDICA" } as const;
export const EnumEstadoCivil = {
  SOLTEIRO: "SOLTEIRO",
  CASADO: "CASADO",
  UNIAO_ESTAVEL: "UNIAO_ESTAVEL",
  DIVORCIADO: "DIVORCIADO",
  VIUVO: "VIUVO",
} as const;

export const pessoaFormSchema = z
  .object({
    tipo:              z.enum(enumValues(EnumPessoaTipo), "Este campo não pode ser vazio"),
    documento:         z.string().min(1, "Este campo não pode ser vazio"),
    nome:              z.string().min(1, "Este campo não pode ser vazio"),
    inscricaoEstadual: z.string().optional(),
    telefone:          z.string().optional(),
    email:             z.string().optional(),

    // Exclusivo de Pessoa Jurídica
    nomeFantasia:      z.string().optional(),

    // Exclusivos de Pessoa Física
    rg:                z.string().optional(),
    dataNascimento:    z.string().optional(),
    estadoCivil:       z.string().optional(),

    // Endereço
    cep:               z.string().optional(),
    logradouro:        z.string().optional(),
    numero:            z.string().optional(),
    complemento:       z.string().optional(),
    bairro:            z.string().optional(),
    municipio:         z.string().optional(),
    uf:                z.string().optional(),
  })
  .check((ctx) => {
    const { tipo, documento, email, cep, logradouro, municipio, uf } = ctx.value;

    if (documento && !isValidDocumento(tipo, documento)) {
      ctx.issues.push({
        code: "custom",
        input: documento,
        path: ["documento"],
        message: tipo === EnumPessoaTipo.FISICA ? "CPF inválido" : "CNPJ inválido",
      });
    }

    if (email && !z.email().safeParse(email).success) {
      ctx.issues.push({ code: "custom", input: email, path: ["email"], message: "E-mail inválido" });
    }

    const enderecoIniciado = cep || logradouro || municipio || uf;
    if (enderecoIniciado) {
      if (!cep) ctx.issues.push({ code: "custom", input: cep, path: ["cep"], message: "Este campo não pode ser vazio" });
      if (!logradouro) ctx.issues.push({ code: "custom", input: logradouro, path: ["logradouro"], message: "Este campo não pode ser vazio" });
      if (!municipio) ctx.issues.push({ code: "custom", input: municipio, path: ["municipio"], message: "Este campo não pode ser vazio" });
      if (!uf) ctx.issues.push({ code: "custom", input: uf, path: ["uf"], message: "Este campo não pode ser vazio" });
    }
  });

export type PessoaFormData = z.infer<typeof pessoaFormSchema>;
