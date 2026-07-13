export type CurrentPropertyDetails = {
  id: string;
  name: string;
  ownerName: string;
  totalArea: number | null;
  productiveArea: number | null;
  city: string | null;
  state: string | null;
};

export async function getCurrentPropertyDetails(): Promise<CurrentPropertyDetails | null> {
  const response = await fetch("/api/usuarios/propriedade-atual/detalhes");
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  return result.data;
}
