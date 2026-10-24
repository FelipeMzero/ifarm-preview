import FormSkeleton from "@/components/our/FormSkeleton";
import ListSkeleton from "@/components/our/ListSkeleton";
import { DetailsSkeleton } from "@/components/our/DetailParts";
import { Skeleton } from "@/components/ui/skeleton";

// Detalhes em cartões (DetailsSkeleton "cards"); os demais têm indicadores e abas.
const CARD_DETAILS = ["pessoas", "propriedades"];

// Páginas fora da área logada (sem o layout com menu).
const PUBLIC_PATHS = ["/", "/login"];

export function isProtectedPath(pathname: string) {
  return !PUBLIC_PATHS.includes(pathname);
}

type Kind = "list" | "form" | "details" | "map";

// O tipo de página pela URL, para mostrar um skeleton parecido enquanto o código dela chega.
function kindOf(pathname: string): Kind {
  const segments = pathname.split("/").filter(Boolean);
  const last = segments.at(-1) ?? "";
  if (pathname === "/areas") return "map";
  if (pathname === "/painel" || last === "detalhes") return "details";
  if (last === "novo" || last === "nova") return "form";
  // Passo de um animal no registro do manejo ou na recepção (…/:animalId e …/:animalId/:passo).
  if (
    segments[0] === "recepcoes" &&
    segments[1] !== "compras" &&
    segments.length >= 3
  )
    return "form";
  if (
    segments[0] === "manejos" &&
    segments[2] === "registro" &&
    segments.length >= 4
  )
    return "form";
  // Edição: /<recurso>/:id (e /lotes/transferencias/:id).
  const isEdit =
    segments.length === 2 &&
    !["transferencias", "compras"].includes(segments[1]) &&
    segments[0] !== "recepcoes";
  if (isEdit || (segments[1] === "transferencias" && segments.length === 3))
    return "form";
  return "list";
}

// Skeleton da página de destino, no mesmo enquadramento das páginas (src/pages).
export function PageSkeleton({ pathname }: { pathname: string }) {
  const kind = kindOf(pathname);
  if (kind === "map") return <Skeleton className="size-full rounded-none" />;
  return (
    <div className="flex justify-center p-8">
      {kind === "list" && <ListSkeleton />}
      {kind === "form" && <FormSkeleton />}
      {kind === "details" && (
        <DetailsSkeleton
          variant={
            CARD_DETAILS.includes(pathname.split("/")[1]) ? "cards" : "stats"
          }
        />
      )}
    </div>
  );
}
