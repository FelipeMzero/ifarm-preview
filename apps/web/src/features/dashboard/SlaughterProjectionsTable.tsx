import { TrendingUp } from "lucide-react";
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
import type { DashboardSlaughterProjection } from "@ifarm/shared";

type SlaughterProjectionsTableProps = {
  data: DashboardSlaughterProjection[];
};

export function SlaughterProjectionsTable({
  data,
}: SlaughterProjectionsTableProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
          Projeção de Abate (Predição Linear)
        </CardTitle>
        <CardDescription>
          Estimativa de atingimento do peso alvo (450 kg) com base na regressão
          linear das pesagens históricas
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {data.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Nenhum animal com histórico de pesagens suficiente para projeção de
            abate.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Animal</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead className="text-right">Peso Atual</TableHead>
                  <TableHead className="w-[180px]">
                    % do Alvo (450 kg)
                  </TableHead>
                  <TableHead className="text-right">GMD Projetado</TableHead>
                  <TableHead className="text-center">Data Prevista</TableHead>
                  <TableHead className="text-center">Dias Restantes</TableHead>
                  <TableHead className="text-right">Confiança (R²)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => {
                  const formattedDate = item.projectedSlaughterDate
                    ? new Date(
                        `${item.projectedSlaughterDate}T00:00:00`,
                      ).toLocaleDateString("pt-BR")
                    : "—";

                  const isReady = item.daysRemaining === 0;

                  return (
                    <TableRow key={item.animalId}>
                      <TableCell className="font-semibold text-foreground">
                        {item.identifier}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.batchName || "Sem lote"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.currentWeightKg} kg
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full ${
                                item.percentageOfTarget >= 100
                                  ? "bg-emerald-600"
                                  : "bg-amber-500"
                              }`}
                              style={{
                                width: `${Math.min(100, item.percentageOfTarget)}%`,
                              }}
                            />
                          </div>
                          <span className="w-12 text-right text-xs font-semibold">
                            {item.percentageOfTarget}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                        {item.projectedAdg > 0
                          ? `+${item.projectedAdg} kg/dia`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {formattedDate}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.daysRemaining !== null ? (
                          <Badge
                            variant="secondary"
                            className={
                              isReady
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : item.daysRemaining <= 30
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                            }
                          >
                            {isReady ? "Pronto" : `${item.daysRemaining} dias`}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {Math.round(item.confidenceR2 * 100)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
