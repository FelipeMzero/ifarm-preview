import { Skeleton } from "@/components/ui/skeleton";

// Skeletons de página inteira, um por tipo de tela (lista, formulário, detalhes), montados com o
// bloco básico do shadcn (components/ui/skeleton). As telas mostram o do seu tipo enquanto os
// dados chegam.

interface ListSkeletonProps {
  rows?: number;
  columns?: number;
}

export function ListSkeleton({ rows = 5, columns = 5 }: ListSkeletonProps) {
  return (
    <div className="w-full space-y-4">
      {/* Cabeçalho: título + botão */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Filtro + colunas */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-8 w-24" />
      </div>

      {/* Tabela */}
      <div className="rounded-md border border-border overflow-hidden">
        {/* Header */}
        <div className="flex gap-4 bg-muted/60 px-4 py-3 border-b border-border">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>

        {/* Linhas */}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex gap-4 px-4 py-3 border-b border-border last:border-0"
          >
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-44" />
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="size-7 rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Skeleton das listas editáveis na própria linha (InlineEditableList: raças, técnicas…). */
export function InlineListSkeleton() {
  return (
    <div className="w-full max-w-2xl space-y-3">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-40 w-full rounded-md" />
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="flex flex-col w-full gap-8">
      <Skeleton className="h-9 w-32" />

      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-24" />
        <div className="grid grid-cols-2 gap-4">
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-24" />
        <div className="grid grid-cols-2 gap-4">
          <FieldSkeleton height="h-24" />
          <FieldSkeleton height="h-24" />
        </div>
      </div>
    </div>
  );
}

// Um campo do formulário: o rótulo e a caixa (só usado pelo FormSkeleton).
function FieldSkeleton({ height = "h-8" }: { height?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Skeleton className="h-4 w-20" />
      <Skeleton className={`${height} w-full`} />
    </div>
  );
}

/**
 * Skeleton das telas de detalhes, em dois desenhos: "stats" (animal, lote: cabeçalho,
 * indicadores e abas) e "cards" (pessoa, propriedade: cabeçalho e cartões de informação).
 */
export function DetailsSkeleton({
  variant = "stats",
}: {
  variant?: "stats" | "cards";
}) {
  if (variant === "cards") {
    return (
      <div className="w-full max-w-4xl space-y-4">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl space-y-4">
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-8 w-96" />
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  );
}
