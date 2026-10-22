import { z } from "zod";
import { PurchaseCostSplit, PurchasePricingType, Sex } from "../enums";
import { FIELD_LIMITS } from "../field-limits";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres`)
    .nullish()
    .transform((v) => v || null);

// Número opcional, como texto (formulário) ou número: vazio/nulo = não informado.
const optionalNumber = (schema: z.ZodNumber) =>
  z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((v) => (v === "" || v == null ? null : Number(v)))
    .pipe(schema.nullable());

// Categoria da negociação. O preço da forma escolhida é obrigatório já na criação; só o
// peso faturado (por arroba) pode vir depois — até o pagamento. Campos que não são da
// forma escolhida são descartados.
export const purchaseCategorySchema = z
  .object({
    id: z.number().int().optional(),
    sex: z.enum(Sex),
    minAgeMonths: optionalNumber(z.number().int().min(0, "Idade inválida")),
    maxAgeMonths: optionalNumber(z.number().int().min(0, "Idade inválida")),
    breedId: z
      .uuid()
      .nullish()
      .or(z.literal(""))
      .transform((v) => v || null),
    expectedQuantity: z
      .union([z.string(), z.number()])
      .refine((v) => v !== "", "Informe a quantidade")
      .transform(Number)
      .pipe(
        z
          .number("Informe a quantidade")
          .int("Informe um número inteiro")
          .min(1, "A quantidade deve ser ao menos 1"),
      ),
    pricingType: z.enum(PurchasePricingType),
    unitPrice: optionalNumber(z.number().min(0, "Valor inválido")),
    totalPrice: optionalNumber(z.number().min(0, "Valor inválido")),
    invoicedWeight: optionalNumber(z.number().min(0, "Peso inválido")),
    shrinkPercent: optionalNumber(
      z.number().min(0, "Quebra inválida").max(100, "Quebra inválida"),
    ),
    costSplit: z.enum(PurchaseCostSplit).optional().default("EQUAL"),
    notes: optionalText(FIELD_LIMITS.purchase.notes),
  })
  .superRefine((c, ctx) => {
    if (c.pricingType === "LUMP_SUM" && c.totalPrice == null) {
      ctx.addIssue({
        code: "custom",
        message: "Informe o valor total",
        path: ["totalPrice"],
      });
    }
    if (c.pricingType !== "LUMP_SUM" && c.unitPrice == null) {
      ctx.addIssue({
        code: "custom",
        message:
          c.pricingType === "PER_HEAD"
            ? "Informe o preço por cabeça"
            : "Informe o preço da arroba",
        path: ["unitPrice"],
      });
    }
  })
  .transform((c) => ({
    ...c,
    unitPrice: c.pricingType === "LUMP_SUM" ? null : c.unitPrice,
    totalPrice: c.pricingType === "LUMP_SUM" ? c.totalPrice : null,
    invoicedWeight: c.pricingType === "PER_ARROBA" ? c.invoicedWeight : null,
    shrinkPercent: c.pricingType === "PER_ARROBA" ? c.shrinkPercent : null,
    costSplit: c.pricingType === "LUMP_SUM" ? c.costSplit : ("EQUAL" as const),
  }))
  .refine(
    (c) =>
      c.minAgeMonths == null ||
      c.maxAgeMonths == null ||
      c.minAgeMonths <= c.maxAgeMonths,
    {
      message: "A idade mínima não pode ser maior que a máxima",
      path: ["maxAgeMonths"],
    },
  );

export type PurchaseCategoryData = z.infer<typeof purchaseCategorySchema>;

// Contrato da API de compras. O formulário valida com estes mesmos schemas (zodResolver em
// modo raw: a tela valida e envia os valores do formulário; a API converte e descarta os
// campos que não são da forma de preço escolhida). Datas como "AAAA-MM-DD".
export const purchaseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Este campo é obrigatório")
    .max(
      FIELD_LIMITS.purchase.title,
      `Máximo de ${FIELD_LIMITS.purchase.title} caracteres`,
    ),
  sellerId: z.uuid("Selecione o vendedor."),
  purchaseDate: z.iso.date("Informe uma data válida."),
  notes: optionalText(FIELD_LIMITS.purchase.notes),
  categories: z
    .array(purchaseCategorySchema)
    .min(1, "Adicione ao menos uma categoria."),
  propertyId: z.uuid().optional(),
});

// Pagamento: data informada (padrão: hoje) e referência opcional.
export const purchasePaymentSchema = z.object({
  paymentDate: z.iso.date("Informe uma data válida.").optional(),
  paymentReference: optionalText(FIELD_LIMITS.purchase.paymentReference),
});

// Documentos da carga de uma recepção.
export const receptionDocumentsSchema = z.object({
  gtaNumber: optionalText(FIELD_LIMITS.purchase.gtaNumber),
  invoiceNumber: optionalText(FIELD_LIMITS.purchase.invoiceNumber),
});

export type PurchasePayload = z.input<typeof purchaseSchema>;
export type PurchaseData = z.output<typeof purchaseSchema>;
export type PurchasePaymentPayload = z.input<typeof purchasePaymentSchema>;
export type PurchasePaymentData = z.output<typeof purchasePaymentSchema>;
export type ReceptionDocumentsData = z.output<typeof receptionDocumentsSchema>;
