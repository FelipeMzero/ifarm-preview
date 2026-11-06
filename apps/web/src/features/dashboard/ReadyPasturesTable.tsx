import { CheckCircle2 } from "lucide-react";
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
import type { DashboardReadyPasture } from "@ifarm/shared";

type ReadyPasturesTableProps = {
  data: DashboardReadyPasture[];
};

export function ReadyPasturesTable({ data }: ReadyPasturesTableProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          Pastos Prontos para Uso ({data.length})
        </CardTitle>
        <CardDescription>
          Áreas com período de descanso cumprido ou liberadas para ocupação
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {data.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma pastagem pronta para uso no momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pastagem</TableHead>
                  <TableHead className="text-right">Área</TableHead>
                  <TableHead className="text-right">Taxa Suporte</TableHead>
                  <TableHead className="text-right">Capacidade</TableHead>
                  <TableHead className="text-center">
                    Dias Descansando
                  </TableHead>
                  <TableHead className="text-center">Mínimo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((pasture) => (
                  <TableRow key={pasture.id}>
                    <TableCell className="font-medium text-foreground">
                      {pasture.name}
                    </TableCell>
                    <TableCell className="text-right">
                      {pasture.hectares} ha
                    </TableCell>
                    <TableCell className="text-right">
                      {pasture.stockingRate} UA/ha
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {pasture.capacityUa} UA
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      >
                        {pasture.daysResting} dias
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {pasture.minRestDays} dias
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
