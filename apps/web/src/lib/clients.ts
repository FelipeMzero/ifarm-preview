import {
  createAnimalClient,
  createAreaClient,
  createBatchClient,
  createBatchTransferClient,
  createBreedClient,
  createCurrentPropertyClient,
  createHealthManagementTypeClient,
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
const request: ApiRequest = (path, init) => fetch(path, init);

export const personClient = createPersonClient(request);
export const breedClient = createBreedClient(request);
export const healthManagementTypeClient =
  createHealthManagementTypeClient(request);
export const neuteringTechniqueClient = createNeuteringTechniqueClient(request);
export const stockingClient = createStockingClient(request);
export const currentPropertyClient = createCurrentPropertyClient(request);
export const propertyClient = createPropertyClient(request);
export const areaClient = createAreaClient(request);
export const purchaseClient = createPurchaseClient(request);
export const receptionClient = createReceptionClient(request);
export const batchTransferClient = createBatchTransferClient(request);
export const batchClient = createBatchClient(request);
export const animalClient = createAnimalClient(request);
