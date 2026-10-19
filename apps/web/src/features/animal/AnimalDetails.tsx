"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Cake,
  Calendar,
  Fence,
  History,
  Layers,
  LineChart,
  Nfc,
  Pencil,
  ShoppingCart,
  Stethoscope,
  Syringe,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/our/ConfirmDialog";
import { ErrorPage } from "@/components/our/ErrorPage";
import {
  ANIMAL_ORIGIN_LABELS,
  ANIMAL_STATUS_LABELS,
  SEX_LABELS,
} from "@ifarm/shared";
import { cn } from "@/lib/utils";
import { AnimalFullDetails, deleteAnimal, getAnimalDetails } from "./services";
import { ORIGIN_VARIANT, SEX_ICON, STATUS_VARIANT } from "./display";
import { AnimalWeightChart } from "./AnimalWeightChart";
import {
  daysBetween,
  formatAge,
  formatCurrency,
  formatDate,
  formatDateOnly,
  formatDuration,
  formatKg,
  formatSignedKg,
} from "./format";
import {
  CountBadge,
  DetailsSkeleton,
  EmptyState,
  InfoItem,
  StatTile,
} from "@/components/our/DetailParts";
import { WeighingCorrectionNote } from "./WeighingCorrectionNote";

const ARROBA_KG = 15;

type TimelineEvent = {
  key: string;
  date: string;
  icon: React.ReactNode;
  title: string;
  description?: string | null;
};

function buildRecentActivity(animal: AnimalFullDetails): TimelineEvent[] {
  const events: TimelineEvent[] = [
    ...animal.weighings.map((w) => ({
      key: `w-${w.id}`,
      date: w.date,
      icon: <Weight className="size-3.5" />,
      title: `Pesagem: ${formatKg(w.weightKg)}`,
      description: w.notes,
    })),
    ...animal.batchHistory.map((b) => ({
      key: `b-${b.id}`,
      date: b.enteredAt,
      icon: <Layers className="size-3.5" />,
      title: b.batchName ? `Entrada no lote ${b.batchName}` : "Saída de lote",
      description: b.notes,
    })),
    ...animal.propertyHistory.map((p) => ({
      key: `p-${p.id}`,
      date: p.enteredAt,
      icon: <Fence className="size-3.5" />,
      title: `Entrada na propriedade ${p.propertyName}`,
      description: p.notes,
    })),
    ...animal.tagHistory.map((t) => ({
      key: `t-${t.id}`,
      date: t.date,
      icon: <Tag className="size-3.5" />,
      title: t.value ? `Brinco ${t.value}` : "Brinco removido",
      description: t.notes,
    })),
    ...animal.rfidHistory.map((r) => ({
      key: `r-${r.id}`,
      date: r.date,
      icon: <Nfc className="size-3.5" />,
      title: r.value ? `RFID ${r.value}` : "RFID removido",
      description: r.notes,
    })),
    ...animal.neutering.map((n, i) => ({
      key: `n-${n.id}`,
      date: n.date,
      icon: <Stethoscope className="size-3.5" />,
      // lista vem da mais recente para a mais antiga
      title: i < animal.neutering.length - 1 ? "Recastração" : "Castração",
      description: n.techniqueName ?? n.notes,
    })),
    ...animal.health.map((h) => ({
      key: `h-${h.id}`,
      date: h.date,
      icon: <Syringe className="size-3.5" />,
      title: h.title ? `${h.typeName}: ${h.title}` : h.typeName,
      description: h.notes,
    })),
  ];

  if (animal.purchase) {
    events.push({
      key: "purchase",
      date: animal.purchase.date,
      icon: <ShoppingCart className="size-3.5" />,
      title: `Compra de ${animal.purchase.sellerName}`,
      description: animal.purchase.notes,
    });
  }

  return events.sort((a, b) => b.date.localeCompare(a.date));
}

