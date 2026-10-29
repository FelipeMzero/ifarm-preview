import { z } from "zod";
import { purchaseSchema } from "@ifarm/shared";

// Formulário da compra: os campos e as regras da API, sem a propriedade (vai no envio: a da
// compra, na edição, ou a atual, no cadastro). Usado pelo formulário e pelo editor de categorias.
export const purchaseFormSchema = purchaseSchema.omit({ propertyId: true });
export type PurchaseFormData = z.input<typeof purchaseFormSchema>;
