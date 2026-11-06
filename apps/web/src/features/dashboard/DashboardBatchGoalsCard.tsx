import { Target, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DashboardBatchGoal } from "@ifarm/shared";

type DashboardBatchGoalsCardProps = {
  goals: DashboardBatchGoal[];
};

export function DashboardBatchGoalsCard({
  goals,
}: DashboardBatchGoalsCardProps) {
  if (goals.length === 0) return null;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Target className="size-4 text-sky-600 dark:text-sky-400" />
          Metas de Venda dos Lotes ({goals.length})
        </CardTitle>
        <CardDescription>
          Acompanhamento do peso médio em direção à meta de comercialização
          planejada
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lote</TableHead>
                <TableHead className="text-center">Animais</TableHead>
                <TableHead className="text-right">Peso Atual Médio</TableHead>
                <TableHead className="text-right">Meta de Peso</TableHead>
                <TableHead className="text-center">Data Alvo</TableHead>
                <TableHead className="text-center">Dias Restantes</TableHead>
                <TableHead className="text-right">GMD Necessário</TableHead>
                <TableHead className="text-center">Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goals.map((g) => {
                const formattedDate = new Date(
                  `${g.targetDate}T00:00:00`,
                ).toLocaleDateString("pt-BR");

                const statusBadge =
                  g.status === "REACHED" ? (
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 gap-1">
                      <CheckCircle2 className="size-3" /> Atingida
                    </Badge>
                  ) : g.status === "ON_TRACK" ? (
                    <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 gap-1">
                      <Clock className="size-3" /> No Caminho
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="size-3" /> Atrasada
                    </Badge>
                  );

                return (
                  <TableRow key={g.batchId}>
                    <TableCell className="font-semibold text-foreground">
                      {g.batchName}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {g.currentAnimalCount} cab.
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {g.currentAvgWeightKg != null
                        ? `${g.currentAvgWeightKg} kg`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-foreground">
                      {g.targetWeightKg} kg
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {formattedDate}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {g.daysRemaining} dias
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {g.requiredAdg != null ? (
                        <span className="font-medium text-amber-600 dark:text-amber-400">
                          +{g.requiredAdg} kg/dia
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-center">{statusBadge}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
