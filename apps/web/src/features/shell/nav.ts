import {
  ArrowLeftRight,
  Boxes,
  ClipboardList,
  Dna,
  Fence,
  LayoutDashboard,
  Map,
  Scissors,
  ShoppingCart,
  Syringe,
  Truck,
  UserCog,
  Users,
} from "lucide-react";
import { CowHead } from "@/components/icons/cow-head";

// Seções do menu, agrupadas pelo que o usuário está fazendo. Tudo acima de
// "Administração" opera sobre a fazenda selecionada; "Administração" vale para o
// sistema todo. Usado pela sidebar e pelo breadcrumb (que parte da seção e do item
// que casam com a rota).
export const NAV = [
  {
    label: null,
    items: [{ href: "/painel", label: "Painel", icon: LayoutDashboard }],
  },
  {
    label: "Rebanho",
    items: [
      { href: "/animais", label: "Animais", icon: CowHead },
      { href: "/lotes", label: "Lotes", icon: Boxes },
      {
        href: "/lotes/transferencias",
        label: "Transferências",
        icon: ArrowLeftRight,
      },
    ],
  },
  {
    label: "Pastagens",
    items: [{ href: "/areas", label: "Áreas", icon: Map }],
  },
  {
    label: "Manejo",
    items: [
      { href: "/manejos", label: "Sessões de manejo", icon: ClipboardList },
      { href: "/recepcoes", label: "Recepções", icon: Truck },
    ],
  },
  {
    label: "Comercial",
    items: [{ href: "/compras", label: "Compras", icon: ShoppingCart }],
  },
  {
    label: "Cadastros",
    items: [
      { href: "/pessoas", label: "Pessoas", icon: Users },
      { href: "/racas", label: "Raças", icon: Dna },
      {
        href: "/tipos-sanitarios",
        label: "Tipos sanitários",
        icon: Syringe,
      },
      {
        href: "/tecnicas-castracao",
        label: "Técnicas de castração",
        icon: Scissors,
      },
    ],
  },
  {
    label: "Administração",
    items: [
      { href: "/propriedades", label: "Propriedades", icon: Fence },
      { href: "/usuarios", label: "Usuários", icon: UserCog },
    ],
  },
];

// O item mais específico que casa com a rota
// (ex: /lotes/transferencias/nova → "Transferências", não "Lotes").
export function findNavMatch(pathname: string) {
  return NAV.flatMap((section) =>
    section.items.map((item) => ({ section, item })),
  )
    .filter(
      ({ item }) =>
        pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((a, b) => b.item.href.length - a.item.href.length)[0];
}

// Seções do menu que o usuário recolheu, lembradas por navegador. O layout lê o
// cookie no servidor para o menu já chegar no estado certo (sem abrir e fechar ao
// carregar); valores que não são seções existentes são ignorados.
export const CLOSED_SECTIONS_COOKIE = "sidebar_closed_sections";
const CLOSED_SECTIONS_MAX_AGE = 60 * 60 * 24 * 365;

export function parseClosedSections(value: string | undefined): string[] {
  if (!value) return [];
  const labels = NAV.map((section) => section.label);
  try {
    return decodeURIComponent(value)
      .split(",")
      .filter((label) => labels.includes(label));
  } catch {
    return []; // cookie malformado: todas abertas
  }
}

// Só no navegador (chamado ao abrir/fechar uma seção).
export function saveClosedSections(labels: Iterable<string>) {
  const value = encodeURIComponent([...labels].join(","));
  document.cookie = `${CLOSED_SECTIONS_COOKIE}=${value}; path=/; max-age=${CLOSED_SECTIONS_MAX_AGE}`;
}
