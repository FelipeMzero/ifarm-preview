import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Boxes,
  Calendar,
  CalendarClock,
  CircleCheck,
  Clock,
  Fence,
  Gauge,
  History,
  Info,
  LineChart,
  Map,
  Pencil,
  ShoppingCart,
  Target,
  TriangleAlert,
  Weight,
} from "lucide-react";
import { CowHead } from "@/components/icons/cow-head";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CountBadge,
  DetailsSkeleton,
  EmptyState,
  InfoItem,
  StatTile,
} from "@/components/our/DetailParts";
import { ErrorPage } from "@/components/our/ErrorPage";
import { AnimalIdentification, SEX_ICON } from "@/features/animal/display";
import {
  daysBetween,
  formatAge,
  formatDate,
  formatDateOnly,
  formatDuration,
  formatKg,
} from "@/features/animal/format";
import { cn } from "@/lib/utils";
import { BatchGoalChart } from "./BatchGoalChart";
import { projectBatch } from "@ifarm/shared";
import { batchClient } from "@/lib/clients";
import { type BatchFullDetails, formatEventDateTime } from "@ifarm/shared";

function formatAdg(value: number | null | undefined) {
  if (value == null) return "—";
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} kg/dia`;
}

type TimelineEvent = {
  key: string;
  date: string;
  icon: React.ReactNode;
  title: string;
  description?: string | null;
};

function buildRecentActivity(batch: BatchFullDetails): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      key: "created",
      date: batch.createdAt,
      icon: <Boxes className="size-3.5" />,
      title: "Lote criado",
    },
    ...batch.areaHistory.map((h) => ({
      key: `a-${h.id}`,
      date: h.enteredAt,
      icon: <Map className="size-3.5" />,
      title: `Entrada na área ${h.area.name}`,
      description: h.notes,
    })),
    ...batch.confirmedTransfers.map((t) => ({
      key: `t-${t.direction}-${t.id}`,
      date: t.date,
      icon:
        t.direction === "in" ? (
          <ArrowDownLeft className="size-3.5" />
        ) : (
          <ArrowUpRight className="size-3.5" />
        ),
      title:
        t.direction === "in"
          ? `Transferência recebida: ${t.animalCount} animal(is)`
          : `Transferência para ${t.otherBatchName}: ${t.animalCount} animal(is)`,
    })),
    ...batch.purchases.map((p) => ({
      key: `p-${p.id}`,
      date: p.date,
      icon: <ShoppingCart className="size-3.5" />,
      title: `Compra de ${p.seller.name}: ${p.animalCount} animal(is)`,
    })),
  ];

  return events.sort((a, b) => b.date.localeCompare(a.date));
}

export default function BatchDetails({
  id,
  onClose,
}: {
  id: string;
  onClose?: () => void;
}) {
  const navigate = useNavigate();
  const [batch, setBatch] = useState<BatchFullDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [simulatedAdg, setSimulatedAdg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await batchClient.getBatchDetails(id);
        if (!cancelled) setBatch(data);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const simulated = simulatedAdg.trim() ? Number(simulatedAdg) : null;
  const projection = useMemo(
    () =>
      batch
        ? projectBatch(
            batch.animals,
            batch.saleGoal,
            simulated != null && Number.isFinite(simulated) ? simulated : null,
          )
        : null,
    [batch, simulated],
  );

  if (error) {
    return (
      <ErrorPage
        message="Não foi possível obter os dados do lote."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!batch || !projection) {
    return <DetailsSkeleton />;
  }

  const goal = batch.saleGoal;
  const isClosed = batch.closedAt != null;
  const animals = batch.animals;
  const males = animals.filter((a) => a.sex === "MALE").length;
  const females = animals.length - males;
  const weights = animals
    .map((a) => a.currentWeightKg)
    .filter((w): w is number => w != null);
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  const avgWeight = weights.length ? totalWeight / weights.length : null;
  const stockingPercent =
    batch.stocking && batch.stocking.capacityUa > 0
      ? (batch.stocking.currentUa / batch.stocking.capacityUa) * 100
      : null;
  const recentActivity = buildRecentActivity(batch);
  const pendingCount =
    batch.pendingTransfers.incoming.length +
    batch.pendingTransfers.outgoing.length;
  const showProjectionColumn = goal?.targetDate != null;

  function goTo(path: string) {
    onClose?.();
    navigate(path);
  }

  return (
    <div className="w-full max-w-5xl space-y-4">
      <div
        className={cn(
          "flex items-center",
          onClose ? "justify-end" : "justify-between",
        )}
      >
        {!onClose && (
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-4" /> Voltar
          </Button>
        )}
        <div className="flex items-center gap-1">
          {!isClosed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                goTo(`/lotes/transferencias/nova?destino=${batch.id}`)
              }
            >
              <ArrowRightLeft className="size-4" /> Transferir animais
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goTo(`/lotes/${batch.id}`)}
          >
            <Pencil className="size-4" /> Editar
          </Button>
        </div>
      </div>

      {/* Cabeçalho */}
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar className="size-14">
            <AvatarFallback className="bg-primary/10">
              <Boxes className="size-6" />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold">{batch.name}</h1>
              <Badge variant={isClosed ? "secondary" : "default"}>
                {isClosed ? "Encerrado" : "Vigente"}
              </Badge>
              {goal && (
                <Badge variant="outline">
                  <Target /> Meta de venda
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Map className="size-3.5" />
                {batch.currentArea?.name ?? "Sem área"}
              </span>
              <span className="flex items-center gap-1.5">
                <Fence className="size-3.5" />
                {batch.property.name}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                Criado em {formatDate(batch.createdAt)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile
          icon={<CowHead className="size-3.5" />}
          label="Animais"
          value={animals.length}
          hint={
            animals.length
              ? `${males} macho(s) · ${females} fêmea(s)`
              : "Nenhum animal no lote"
          }
        />
        <StatTile
          icon={<Weight className="size-3.5" />}
          label="Peso médio"
          value={avgWeight != null ? formatKg(avgWeight, 1) : "—"}
          hint={
            weights.length
              ? `Total ${formatKg(totalWeight, 0)}${
                  weights.length < animals.length
                    ? ` · ${animals.length - weights.length} sem peso`
                    : ""
                }`
              : "Sem pesagens"
          }
        />
        <StatTile
          icon={<LineChart className="size-3.5" />}
          label="Ganho médio diário"
          value={formatAdg(projection.measuredAdg)}
          hint={
            projection.measuredAdgCount
              ? `Média de ${projection.measuredAdgCount} animal(is)`
              : "Requer pesagens com 14+ dias de intervalo"
          }
        />
        <StatTile
          icon={<Gauge className="size-3.5" />}
          label="Lotação"
          value={
            stockingPercent != null ? `${Math.round(stockingPercent)}%` : "—"
          }
          hint={
            batch.stocking
              ? `${batch.stocking.currentUa.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} de ${batch.stocking.capacityUa.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} UA`
              : "Lote sem área"
          }
        />
      </div>

      <Tabs defaultValue="overview" className="gap-4">
        <div className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="overview">Visão geral</TabsTrigger>
            <TabsTrigger value="goal">Meta</TabsTrigger>
            <TabsTrigger value="animals">
              Animais <CountBadge count={animals.length} />
            </TabsTrigger>
            <TabsTrigger value="movements">
              Movimentações <CountBadge count={batch.movements.length} />
            </TabsTrigger>
            <TabsTrigger value="areas">
              Áreas <CountBadge count={batch.areaHistory.length} />
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Visão geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Dados do lote</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <InfoItem label="Área atual">
                    {batch.currentArea?.name ?? "—"}
                  </InfoItem>
                  <InfoItem label="Na área desde">
                    {formatDate(batch.currentArea?.enteredAt)}
                  </InfoItem>
                  <InfoItem label="Tamanho da área">
                    {batch.currentArea
                      ? `${batch.currentArea.hectares.toLocaleString("pt-BR")} ha`
                      : "—"}
                  </InfoItem>
                  <InfoItem label="Lotação da área">
                    {batch.currentArea
                      ? `${batch.currentArea.stockingRate.toLocaleString("pt-BR")} UA/ha`
                      : "—"}
                  </InfoItem>
                  <InfoItem label="Criado em">
                    {formatDate(batch.createdAt)}
                  </InfoItem>
                  <InfoItem label="Encerrado em">
                    {formatDate(batch.closedAt)}
                  </InfoItem>
                  {batch.notes && (
                    <div className="col-span-2">
                      <InfoItem label="Descrição">
                        <span className="font-normal">{batch.notes}</span>
                      </InfoItem>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="size-4" /> Meta de venda
                </CardTitle>
              </CardHeader>
              <CardContent>
                {goal ? (
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <InfoItem label="Peso médio alvo">
                      {goal.targetWeightKg != null
                        ? formatKg(goal.targetWeightKg)
                        : "—"}
                    </InfoItem>
                    <InfoItem label="Data alvo">
                      {formatDateOnly(goal.targetDate)}
                    </InfoItem>
                    <InfoItem label="Previsão de atingir">
                      {projection.estimatedDate
                        ? projection.reached
                          ? "Já atingida"
                          : formatDate(projection.estimatedDate.toISOString())
                        : "—"}
                    </InfoItem>
                    <InfoItem label="Animais na meta">
                      {goal.targetWeightKg != null
                        ? `${projection.animalsAtTarget} de ${animals.length}`
                        : "—"}
                    </InfoItem>
                  </dl>
                ) : (
                  <EmptyState
                    icon={<Target />}
                    message="Este lote não tem meta de venda."
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {pendingCount > 0 && (
            <PendingTransfersCard batch={batch} goTo={goTo} />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="size-4" /> Atividade recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {recentActivity.slice(0, 8).map((event) => (
                  <li key={event.key} className="flex gap-3">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      {event.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate text-sm font-medium">
                          {event.title}
                        </p>
                        <time className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {formatDate(event.date)}
                        </time>
                      </div>
                      {event.description && (
                        <p className="text-xs text-muted-foreground">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meta */}
        <TabsContent value="goal" className="space-y-4">
          {!goal || goal.targetWeightKg == null ? (
            <Card>
              <CardContent className="space-y-4">
                <EmptyState
                  icon={<Target />}
                  message="Defina uma meta de venda para acompanhar a projeção."
                />
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => goTo(`/lotes/${batch.id}`)}
                  >
                    <Pencil className="size-4" /> Definir meta
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <GoalProjection
              batch={batch}
              projection={projection}
              simulatedAdg={simulatedAdg}
              onSimulatedAdgChange={setSimulatedAdg}
            />
          )}
        </TabsContent>

        {/* Animais */}
        <TabsContent value="animals">
          <Card>
            <CardHeader>
              <CardTitle>Animais no lote</CardTitle>
              <CardDescription>
                Clique em um animal para ver os detalhes.
                {showProjectionColumn &&
                  ` A projeção considera o peso em ${formatDateOnly(goal!.targetDate)}.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {animals.length === 0 ? (
                <EmptyState
                  icon={<CowHead />}
                  message="Nenhum animal neste lote."
                />
              ) : (
                <Table className="[&_tr]:border-border">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Identificação</TableHead>
                      <TableHead>Sexo</TableHead>
                      <TableHead>Idade</TableHead>
                      <TableHead className="text-right">Peso atual</TableHead>
                      <TableHead className="text-right">GMD</TableHead>
                      <TableHead className="text-right">No lote há</TableHead>
                      {showProjectionColumn && (
                        <TableHead className="text-right">Projeção</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...animals]
                      .sort(
                        (a, b) =>
                          (b.currentWeightKg ?? -1) - (a.currentWeightKg ?? -1),
                      )
                      .map((a) => {
                        const projected = projection.projectAnimal(a);
                        const target = goal?.targetWeightKg ?? null;
                        const atTarget =
                          target != null &&
                          a.currentWeightKg != null &&
                          a.currentWeightKg >= target;
                        return (
                          <TableRow
                            key={a.id}
                            className="cursor-pointer"
                            onClick={() => goTo(`/animais/${a.id}/detalhes`)}
                          >
                            <TableCell>
                              <AnimalIdentification animal={a} />
                            </TableCell>
                            <TableCell>{SEX_ICON[a.sex] ?? a.sex}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {a.birthDate ? formatAge(a.birthDate) : "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              <div className="font-medium">
                                {a.currentWeightKg != null
                                  ? formatKg(a.currentWeightKg)
                                  : "—"}
                              </div>
                              {a.lastWeighingDate && (
                                <div className="text-xs text-muted-foreground">
                                  {formatDate(a.lastWeighingDate)}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatAdg(a.adgKgPerDay)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {a.enteredAt
                                ? formatDuration(daysBetween(a.enteredAt))
                                : "—"}
                            </TableCell>
                            {showProjectionColumn && (
                              <TableCell className="text-right tabular-nums">
                                {atTarget ? (
                                  <Badge>Na meta</Badge>
                                ) : projected != null ? (
                                  <span
                                    className={cn(
                                      target != null &&
                                        projected < target &&
                                        "text-warning",
                                    )}
                                  >
                                    {formatKg(projected, 0)}
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Movimentações */}
        <TabsContent value="movements" className="space-y-4">
          {pendingCount > 0 && (
            <PendingTransfersCard batch={batch} goTo={goTo} />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Entradas e saídas de animais</CardTitle>
              <CardDescription>
                Histórico de permanência de cada animal neste lote.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {batch.movements.length === 0 ? (
                <EmptyState
                  icon={<History />}
                  message="Nenhuma movimentação registrada."
                />
              ) : (
                <Table className="[&_tr]:border-border">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Animal</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Saída</TableHead>
                      <TableHead className="text-right">Permanência</TableHead>
                      <TableHead>Observação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batch.movements.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>
                          <AnimalIdentification animal={m.animal} />
                        </TableCell>
                        <TableCell>{formatDate(m.enteredAt)}</TableCell>
                        <TableCell>
                          {m.exitedAt ? (
                            formatDate(m.exitedAt)
                          ) : (
                            <Badge variant="secondary">No lote</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatDuration(
                            daysBetween(m.enteredAt, m.exitedAt ?? undefined),
                          )}
                        </TableCell>
                        <TableCell className="max-w-48 truncate text-muted-foreground">
                          {m.notes || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Áreas */}
        <TabsContent value="areas">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="size-4" /> Histórico de áreas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {batch.areaHistory.length === 0 ? (
                <EmptyState icon={<Map />} message="Nenhuma área registrada." />
              ) : (
                <Table className="[&_tr]:border-border">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Área</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Saída</TableHead>
                      <TableHead className="text-right">Permanência</TableHead>
                      <TableHead>Observação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batch.areaHistory.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{h.area.name}</span>
                            {!h.exitedAt && (
                              <Badge variant="secondary">Atual</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(h.enteredAt)}</TableCell>
                        <TableCell>{formatDate(h.exitedAt)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatDuration(
                            daysBetween(h.enteredAt, h.exitedAt ?? undefined),
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {h.notes || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PendingTransfersCard({
  batch,
  goTo,
}: {
  batch: BatchFullDetails;
  goTo: (path: string) => void;
}) {
  const rows = [
    ...batch.pendingTransfers.incoming.map((t) => ({
      id: t.id,
      date: t.transferredAt,
      icon: <ArrowDownLeft className="size-3.5" />,
      text: `Entrada de ${t.animalCount} animal(is)`,
      notes: t.notes,
    })),
    ...batch.pendingTransfers.outgoing.map((t) => ({
      id: t.id,
      date: t.transferredAt,
      icon: <ArrowUpRight className="size-3.5" />,
      text: `Saída de ${t.animalCount} animal(is) para ${t.destinationBatch.name}`,
      notes: t.notes,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-4" /> Transferências pendentes
        </CardTitle>
        <CardDescription>
          Planos ainda não confirmados: os animais continuam onde estão.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 py-2 text-left hover:bg-muted/40"
                onClick={() => goTo(`/lotes/transferencias/${r.id}`)}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  {r.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{r.text}</span>
                  {r.notes && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {r.notes}
                    </span>
                  )}
                </span>
                <time className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {formatEventDateTime(r.date)}
                </time>
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function GoalProjection({
  batch,
  projection,
  simulatedAdg,
  onSimulatedAdgChange,
}: {
  batch: BatchFullDetails;
  projection: ReturnType<typeof projectBatch>;
  simulatedAdg: string;
  onSimulatedAdgChange: (value: string) => void;
}) {
  const target = projection.targetWeightKg!;
  const remaining =
    projection.projectedTodayKg != null
      ? Math.max(0, target - projection.projectedTodayKg)
      : null;

  let status: {
    tone: "ok" | "warning" | "muted";
    title: string;
    text: string;
  };
  if (projection.weighedCount === 0) {
    status = {
      tone: "muted",
      title: "Sem dados para projetar",
      text: "Nenhum animal do lote tem peso registrado.",
    };
  } else if (projection.reached) {
    status = {
      tone: "ok",
      title: "Meta atingida",
      text: `O peso médio estimado do lote já passou de ${formatKg(target)}.`,
    };
  } else if (projection.adg == null) {
    status = {
      tone: "muted",
      title: "Ganho de peso desconhecido",
      text: "Os animais ainda não têm pesagens suficientes para medir o GMD. Informe um GMD abaixo para simular.",
    };
  } else if (projection.adg <= 0) {
    status = {
      tone: "warning",
      title: "Lote sem ganho de peso",
      text: "Com o GMD atual o lote não chega à meta.",
    };
  } else if (projection.onTrack === false) {
    status = {
      tone: "warning",
      title: "Abaixo do ritmo",
      text: `Na data alvo o peso médio projetado é ${formatKg(projection.projectedAtTargetKg!, 1)}, ${formatKg(target - projection.projectedAtTargetKg!, 1)} abaixo da meta.`,
    };
  } else if (projection.onTrack) {
    status = {
      tone: "ok",
      title: "No ritmo",
      text: `Na data alvo o peso médio projetado é ${formatKg(projection.projectedAtTargetKg!, 1)}.`,
    };
  } else {
    status = {
      tone: "muted",
      title: "Meta sem data",
      text: "Sem data alvo, a projeção mostra apenas quando a meta deve ser atingida.",
    };
  }

  const StatusIcon =
    status.tone === "ok"
      ? CircleCheck
      : status.tone === "warning"
        ? TriangleAlert
        : Info;

  return (
    <>
      <div
        className={cn(
          "flex items-start gap-2 rounded-md border p-3 text-sm",
          status.tone === "ok" && "border-primary/40 bg-primary/10",
          status.tone === "warning" && "border-warning/40 bg-warning/10",
          status.tone === "muted" && "border-border bg-muted/40",
        )}
      >
        <StatusIcon
          className={cn(
            "mt-0.5 size-4 shrink-0",
            status.tone === "ok" && "text-primary",
            status.tone === "warning" && "text-warning",
            status.tone === "muted" && "text-muted-foreground",
          )}
        />
        <div>
          <p className="font-medium">{status.title}</p>
          <p className="text-muted-foreground">{status.text}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile
          icon={<Target className="size-3.5" />}
          label="Meta"
          value={formatKg(target)}
          hint={
            projection.targetDate
              ? `até ${formatDateOnly(projection.targetDate)}${
                  projection.daysLeft != null
                    ? projection.daysLeft >= 0
                      ? ` (em ${formatDuration(projection.daysLeft)})`
                      : " (vencida)"
                    : ""
                }`
              : "Sem data alvo"
          }
        />
        <StatTile
          icon={<Weight className="size-3.5" />}
          label="Peso médio estimado hoje"
          value={
            projection.projectedTodayKg != null
              ? formatKg(projection.projectedTodayKg, 1)
              : "—"
          }
          hint={
            remaining != null && remaining > 0
              ? `Faltam ${formatKg(remaining, 1)}`
              : projection.unweighedCount
                ? `${projection.unweighedCount} animal(is) sem peso`
                : undefined
          }
        />
        <StatTile
          icon={<CalendarClock className="size-3.5" />}
          label="Previsão"
          value={
            projection.reached
              ? "Atingida"
              : projection.estimatedDate
                ? formatDate(projection.estimatedDate.toISOString())
                : "—"
          }
          hint={
            projection.adg != null
              ? `com GMD de ${formatAdg(projection.adg)}`
              : "Requer GMD"
          }
        />
        <StatTile
          icon={<LineChart className="size-3.5" />}
          label="GMD necessário"
          value={formatAdg(projection.requiredAdg)}
          hint={
            projection.requiredAdg != null && projection.measuredAdg != null
              ? `Medido: ${formatAdg(projection.measuredAdg)}`
              : projection.targetDate
                ? undefined
                : "Meta sem data"
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evolução e projeção do peso médio</CardTitle>
          <CardDescription>
            {projection.animalsAtTarget} de {batch.animals.length} animal(is) já
            atingiram {formatKg(target)}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {batch.weightSeries.length === 0 && projection.adg == null ? (
            <EmptyState
              icon={<LineChart />}
              message="Sem pesagens para exibir a evolução."
            />
          ) : (
            <BatchGoalChart
              series={batch.weightSeries}
              projection={projection}
            />
          )}

          <div className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              <p className="font-medium">Simular outro GMD</p>
              <p className="text-xs text-muted-foreground">
                {projection.measuredAdg != null
                  ? `Medido: ${formatAdg(projection.measuredAdg)} (${projection.measuredAdgCount} animal(is)). `
                  : "Ainda não há GMD medido. "}
                Deixe vazio para usar o valor medido.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                placeholder={
                  projection.measuredAdg != null
                    ? projection.measuredAdg.toFixed(3)
                    : "Ex: 0,8"
                }
                value={simulatedAdg}
                onChange={(e) => onSimulatedAdgChange(e.target.value)}
                className="w-32"
                aria-label="GMD simulado (kg/dia)"
              />
              <span className="text-sm text-muted-foreground">kg/dia</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            A projeção é linear: cada animal ganha peso a partir da sua última
            pesagem no próprio GMD (últimos 180 dias) ou, sem histórico, no GMD
            médio do lote. Não considera sazonalidade do pasto nem mudanças de
            manejo.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
