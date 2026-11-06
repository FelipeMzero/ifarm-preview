import {
  AlertTriangle,
  Clock,
  ShieldAlert,
  ShoppingBag,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardAlerts } from "@ifarm/shared";

type DashboardAlertsCardProps = {
  alerts: DashboardAlerts;
};

export function DashboardAlertsCard({ alerts }: DashboardAlertsCardProps) {
  const hasCriticalAlerts =
    alerts.rotationAlerts.length > 0 ||
    alerts.unweighedAnimalsCount > 0 ||
    alerts.activeWithdrawalCount > 0 ||
    alerts.pendingPurchasesCount > 0;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <AlertTriangle
              className={`size-4 ${
                hasCriticalAlerts
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            />
            Alertas Operacionais e Sanitários
          </CardTitle>
          {hasCriticalAlerts ? (
            <Badge variant="destructive" className="text-xs">
              Atenção
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs"
            >
              Normal
            </Badge>
          )}
        </div>
        <CardDescription>
          Pontos de atenção para rotação de pastagens, pesagens e carências
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {!hasCriticalAlerts ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>
              Todos os indicadores operacionais e sanitários estão em dia na
              fazenda.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Alerta de Rotação de Pastagem */}
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <div className="space-y-1">
                <p className="text-xs font-semibold">Rotação de Pasto</p>
                <p className="text-xs text-muted-foreground">
                  {alerts.rotationAlerts.length > 0 ? (
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      {alerts.rotationAlerts.length} pasto(s) com prazo
                      estourado
                    </span>
                  ) : (
                    "Dentro do prazo"
                  )}
                </p>
              </div>
            </div>

            {/* Animais sem pesagem > 60 dias */}
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-sky-500" />
              <div className="space-y-1">
                <p className="text-xs font-semibold">Pesagens Pendentes</p>
                <p className="text-xs text-muted-foreground">
                  {alerts.unweighedAnimalsCount > 0 ? (
                    <span className="font-medium text-sky-600 dark:text-sky-400">
                      {alerts.unweighedAnimalsCount} animais sem pesagem há &gt;
                      60 dias
                    </span>
                  ) : (
                    "Rebanho atualizado"
                  )}
                </p>
              </div>
            </div>

            {/* Carência Sanitária Ativa */}
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-rose-500" />
              <div className="space-y-1">
                <p className="text-xs font-semibold">Carência Sanitária</p>
                <p className="text-xs text-muted-foreground">
                  {alerts.activeWithdrawalCount > 0 ? (
                    <span className="font-medium text-rose-600 dark:text-rose-400">
                      {alerts.activeWithdrawalCount} animais em retenção médica
                    </span>
                  ) : (
                    "Nenhum animal retido"
                  )}
                </p>
              </div>
            </div>

            {/* Compras Pendentes de Entrega */}
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <ShoppingBag className="mt-0.5 size-4 shrink-0 text-purple-500" />
              <div className="space-y-1">
                <p className="text-xs font-semibold">Entregas de Compras</p>
                <p className="text-xs text-muted-foreground">
                  {alerts.pendingPurchasesCount > 0 ? (
                    <span className="font-medium text-purple-600 dark:text-purple-400">
                      {alerts.pendingPurchasesCount} compra(s) aguardando
                      recepção
                    </span>
                  ) : (
                    "Nenhuma pendente"
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabela de Lotes com ocupação excedida se houver */}
        {alerts.rotationAlerts.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/30 p-3 dark:border-amber-900/50 dark:bg-amber-950/10">
            <p className="mb-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
              Lotes que ultrapassaram o período máximo recomendado no pasto:
            </p>
            <div className="space-y-1.5">
              {alerts.rotationAlerts.map((rot) => (
                <div
                  key={`${rot.batchId}-${rot.areaId}`}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="font-medium">
                    Lote <strong>{rot.batchName}</strong> em{" "}
                    <em>{rot.areaName}</em>
                  </span>
                  <Badge variant="destructive" className="text-[11px]">
                    +{rot.daysExceeded} dias além do limite ({rot.daysOccupied}{" "}
                    dias no pasto)
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
