import { createBrowserRouter } from "react-router";
import { GuestLayout } from "@/layouts/GuestLayout";
import { ProtectedLayout } from "@/layouts/ProtectedLayout";
import AbatesPage from "./pages/abates/page";
import AnimaisIdDetalhesPage from "./pages/animais/[id]/detalhes/page";
import AnimaisIdPage from "./pages/animais/[id]/page";
import AnimaisNovoPage from "./pages/animais/novo/page";
import AnimaisPage from "./pages/animais/page";
import AreasPage from "./pages/areas/page";
import ComprasIdPage from "./pages/compras/[id]/page";
import ComprasNovoPage from "./pages/compras/novo/page";
import ComprasPage from "./pages/compras/page";
import LoginPage from "./pages/login/page";
import LotesIdDetalhesPage from "./pages/lotes/[id]/detalhes/page";
import LotesIdPage from "./pages/lotes/[id]/page";
import LotesNovoPage from "./pages/lotes/novo/page";
import LotesPage from "./pages/lotes/page";
import LotesTransferenciasIdPage from "./pages/lotes/transferencias/[id]/page";
import LotesTransferenciasNovaPage from "./pages/lotes/transferencias/nova/page";
import LotesTransferenciasPage from "./pages/lotes/transferencias/page";
import ManejosIdPage from "./pages/manejos/[id]/page";
import ManejosIdRegistroAnimalIdPassoPage from "./pages/manejos/[id]/registro/[animalId]/[passo]/page";
import ManejosIdRegistroAnimalIdPage from "./pages/manejos/[id]/registro/[animalId]/page";
import ManejosIdRegistroPage from "./pages/manejos/[id]/registro/page";
import ManejosNovoPage from "./pages/manejos/novo/page";
import ManejosPage from "./pages/manejos/page";
import MarcasPage from "./pages/marcas/page";
import NaoEncontradaPage from "./pages/nao-encontrada/page";
import HomePage from "./pages/page";
import PainelPage from "./pages/painel/page";
import PerdasPage from "./pages/perdas/page";
import PessoasIdDetalhesPage from "./pages/pessoas/[id]/detalhes/page";
import PessoasIdPage from "./pages/pessoas/[id]/page";
import PessoasNovoPage from "./pages/pessoas/novo/page";
import PessoasPage from "./pages/pessoas/page";
import PropriedadesIdDetalhesPage from "./pages/propriedades/[id]/detalhes/page";
import PropriedadesIdPage from "./pages/propriedades/[id]/page";
import PropriedadesNovoPage from "./pages/propriedades/novo/page";
import PropriedadesPage from "./pages/propriedades/page";
import RacasPage from "./pages/racas/page";
import RecepcoesIdAnimalIdPassoPage from "./pages/recepcoes/[id]/[animalId]/[passo]/page";
import RecepcoesIdAnimalIdPage from "./pages/recepcoes/[id]/[animalId]/page";
import RecepcoesIdPage from "./pages/recepcoes/[id]/page";
import RecepcoesComprasIdPage from "./pages/recepcoes/compras/[id]/page";
import RecepcoesPage from "./pages/recepcoes/page";
import TecnicasCastracaoPage from "./pages/tecnicas-castracao/page";
import TiposSanitariosPage from "./pages/tipos-sanitarios/page";
import UsuariosPage from "./pages/usuarios/page";
import VendasPage from "./pages/vendas/page";

// As URLs das páginas (em português; as da API ficam em /api, no apps/api).
export const router = createBrowserRouter([
  { path: "/", Component: HomePage },
  {
    Component: GuestLayout,
    children: [{ path: "/login", Component: LoginPage }],
  },
  {
    Component: ProtectedLayout,
    children: [
      { path: "/abates", Component: AbatesPage },
      { path: "/animais", Component: AnimaisPage },
      { path: "/animais/:id", Component: AnimaisIdPage },
      { path: "/animais/:id/detalhes", Component: AnimaisIdDetalhesPage },
      { path: "/animais/novo", Component: AnimaisNovoPage },
      { path: "/areas", Component: AreasPage },
      { path: "/compras", Component: ComprasPage },
      { path: "/compras/:id", Component: ComprasIdPage },
      { path: "/compras/novo", Component: ComprasNovoPage },
      { path: "/lotes", Component: LotesPage },
      { path: "/lotes/:id", Component: LotesIdPage },
      { path: "/lotes/:id/detalhes", Component: LotesIdDetalhesPage },
      { path: "/lotes/novo", Component: LotesNovoPage },
      { path: "/lotes/transferencias", Component: LotesTransferenciasPage },
      {
        path: "/lotes/transferencias/:id",
        Component: LotesTransferenciasIdPage,
      },
      {
        path: "/lotes/transferencias/nova",
        Component: LotesTransferenciasNovaPage,
      },
      { path: "/manejos", Component: ManejosPage },
      { path: "/manejos/:id", Component: ManejosIdPage },
      { path: "/manejos/:id/registro", Component: ManejosIdRegistroPage },
      {
        path: "/manejos/:id/registro/:animalId",
        Component: ManejosIdRegistroAnimalIdPage,
      },
      {
        path: "/manejos/:id/registro/:animalId/:passo",
        Component: ManejosIdRegistroAnimalIdPassoPage,
      },
      { path: "/manejos/novo", Component: ManejosNovoPage },
      { path: "/marcas", Component: MarcasPage },
      { path: "/painel", Component: PainelPage },
      { path: "/perdas", Component: PerdasPage },
      { path: "/pessoas", Component: PessoasPage },
      { path: "/pessoas/:id", Component: PessoasIdPage },
      { path: "/pessoas/:id/detalhes", Component: PessoasIdDetalhesPage },
      { path: "/pessoas/novo", Component: PessoasNovoPage },
      { path: "/propriedades", Component: PropriedadesPage },
      { path: "/propriedades/:id", Component: PropriedadesIdPage },
      {
        path: "/propriedades/:id/detalhes",
        Component: PropriedadesIdDetalhesPage,
      },
      { path: "/propriedades/novo", Component: PropriedadesNovoPage },
      { path: "/racas", Component: RacasPage },
      { path: "/recepcoes", Component: RecepcoesPage },
      { path: "/recepcoes/:id", Component: RecepcoesIdPage },
      { path: "/recepcoes/:id/:animalId", Component: RecepcoesIdAnimalIdPage },
      {
        path: "/recepcoes/:id/:animalId/:passo",
        Component: RecepcoesIdAnimalIdPassoPage,
      },
      { path: "/recepcoes/compras/:id", Component: RecepcoesComprasIdPage },
      { path: "/tecnicas-castracao", Component: TecnicasCastracaoPage },
      { path: "/tipos-sanitarios", Component: TiposSanitariosPage },
      { path: "/usuarios", Component: UsuariosPage },
      { path: "/vendas", Component: VendasPage },
    ],
  },
  { path: "*", Component: NaoEncontradaPage },
]);
