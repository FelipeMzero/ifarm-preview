import { createBrowserRouter } from "react-router";
import { GuestLayout } from "@/layouts/GuestLayout";
import { ProtectedLayout } from "@/layouts/ProtectedLayout";
import {
  AnimalDetailsPage,
  AnimalEditPage,
  AnimalListPage,
  AnimalNewPage,
} from "./pages/animal";
import { AreaMapPage } from "./pages/area";
import { LoginPage } from "./pages/auth";
import {
  BatchDetailsPage,
  BatchEditPage,
  BatchListPage,
  BatchNewPage,
} from "./pages/batch";
import {
  BatchTransferEditPage,
  BatchTransferListPage,
  BatchTransferNewPage,
} from "./pages/batch-transfer";
import { BrandListPage } from "./pages/brand";
import { BreedListPage } from "./pages/breed";
import { DashboardPage } from "./pages/dashboard";
import { HealthManagementTypeListPage } from "./pages/health-management-type";
import { HomePage } from "./pages/home";
import { LossListPage } from "./pages/loss";
import {
  ManagementSessionEditPage,
  ManagementSessionListPage,
  ManagementSessionNewPage,
  RegistrationAnimalPage,
  RegistrationPage,
} from "./pages/management-session";
import { NeuteringTechniqueListPage } from "./pages/neutering-technique";
import { NotFoundPage } from "./pages/not-found";
import {
  PersonDetailsPage,
  PersonEditPage,
  PersonListPage,
  PersonNewPage,
} from "./pages/person";
import {
  PropertyDetailsPage,
  PropertyEditPage,
  PropertyListPage,
  PropertyNewPage,
} from "./pages/property";
import {
  PurchaseEditPage,
  PurchaseListPage,
  PurchaseNewPage,
} from "./pages/purchase";
import {
  ReceptionAnimalPage,
  ReceptionPage,
  ReceptionPurchaseListPage,
  ReceptionPurchasePage,
} from "./pages/reception";
import { SaleListPage } from "./pages/sale";
import { SlaughterListPage } from "./pages/slaughter";
import { UserListPage } from "./pages/user";

// As URLs das páginas, em português (o que o usuário vê; as da API ficam em /api, no
// apps/api). Os componentes ficam em pages/, um arquivo por domínio, com o nome da feature.
export const router = createBrowserRouter([
  { path: "/", Component: HomePage },
  {
    Component: GuestLayout,
    children: [{ path: "/login", Component: LoginPage }],
  },
  {
    Component: ProtectedLayout,
    children: [
      { path: "/abates", Component: SlaughterListPage },
      { path: "/animais", Component: AnimalListPage },
      { path: "/animais/:id", Component: AnimalEditPage },
      { path: "/animais/:id/detalhes", Component: AnimalDetailsPage },
      { path: "/animais/novo", Component: AnimalNewPage },
      { path: "/areas", Component: AreaMapPage },
      { path: "/compras", Component: PurchaseListPage },
      { path: "/compras/:id", Component: PurchaseEditPage },
      { path: "/compras/novo", Component: PurchaseNewPage },
      { path: "/lotes", Component: BatchListPage },
      { path: "/lotes/:id", Component: BatchEditPage },
      { path: "/lotes/:id/detalhes", Component: BatchDetailsPage },
      { path: "/lotes/novo", Component: BatchNewPage },
      { path: "/lotes/transferencias", Component: BatchTransferListPage },
      { path: "/lotes/transferencias/:id", Component: BatchTransferEditPage },
      { path: "/lotes/transferencias/nova", Component: BatchTransferNewPage },
      { path: "/manejos", Component: ManagementSessionListPage },
      { path: "/manejos/:id", Component: ManagementSessionEditPage },
      { path: "/manejos/:id/registro", Component: RegistrationPage },
      // O registro de cada animal abre no primeiro passo pendente; com o passo na URL (link,
      // recarregar a página), na mesma tela. Uma rota só: trocar de passo não remonta a tela.
      {
        path: "/manejos/:id/registro/:animalId/:passo?",
        Component: RegistrationAnimalPage,
      },
      { path: "/manejos/novo", Component: ManagementSessionNewPage },
      { path: "/marcas", Component: BrandListPage },
      { path: "/painel", Component: DashboardPage },
      { path: "/perdas", Component: LossListPage },
      { path: "/pessoas", Component: PersonListPage },
      { path: "/pessoas/:id", Component: PersonEditPage },
      { path: "/pessoas/:id/detalhes", Component: PersonDetailsPage },
      { path: "/pessoas/novo", Component: PersonNewPage },
      { path: "/propriedades", Component: PropertyListPage },
      { path: "/propriedades/:id", Component: PropertyEditPage },
      { path: "/propriedades/:id/detalhes", Component: PropertyDetailsPage },
      { path: "/propriedades/novo", Component: PropertyNewPage },
      { path: "/racas", Component: BreedListPage },
      { path: "/recepcoes", Component: ReceptionPurchaseListPage },
      { path: "/recepcoes/:id", Component: ReceptionPage },
      {
        path: "/recepcoes/:id/:animalId/:passo?",
        Component: ReceptionAnimalPage,
      },
      { path: "/recepcoes/compras/:id", Component: ReceptionPurchasePage },
      { path: "/tecnicas-castracao", Component: NeuteringTechniqueListPage },
      { path: "/tipos-sanitarios", Component: HealthManagementTypeListPage },
      { path: "/usuarios", Component: UserListPage },
      { path: "/vendas", Component: SaleListPage },
      // Endereço inexistente: dentro do layout, com o menu (sem login, vai para o login).
      { path: "*", Component: NotFoundPage },
    ],
  },
]);
