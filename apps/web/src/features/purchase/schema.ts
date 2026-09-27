import { z } from "zod";
import { FIELD_LIMITS } from "@/lib/field-limits";

const optionalNonNegative = (message: string) =>
  z
    .string()
    .optional()
    .refine((v) => !v || Number(v) >= 0, message);

export const purchaseCategoryFormSchema = z
  .object({
    id: z.number().optional(),
    receivedQuantity: z.number().optional(),
    sex: z.enum(["MALE", "FEMALE"]),
    minAgeMonths: optionalNonNegative("Idade inválida"),
    maxAgeMonths: optionalNonNegative("Idade inválida"),
    breedId: z.string().optional(),
    expectedQuantity: z
      .string()
      .min(1, "Informe a quantidade")
      .refine(
        (v) => Number.isInteger(Number(v)) && Number(v) >= 1,
        "Quantidade inválida",
      ),
    pricingType: z.enum(["PER_HEAD", "PER_ARROBA", "LUMP_SUM"]),
    unitPrice: optionalNonNegative("Valor inválido"),
    totalPrice: optionalNonNegative("Valor inválido"),
    invoicedWeight: optionalNonNegative("Peso inválido"),
    shrinkPercent: z
      .string()
      .optional()
      .refine(
        (v) => !v || (Number(v) >= 0 && Number(v) <= 100),
        "Quebra inválida",
      ),
    costSplit: z.enum(["EQUAL", "BY_WEIGHT"]),
    notes: z.string().max(FIELD_LIMITS.purchase.notes).optional(),
  })
  // O preço da forma escolhida é obrigatório já na criação da categoria.
  .superRefine((c, ctx) => {
    if (c.pricingType === "LUMP_SUM" && !c.totalPrice) {
      ctx.addIssue({
        code: "custom",
        message: "Informe o valor total",
        path: ["totalPrice"],
      });
    }
    if (c.pricingType !== "LUMP_SUM" && !c.unitPrice) {
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
  .refine(
    (c) =>
      !c.minAgeMonths ||
      !c.maxAgeMonths ||
      Number(c.minAgeMonths) <= Number(c.maxAgeMonths),
    { message: "Mínima maior que a máxima", path: ["maxAgeMonths"] },
  );

export type PurchaseCategoryForm = z.infer<typeof purchaseCategoryFormSchema>;

export const purchaseFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Este campo é obrigatório")
    .max(
      FIELD_LIMITS.purchase.title,
      `Máximo de ${FIELD_LIMITS.purchase.title} caracteres`,
    ),
  sellerId: z.string().min(1, "Selecione o vendedor"),
  purchaseDate: z.string().min(1, "Este campo é obrigatório"),
  notes: z
    .string()
    .max(
      FIELD_LIMITS.purchase.notes,
      `Máximo de ${FIELD_LIMITS.purchase.notes} caracteres`,
    )
    .optional(),
  categories: z
    .array(purchaseCategoryFormSchema)
    .min(1, "Adicione ao menos uma categoria."),
});

export type PurchaseFormData = z.infer<typeof purchaseFormSchema>;

export const paymentFormSchema = z.object({
  paidAt: z.string().min(1, "Este campo é obrigatório"),
  paymentReference: z
    .string()
    .max(
      FIELD_LIMITS.purchase.paymentReference,
      `Máximo de ${FIELD_LIMITS.purchase.paymentReference} caracteres`,
    )
    .optional(),
});

export type PaymentFormData = z.infer<typeof paymentFormSchema>;
