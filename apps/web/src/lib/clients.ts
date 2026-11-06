import {
  createAddressClient,
  createAnimalClient,
  createAreaClient,
  createBatchClient,
  createBatchTransferClient,
  createBreedClient,
  createCurrentPropertyClient,
  createDashboardClient,
  createHealthManagementTypeClient,
  createManagementSessionClient,
  createNeuteringTechniqueClient,
  createPersonClient,
  createPropertyClient,
  createPurchaseClient,
  createReceptionClient,
  createStockingClient,
  type ApiRequest,
} from "@ifarm/shared";

// Clientes da API usados pelo web. Aqui a API está na mesma origem da página e o navegador envia
// o cookie de sessão sozinho; o mobile configura os mesmos clientes com a URL e o cookie dele.
const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const request: ApiRequest = (path, init) => {
  const url = API_BASE_URL ? `${API_BASE_URL}${path}` : path;
  return fetch(url, { ...init, credentials: "include" });
};

export const addressClient = createAddressClient(request);
export const personClient = createPersonClient(request);
export const breedClient = createBreedClient(request);
export const healthManagementTypeClient =
  createHealthManagementTypeClient(request);
export const neuteringTechniqueClient = createNeuteringTechniqueClient(request);
export const stockingClient = createStockingClient(request);
export const currentPropertyClient = createCurrentPropertyClient(request);
export const dashboardClient = createDashboardClient(request);
export const propertyClient = createPropertyClient(request);
export const areaClient = createAreaClient(request);
export const purchaseClient = createPurchaseClient(request);
export const receptionClient = createReceptionClient(request);
export const batchTransferClient = createBatchTransferClient(request);
export const batchClient = createBatchClient(request);
export const animalClient = createAnimalClient(request);
export const managementSessionClient = createManagementSessionClient(request);
