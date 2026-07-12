import { z } from "zod";

export const propertyFormSchema = z
  .object({
    name:           z.string().min(1, "Este campo não pode ser vazio"),
    ownerId:        z.string().min(1, "Este campo não pode ser vazio"),
    ownerName:      z.string().optional(),

    totalArea:      z.string().optional(),
    productiveArea: z.string().optional(),
    cib:            z.string().optional(),
    ccir:           z.string().optional(),
    car:            z.string().optional(),
    latitude:       z.string().optional(),
    longitude:      z.string().optional(),

    // Endereço
    zipCode:        z.string().optional(),
    street:         z.string().optional(),
    number:         z.string().optional(),
    complement:     z.string().optional(),
    neighborhood:   z.string().optional(),
    city:           z.string().optional(),
    state:          z.string().optional(),
  })
  .check((ctx) => {
    const { totalArea, productiveArea, zipCode, street, city, state } = ctx.value;

    const total = totalArea ? parseFloat(totalArea) : null;
    const productive = productiveArea ? parseFloat(productiveArea) : null;

    if (productive != null && total != null && productive > total) {
      ctx.issues.push({
        code: "custom",
        input: productiveArea,
        path: ["productiveArea"],
        message: "A área produtiva não pode ser maior que a área total.",
      });
    }

    const addressStarted = zipCode || street || city || state;
    if (addressStarted) {
      if (!zipCode) ctx.issues.push({ code: "custom", input: zipCode, path: ["zipCode"], message: "Este campo não pode ser vazio" });
      if (!street) ctx.issues.push({ code: "custom", input: street, path: ["street"], message: "Este campo não pode ser vazio" });
      if (!city) ctx.issues.push({ code: "custom", input: city, path: ["city"], message: "Este campo não pode ser vazio" });
      if (!state) ctx.issues.push({ code: "custom", input: state, path: ["state"], message: "Este campo não pode ser vazio" });
    }
  });

export type PropertyFormData = z.infer<typeof propertyFormSchema>;
