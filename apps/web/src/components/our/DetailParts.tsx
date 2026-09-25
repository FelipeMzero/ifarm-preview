import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Blocos compartilhados pelas telas de detalhes (animal, lote).

export function DetailsSkeleton() {
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

export function StatTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <Card className="gap-1 py-4">
      <CardContent className="space-y-1 px-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <p className="truncate text-xl font-semibold tabular-nums">{value}</p>
        <div className="min-h-4 text-xs text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>
  );
}

export function InfoItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  );
}

export function EmptyState({
  icon,
  message,
}: {
  icon: React.ReactNode;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground [&_svg]:size-10 [&_svg]:opacity-30">
      {icon}
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function CountBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="rounded-full bg-muted-foreground/15 px-1.5 text-[10px] font-semibold tabular-nums">
      {count}
    </span>
  );
}
