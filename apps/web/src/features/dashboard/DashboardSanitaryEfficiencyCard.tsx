import { Syringe, Zap, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardSanitary, DashboardEfficiency } from "@ifarm/shared";

type DashboardSanitaryEfficiencyCardProps = {
  sanitary: DashboardSanitary;
  efficiency: DashboardEfficiency;
};

export function DashboardSanitaryEfficiencyCard({
  sanitary,
  efficiency,
}: DashboardSanitaryEfficiencyCardProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Indicadores Sanitários */}
      <Card className="flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Syringe className="size-4 text-rose-600 dark:text-rose-400" />
            Indicadores Sanitários e Carência
          </CardTitle>
          <CardDescription>
            Procedimentos aplicados e retenção sanitária médica
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-3">
              <span className="text-xs text-muted-foreground">
                Procedimentos (30 dias)
              </span>
              <div className="mt-1 text-2xl font-bold text-foreground">
                {sanitary.procedures30d}
              </div>
              <span className="text-[11px] text-muted-foreground">
                Aplicações recentes
              </span>
            </div>

            <div className="rounded-lg border p-3">
              <span className="text-xs text-muted-foreground">
                Procedimentos (90 dias)
              </span>
              <div className="mt-1 text-2xl font-bold text-foreground">
                {sanitary.procedures90d}
              </div>
              <span className="text-[11px] text-muted-foreground">
                Último trimestre
              </span>
            </div>
          </div>

          {/* Animais em carência se houver */}
          {sanitary.activeWithdrawalAnimals.length > 0 ? (
            <div className="space-y-2 rounded-lg border border-rose-200 bg-rose-50/30 p-3 dark:border-rose-900/50 dark:bg-rose-950/10">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-900 dark:text-rose-200">
                <ShieldAlert className="size-3.5" />
                Animais em período de carência (
                {sanitary.activeWithdrawalAnimals.length}):
              </div>
              <div className="max-h-32 space-y-1.5 overflow-y-auto pr-1">
                {sanitary.activeWithdrawalAnimals.map((item) => (
                  <div
                    key={`${item.animalId}-${item.withdrawalEndDate}`}
                    className="flex items-center justify-between text-xs"
                  >
                    <span>
                      <strong>{item.identifier}</strong> · {item.title}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[11px] font-medium border-rose-300 text-rose-700 dark:border-rose-800 dark:text-rose-300"
                    >
                      {item.daysRemaining} dias restantes
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              Nenhum animal em período de carência ativa no momento.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Eficiência Produtiva por Hectare */}
      <Card className="flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Zap className="size-4 text-amber-600 dark:text-amber-400" />
            Eficiência Produtiva por Hectare
          </CardTitle>
          <CardDescription>
            Capacidade de conversão de pastagem em ganho de peso vivo
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between p-4 space-y-4">
          <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-4">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Ganho Médio Diário por Hectare
              </span>
              <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                {efficiency.kgPerHaPerDay != null
                  ? `${efficiency.kgPerHaPerDay} kg/ha/dia`
                  : "—"}
              </div>
            </div>
            <Zap className="size-8 text-amber-500/20" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-muted-foreground">
                Ganho Total Estimado (30d):
              </span>
              <p className="font-semibold">{efficiency.totalGainKg} kg</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">
                Área em Pastejo Ativo:
              </span>
              <p className="font-semibold">{efficiency.occupiedHectares} ha</p>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 p-2.5 text-[11px] text-muted-foreground">
            A eficiência produtiva por hectare é o indicador zootécnico que mede
            a taxa de transformação da forragem em ganho em carcaça na área
            ocupada.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
