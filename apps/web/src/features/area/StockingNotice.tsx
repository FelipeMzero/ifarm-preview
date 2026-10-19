"use client";

import { useEffect, useState } from "react";
import { Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { stockingClient } from "@/lib/clients";
import type { StockingPreview, StockingPreviewRequest } from "@ifarm/shared";

function formatUa(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function EstimatedNote({ preview }: { preview: StockingPreview }) {
  const estimated =
    preview.current.estimatedCount + preview.incoming.estimatedCount;
  if (!estimated) return null;
  return (
    <p className="text-xs text-muted-foreground">
      {estimated} animal(is) sem peso tiveram a UA estimada pela idade (ou
      contados como 1 UA), então o valor é aproximado.
    </p>
  );
}

// Descrição da lotação da área depois da operação. Útil também fora deste componente
// (ex.: texto de um diálogo de confirmação).
export function describeStocking(preview: StockingPreview) {
  const percent =
    preview.capacityUa > 0
      ? ` (${Math.round((preview.projectedUa / preview.capacityUa) * 100)}%)`
      : "";
  return `A área "${preview.area.name}" ficará com ${formatUa(preview.projectedUa)} UA para uma capacidade de ${formatUa(preview.capacityUa)} UA${percent}.`;
}

type StockingNoticeProps = {
  /** null enquanto a operação ainda não tem destino definido. */
  request: StockingPreviewRequest | null;
  /** Exibe a ocupação mesmo quando a lotação não é excedida. */
  showWhenOk?: boolean;
  className?: string;
};

// Aviso (não bloqueante) de lotação da área que vai receber animais.
export function StockingNotice({
  request,
  showWhenOk = false,
  className,
}: StockingNoticeProps) {
  const key = request ? JSON.stringify(request) : null;
  const [preview, setPreview] = useState<StockingPreview | null>(null);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const result = await stockingClient.getStockingPreview(JSON.parse(key));
        if (!cancelled) setPreview(result);
      } catch {
        // A prévia é só informativa; sem ela a operação segue normalmente.
        if (!cancelled) setPreview(null);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key]);

  if (!key || !preview) return null;

  if (preview.exceeds) {
    return (
      <div
        className={cn(
          "flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm",
          className,
        )}
      >
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
        <div className="space-y-1">
          <p className="font-medium text-warning">Lotação excedida</p>
          <p className="text-muted-foreground">
            {describeStocking(preview)} Hoje: {formatUa(preview.current.ua)} UA;
            entrando: {formatUa(preview.incoming.ua)} UA (
            {preview.incoming.count} animal(is)).
          </p>
          <EstimatedNote preview={preview} />
        </div>
      </div>
    );
  }

  if (!showWhenOk) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-2 text-sm text-muted-foreground",
        className,
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-1">
        <p>
          Lotação da área{" "}
          <span className="font-medium text-foreground">
            {preview.area.name}
          </span>
          : {formatUa(preview.current.ua)} → {formatUa(preview.projectedUa)} UA
          de {formatUa(preview.capacityUa)} UA
          {preview.capacityUa > 0 &&
            ` (${Math.round((preview.projectedUa / preview.capacityUa) * 100)}%)`}
        </p>
        <EstimatedNote preview={preview} />
      </div>
    </div>
  );
}
