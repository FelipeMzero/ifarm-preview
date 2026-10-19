import {
  createBreedClient,
  createCurrentPropertyClient,
  createHealthManagementTypeClient,
  createNeuteringTechniqueClient,
  createPersonClient,
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
