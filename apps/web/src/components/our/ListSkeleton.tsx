import { Skeleton } from "../ui/skeleton";

interface ListSkeletonProps {
  rows?: number;
  columns?: number;
}

export default function ListSkeleton({
  rows = 5,
  columns = 5,
}: ListSkeletonProps) {
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
