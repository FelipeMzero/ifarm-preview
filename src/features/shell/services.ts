import { PropertyOption } from "@/features/property/services";

const CURRENT_PROPERTY_ENDPOINT = "/api/usuarios/propriedade-atual";

export async function getCurrentProperty(): Promise<PropertyOption | null> {
  const response = await fetch(CURRENT_PROPERTY_ENDPOINT);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result.data;
}

export async function setCurrentProperty(propertyId: string): Promise<PropertyOption> {
  const response = await fetch(CURRENT_PROPERTY_ENDPOINT, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ propertyId }),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result.data;
}