export default function AnimalDetails({
  id,
  onClose,
}: {
  id: string;
  onClose?: () => void;
}) {
  const router = useRouter();
  const [animal, setAnimal] = useState<AnimalFullDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getAnimalDetails(id);
        if (!cancelled) setAnimal(data);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleDelete() {
    try {
      await deleteAnimal(id);
      toast.success("Registro excluído com sucesso!");
      if (onClose) onClose();
      else router.push("/animais");
    } catch (e) {
      toast.error(
        (e as Error).message || "Não foi possível excluir o registro.",
      );
    } finally {
      setConfirmingDelete(false);
    }
  }

  if (error) {
    return (
      <ErrorPage
        message="Não foi possível obter os dados do animal."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!animal) {
    return <DetailsSkeleton />;
  }

  const weighings = animal.weighings;
  const lastWeighing = weighings.at(-1);
  const previousWeighing = weighings.at(-2);
  const firstWeighing = weighings[0];
  const weightDelta =
    lastWeighing && previousWeighing
      ? lastWeighing.weightKg - previousWeighing.weightKg
      : null;

  const trackedDays =
    firstWeighing && lastWeighing
      ? daysBetween(firstWeighing.date, lastWeighing.date)
      : 0;
  const totalGain =
    firstWeighing && lastWeighing && weighings.length > 1
      ? lastWeighing.weightKg - firstWeighing.weightKg
      : null;
  const averageDailyGain =
    totalGain != null && trackedDays > 0 ? totalGain / trackedDays : null;

  const currentBatchEntry = animal.batchHistory.find((b) => !b.exitedAt);
  const currentPropertyEntry = animal.propertyHistory.find((p) => !p.exitedAt);
  const recentActivity = buildRecentActivity(animal);

  const statusLabel =
    ANIMAL_STATUS_LABELS[animal.status as keyof typeof ANIMAL_STATUS_LABELS] ??
    animal.status;
  const originLabel =
    ANIMAL_ORIGIN_LABELS[animal.origin as keyof typeof ANIMAL_ORIGIN_LABELS] ??
    animal.origin;
  const sexLabel =
    SEX_LABELS[animal.sex as keyof typeof SEX_LABELS] ?? animal.sex;

  const title =
    animal.name ||
    (animal.currentTag ? `Brinco ${animal.currentTag}` : `ID ${animal.code}`);

  const purchase = animal.purchase;
  const purchaseValue = purchase?.cost ?? purchase?.totalPrice ?? null;

  const weighingsDesc = [...weighings].reverse();

  return (
    <div className="w-full max-w-5xl space-y-4">
      <div
        className={cn(
          "flex items-center",
          onClose ? "justify-end" : "justify-between",
        )}
      >
        {!onClose && (
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="size-4" /> Voltar
          </Button>
        )}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/animais/${animal.id}`)}
          >
            <Pencil className="size-4" /> Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmingDelete(true)}
          >
            <Trash2 className="size-4" /> Excluir
          </Button>
        </div>
      </div>

      {/* Cabeçalho */}
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar className="size-14">
            <AvatarFallback className="bg-primary/10">
              {SEX_ICON[animal.sex] ?? <CowHead className="size-6" />}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold">{title}</h1>
              <Badge variant={STATUS_VARIANT[animal.status] ?? "outline"}>
                {statusLabel}
              </Badge>
              <Badge variant={ORIGIN_VARIANT[animal.origin] ?? "outline"}>
                {originLabel}
              </Badge>
              {animal.neutered && <Badge variant="outline">Castrado</Badge>}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Tag className="size-3.5" />
                {animal.currentTag ?? "Sem brinco"}
              </span>
              <span className="flex items-center gap-1.5">
                <Nfc className="size-3.5" />
                {animal.currentRfid ?? "Sem RFID"}
              </span>
              <span className="flex items-center gap-1.5">
                <Fence className="size-3.5" />
                {animal.currentProperty.name}
              </span>
              <span className="tabular-nums">ID {animal.code}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile
          icon={<Weight className="size-3.5" />}
          label="Peso atual"
          value={
            animal.currentWeightKg != null
              ? formatKg(animal.currentWeightKg)
              : "—"
          }
          hint={
            weightDelta != null ? (
              <span className="flex items-center gap-1">
                {weightDelta >= 0 ? (
                  <TrendingUp className="size-3.5 text-primary" />
                ) : (
                  <TrendingDown className="size-3.5 text-destructive" />
                )}
                {formatSignedKg(weightDelta)} desde a pesagem anterior
              </span>
            ) : lastWeighing ? (
              `Pesado em ${formatDate(lastWeighing.date)}`
            ) : (
              "Sem pesagens"
            )
          }
        />
        <StatTile
          icon={<Cake className="size-3.5" />}
          label="Idade"
          value={animal.birthDate ? formatAge(animal.birthDate) : "—"}
          hint={
            animal.birthDate
              ? `Nascido em ${formatDateOnly(animal.birthDate)}`
              : "Data de nascimento não informada"
          }
        />
        <StatTile
          icon={<LineChart className="size-3.5" />}
          label="Ganho médio diário"
          value={
            averageDailyGain != null
              ? `${averageDailyGain.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} kg/dia`
              : "—"
          }
          hint={
            totalGain != null
              ? `${formatSignedKg(totalGain)} em ${formatDuration(trackedDays)}`
              : "Requer ao menos duas pesagens"
          }
        />
        <StatTile
          icon={<Layers className="size-3.5" />}
          label="Lote atual"
          value={animal.currentBatch?.name ?? "Sem lote"}
          hint={
            currentBatchEntry
              ? `Há ${formatDuration(daysBetween(currentBatchEntry.enteredAt))}`
              : undefined
          }
        />
      </div>

      <Tabs defaultValue="overview" className="gap-4">
        <div className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="overview">Visão geral</TabsTrigger>
            <TabsTrigger value="weight">
              Peso <CountBadge count={weighings.length} />
            </TabsTrigger>
            <TabsTrigger value="batches">
              Lotes <CountBadge count={animal.batchHistory.length} />
            </TabsTrigger>
            <TabsTrigger value="identification">
              Identificação{" "}
              <CountBadge
                count={animal.tagHistory.length + animal.rfidHistory.length}
              />
            </TabsTrigger>
            <TabsTrigger value="health">
              Sanitário{" "}
              <CountBadge
                count={animal.health.length + animal.neutering.length}
              />
            </TabsTrigger>
            <TabsTrigger value="properties">
              Propriedades <CountBadge count={animal.propertyHistory.length} />
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Visão geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Dados cadastrais</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <InfoItem label="Apelido">{animal.name || "—"}</InfoItem>
                  <InfoItem label="Sexo">{sexLabel}</InfoItem>
                  <InfoItem label="Raça">{animal.breedName ?? "—"}</InfoItem>
                  <InfoItem label="Nascimento">
                    {formatDateOnly(animal.birthDate)}
                  </InfoItem>
                  <InfoItem label="Origem">{originLabel}</InfoItem>
                  <InfoItem label="Castrado">
                    {animal.neutered ? "Sim" : "Não"}
                  </InfoItem>
                  <InfoItem label="Na propriedade desde">
                    {formatDate(currentPropertyEntry?.enteredAt)}
                  </InfoItem>
                  <InfoItem label="Cadastrado em">
                    {formatDate(animal.createdAt)}
                  </InfoItem>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="size-4" /> Aquisição
                </CardTitle>
                {!purchase && (
                  <CardDescription>
                    Origem: {originLabel.toLowerCase()}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {purchase ? (
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <InfoItem label="Vendedor">
                      <button
                        type="button"
                        className="text-left underline-offset-4 hover:underline"
                        onClick={() =>
                          router.push(`/pessoas/${purchase.sellerId}/detalhes`)
                        }
                      >
                        {purchase.sellerName}
                      </button>
                    </InfoItem>
                    <InfoItem label="Data da compra">
                      {formatDate(purchase.date)}
                    </InfoItem>
                    <InfoItem label="Valor">
                      {purchaseValue != null
                        ? formatCurrency(purchaseValue)
                        : "—"}
                    </InfoItem>
                    <InfoItem label="Peso de entrada">
                      {purchase.weightKg != null
                        ? formatKg(purchase.weightKg)
                        : "—"}
                    </InfoItem>
                    {purchaseValue != null && purchase.weightKg ? (
                      <InfoItem label="Preço por arroba">
                        {formatCurrency(
                          purchase.pricePerArroba ??
                            (purchaseValue / purchase.weightKg) * ARROBA_KG,
                        )}
                      </InfoItem>
                    ) : null}
                    <InfoItem label="GTA">{purchase.gtaNumber ?? "—"}</InfoItem>
                    {purchase.notes && (
                      <div className="col-span-2">
                        <InfoItem label="Observações">
                          <span className="font-normal">{purchase.notes}</span>
                        </InfoItem>
                      </div>
                    )}
                  </dl>
                ) : (
                  <EmptyState
                    icon={<ShoppingCart />}
                    message="Nenhuma compra vinculada a este animal."
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="size-4" /> Atividade recente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <EmptyState
                  icon={<History />}
                  message="Nenhum evento registrado."
                />
              ) : (
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Peso */}
        <TabsContent value="weight" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução do peso</CardTitle>
              <CardDescription>
                {weighings.length > 1
                  ? `${weighings.length} pesagens entre ${formatDate(firstWeighing!.date)} e ${formatDate(lastWeighing!.date)}`
                  : "Registre ao menos duas pesagens para visualizar a evolução."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {weighings.length > 1 ? (
                <AnimalWeightChart
                  weighings={weighings}
                  birthDate={animal.birthDate}
                  birthDateEstimated={animal.birthDateEstimated}
                />
              ) : (
                <EmptyState
                  icon={<LineChart />}
                  message={
                    lastWeighing
                      ? `Única pesagem: ${formatKg(lastWeighing.weightKg)} em ${formatDate(lastWeighing.date)}`
                      : "Nenhuma pesagem registrada."
                  }
                />
              )}
            </CardContent>
          </Card>

          {weighings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pesagens</CardTitle>
              </CardHeader>
              <CardContent>
                <Table className="[&_tr]:border-border">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Peso</TableHead>
                      <TableHead className="text-right">Variação</TableHead>
                      <TableHead className="text-right">Intervalo</TableHead>
                      <TableHead className="text-right">GMD</TableHead>
                      <TableHead>Observação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weighingsDesc.map((w, i) => {
                      const prev = weighingsDesc[i + 1];
                      const diff = prev ? w.weightKg - prev.weightKg : null;
                      const days = prev ? daysBetween(prev.date, w.date) : null;
                      const gmd = diff != null && days ? diff / days : null;
                      return (
                        <TableRow key={w.id}>
                          <TableCell>{formatDate(w.date)}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            <div className="font-medium">
                              {formatKg(w.weightKg)}
                            </div>
                            <WeighingCorrectionNote weighing={w} />
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right tabular-nums",
                              diff != null && diff < 0 && "text-destructive",
                            )}
                          >
                            {diff != null ? formatSignedKg(diff) : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {days != null ? formatDuration(days) : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {gmd != null
                              ? `${gmd.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} kg/dia`
                              : "—"}
                          </TableCell>
                          <TableCell className="max-w-48 truncate text-muted-foreground">
                            {w.notes || "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Lotes */}
        <TabsContent value="batches">
          <Card>
            <CardHeader>
              <CardTitle>Trocas de lote</CardTitle>
              <CardDescription>
                Histórico de permanência do animal em cada lote.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {animal.batchHistory.length === 0 ? (
                <EmptyState
                  icon={<Layers />}
                  message="Nenhuma movimentação de lote registrada."
                />
              ) : (
                <ol className="relative ml-3 border-l">
                  {animal.batchHistory.map((b) => {
                    const isCurrent = !b.exitedAt;
                    return (
                      <li key={b.id} className="relative pb-6 pl-6 last:pb-0">
                        <span
                          className={cn(
                            "absolute -left-1.75 top-1 size-3.5 rounded-full border-2 border-card",
                            isCurrent ? "bg-primary" : "bg-muted-foreground/40",
                          )}
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">
                            {b.batchName ?? "Sem lote"}
                          </p>
                          {isCurrent && <Badge>Atual</Badge>}
                        </div>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="size-3" />
                          {formatDate(b.enteredAt)}
                          {" → "}
                          {b.exitedAt ? formatDate(b.exitedAt) : "hoje"}
                          <span aria-hidden>·</span>
                          {formatDuration(
                            daysBetween(b.enteredAt, b.exitedAt ?? undefined),
                          )}
                        </p>
                        {b.notes && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {b.notes}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Identificação */}
        <TabsContent value="identification">
          <div className="grid gap-4 md:grid-cols-2">
            {(
              [
                {
                  key: "tag",
                  title: "Brincos",
                  icon: <Tag className="size-4" />,
                  rows: animal.tagHistory,
                  current: animal.currentTag,
                },
                {
                  key: "rfid",
                  title: "RFID",
                  icon: <Nfc className="size-4" />,
                  rows: animal.rfidHistory,
                  current: animal.currentRfid,
                },
              ] as const
            ).map((section) => (
              <Card key={section.key}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {section.icon} {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {section.rows.length === 0 ? (
                    <EmptyState
                      icon={section.icon}
                      message="Nenhum registro."
                    />
                  ) : (
                    <Table className="[&_tr]:border-border">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Observação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {section.rows.map((row, i) => (
                          <TableRow key={row.id}>
                            <TableCell>{formatDate(row.date)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {row.value ?? "Removido"}
                                </span>
                                {i === 0 &&
                                  row.value &&
                                  row.value === section.current && (
                                    <Badge variant="secondary">Atual</Badge>
                                  )}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-40 truncate text-muted-foreground">
                              {row.notes || "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Sanitário */}
        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Syringe className="size-4" /> Manejos sanitários
              </CardTitle>
            </CardHeader>
            <CardContent>
              {animal.health.length === 0 ? (
                <EmptyState
                  icon={<Syringe />}
                  message="Nenhum manejo sanitário registrado."
                />
              ) : (
                <Table className="[&_tr]:border-border">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Procedimento</TableHead>
                      <TableHead>Veterinário</TableHead>
                      <TableHead>Carência até</TableHead>
                      <TableHead>Próxima dose</TableHead>
                      <TableHead className="text-right">Dose</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {animal.health.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell>{formatDate(h.date)}</TableCell>
                        <TableCell>
                          <div className="font-medium">{h.typeName}</div>
                          {(h.title || h.notes) && (
                            <div className="text-xs text-muted-foreground">
                              {[h.title, h.notes].filter(Boolean).join(" — ")}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{h.veterinarianName ?? "—"}</TableCell>
                        <TableCell>
                          {formatDateOnly(h.withdrawalUntil)}
                        </TableCell>
                        <TableCell>{formatDateOnly(h.nextDueDate)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {h.doseMl != null
                            ? `${h.doseMl.toLocaleString("pt-BR")} ml`
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="size-4" /> Castração
              </CardTitle>
            </CardHeader>
            <CardContent>
              {animal.neutering.length === 0 ? (
                <EmptyState
                  icon={<Stethoscope />}
                  message={
                    animal.neutered
                      ? "Animal castrado, sem registro do procedimento."
                      : "Animal não castrado."
                  }
                />
              ) : (
                <Table className="[&_tr]:border-border">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Técnica</TableHead>
                      <TableHead>Observação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {animal.neutering.map((n, i) => (
                      <TableRow key={n.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {formatDate(n.date)}
                            {i < animal.neutering.length - 1 && (
                              <Badge variant="secondary">Recastração</Badge>
                            )}
                          </div>
                          {n.correctedAt && (
                            <div
                              className="text-xs text-muted-foreground"
                              title={`Corrigida em ${formatDate(n.correctedAt)}`}
                            >
                              corrigido
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{n.techniqueName ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {n.notes || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Propriedades */}
        <TabsContent value="properties">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fence className="size-4" /> Histórico de propriedades
              </CardTitle>
            </CardHeader>
            <CardContent>
              {animal.propertyHistory.length === 0 ? (
                <EmptyState
                  icon={<Fence />}
                  message="Nenhum histórico de propriedade."
                />
              ) : (
                <Table className="[&_tr]:border-border">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Propriedade</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>Saída</TableHead>
                      <TableHead className="text-right">Permanência</TableHead>
                      <TableHead>Observação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {animal.propertyHistory.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {p.propertyName}
                            </span>
                            {!p.exitedAt && (
                              <Badge variant="secondary">Atual</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(p.enteredAt)}</TableCell>
                        <TableCell>{formatDate(p.exitedAt)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatDuration(
                            daysBetween(p.enteredAt, p.exitedAt ?? undefined),
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {p.notes || "—"}
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

      <ConfirmDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        onConfirm={handleDelete}
        description="Esta ação não pode ser desfeita. O registro será removido permanentemente."
      />
    </div>
  );
}
