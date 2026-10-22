"use client";

import { formatInstant } from "./format";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRightLeft,
  Loader2,
  Scissors,
  Weight,
} from "lucide-react";
import { toast } from "sonner";

import { animalClient } from "@/lib/clients";
import {
  ApiError,
  type AnimalDetail,
  type IdentifierKind,
} from "@ifarm/shared";
import { breedClient } from "@/lib/clients";
import { type Breed } from "@ifarm/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormField } from "@/components/our/FormField";
import { ErrorPage } from "@/components/our/ErrorPage";
import FormSkeleton from "@/components/our/FormSkeleton";
import FieldRow from "@/components/our/FieldRow";
import { FormActionBar } from "@/components/our/FormActionBar";
import { SearchCombobox } from "@/components/our/SearchCombobox";
import {
  ANIMAL_ORIGIN_LABELS,
  ANIMAL_STATUS_LABELS,
  SEX_ITEMS,
} from "@ifarm/shared";
import { z } from "zod";
import { animalUpdateSchema } from "@ifarm/shared";

import { Separator } from "@/components/ui/separator";
import { AnimalBatchChangeDialog } from "./AnimalBatchChangeDialog";
import { AnimalWeighingHistoryDialog } from "./AnimalWeighingHistoryDialog";
import { AnimalIdentifierHistoryDialog } from "./AnimalIdentifierHistoryDialog";
import { AnimalNeuteringHistoryDialog } from "./AnimalNeuteringHistoryDialog";
import type { Commitment } from "@ifarm/shared";

// Edição pelo cadastro: os dados básicos, com as regras da API (troca de lote,
// identificação, pesagem e castração têm diálogos próprios e entram no mesmo PUT).
const animalEditFormSchema = animalUpdateSchema.pick({
  name: true,
  sex: true,
  birthDate: true,
  breedId: true,
});
type AnimalEditFormData = z.input<typeof animalEditFormSchema>;

type AnimalEditFormProps = {
  id: string;
  title?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
};

export function AnimalEditForm({
  id,
  title,
  onCancel,
  onSuccess,
}: AnimalEditFormProps) {
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [animal, setAnimal] = useState<AnimalDetail | null>(null);
  // Operações em aberto do animal, carregadas junto com ele para os avisos das janelas
  // de registro já aparecerem ao abrir.
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [breeds, setBreeds] = useState<Breed[]>([]);

  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [pendingBatchId, setPendingBatchId] = useState<string | null>(null);
  const [pendingBatchName, setPendingBatchName] = useState<string | null>(null);
  const [pendingBatchNotes, setPendingBatchNotes] = useState<
    string | undefined
  >();

  // Brinco, RFID, peso e castração são registrados na hora, pelas janelas de cada um
  // (registro + histórico); só o lote segue pendente até o "Salvar".
  const [weighingHistoryOpen, setWeighingHistoryOpen] = useState(false);
  const [identifierHistory, setIdentifierHistory] =
    useState<IdentifierKind | null>(null);

  const [neuteringHistoryOpen, setNeuteringHistoryOpen] = useState(false);

  const {
    handleSubmit,
    control,
    reset,
    setError,
    formState: { isSubmitting },
  } = useForm<AnimalEditFormData>({
    resolver: zodResolver(animalEditFormSchema, undefined, { raw: true }),
    defaultValues: {
      name: "",
      sex: "MALE",
      birthDate: "",
      breedId: "",
    },
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [detail, open] = await Promise.all([
          animalClient.getAnimal(id),
          // Sem a lista, só os avisos antecipados somem: o servidor ainda barra.
          animalClient.getAnimalCommitments(id).catch(() => []),
        ]);
        setAnimal(detail);
        setCommitments(open);
        reset({
          name: detail.name ?? "",
          sex: detail.sex as AnimalEditFormData["sex"],
          birthDate: detail.birthDate ?? "",
          breedId: detail.breedId ?? "",
        });
      } catch {
        setLoadFailed(true);
      } finally {
        setIsDataLoading(false);
      }
    }
    loadData();
  }, [id, reset]);

  useEffect(() => {
    async function loadBreeds() {
      try {
        const breedList = await breedClient.getBreeds();
        setBreeds(breedList.filter((b) => !b.deactivatedAt));
      } catch {
        setBreeds([]);
      }
    }
    loadBreeds();
  }, []);

  async function onSubmit(data: AnimalEditFormData) {
    try {
      await animalClient.updateAnimal(id, {
        ...data,
        newBatchId: pendingBatchId ?? undefined,
        batchChangeNotes: pendingBatchNotes,
      });

      const fresh = await animalClient.getAnimal(id);
      setAnimal(fresh);
      reset({
        name: fresh.name ?? "",
        sex: fresh.sex as AnimalEditFormData["sex"],
        birthDate: fresh.birthDate ?? "",
        breedId: fresh.breedId ?? "",
      });
      setPendingBatchId(null);
      setPendingBatchName(null);
      setPendingBatchNotes(undefined);

      toast.success("Atualizado com sucesso!");
      onSuccess?.();
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        Object.entries(error.errors).forEach(([field, message]) => {
          setError(field as keyof AnimalEditFormData, {
            type: "server",
            message,
          });
        });
        toast.error("Verifique os campos destacados.");
      } else if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("A requisição falhou! Tente novamente.");
      }
    }
  }

  if (loadFailed) {
    return (
      <ErrorPage
        message="Não foi possível obter os dados do servidor."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (isDataLoading || !animal) {
    return <FormSkeleton />;
  }

  const displayBatchName = pendingBatchName ?? animal.currentBatchName;
  const displayNeutering = animal.neutered
    ? animal.neuteredAt
      ? `Castrado em ${formatInstant(animal.neuteredAt)}`
      : "Castrado"
    : "Não castrado";

  return (
    <>
      <form
        className="mx-auto flex w-full max-w-300 flex-col gap-8"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-fit"
            onClick={() => onCancel?.()}
          >
            <ArrowLeft className="size-4" /> Voltar
          </Button>

          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {ANIMAL_ORIGIN_LABELS[
                animal.origin as keyof typeof ANIMAL_ORIGIN_LABELS
              ] ?? animal.origin}
            </Badge>
            <Badge>
              {ANIMAL_STATUS_LABELS[
                animal.status as keyof typeof ANIMAL_STATUS_LABELS
              ] ?? animal.status}
            </Badge>
          </div>
        </div>

        {title && <h1 className="text-2xl font-semibold">{title}</h1>}
        <Separator />

        <FieldSet className="border-0">
          <FieldLegend>Identificação</FieldLegend>

          <FieldRow cols={2}>
            <div className="space-y-2">
              <label
                htmlFor="currentTagDisplay"
                className="text-sm font-medium uppercase text-muted-foreground"
              >
                Brinco Atual
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="currentTagDisplay"
                  readOnly
                  value={animal.currentTag || "Nenhum"}
                  className="flex-1"
                />
                {/* Troca e histórico na mesma janela; a troca é gravada na hora. */}
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  title="Trocar brinco e ver histórico"
                  onClick={() => setIdentifierHistory("tag")}
                >
                  <ArrowRightLeft className="size-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="currentRfidDisplay"
                className="text-sm font-medium uppercase text-muted-foreground"
              >
                RFID Atual
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="currentRfidDisplay"
                  readOnly
                  value={animal.currentRfid || "Nenhum"}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  title="Trocar RFID e ver histórico"
                  onClick={() => setIdentifierHistory("rfid")}
                >
                  <ArrowRightLeft className="size-4" />
                </Button>
              </div>
            </div>
          </FieldRow>

          <FieldRow cols={3}>
            <FormField
              name="name"
              label="Apelido"
              control={control}
              render={({ field, id: fieldId }) => (
                <Input {...field} id={fieldId} placeholder="Ex: Mimosa" />
              )}
            />

            <Controller
              name="sex"
              control={control}
              render={({ field }) => (
                <FieldSet className="w-full gap-2 py-2">
                  <FieldLegend
                    variant="label"
                    className="text-muted-foreground"
                  >
                    SEXO
                  </FieldLegend>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    className="flex flex-row gap-6"
                  >
                    {SEX_ITEMS.map((item) => (
                      <label
                        key={item.value}
                        className="flex items-center gap-2 text-sm"
                      >
                        <RadioGroupItem value={item.value} />
                        {item.label}
                      </label>
                    ))}
                  </RadioGroup>
                </FieldSet>
              )}
            />

            <FormField
              name="birthDate"
              label="Data de Nascimento"
              control={control}
              render={({ field, id: fieldId }) => (
                <Input {...field} id={fieldId} type="date" />
              )}
            />
          </FieldRow>

          <FieldRow cols={1}>
            <FormField
              name="breedId"
              label="Raça"
              control={control}
              render={({ id: fieldId, field, fieldState }) => (
                <SearchCombobox
                  placeholder="buscar..."
                  id={fieldId}
                  field={field}
                  fieldState={fieldState}
                  items={breeds.map((r) => ({
                    value: r.id.toString(),
                    label: r.name,
                  }))}
                />
              )}
            />
          </FieldRow>
        </FieldSet>

        <Separator />

        <FieldSet className="border-0">
          <FieldLegend>Manejo</FieldLegend>

          <FieldRow cols={2}>
            <div className="space-y-2">
              <label
                htmlFor="currentBatchDisplay"
                className="text-sm font-medium uppercase text-muted-foreground"
              >
                Lote Atual
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="currentBatchDisplay"
                  readOnly
                  value={displayBatchName ?? "Nenhum lote"}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  title="Trocar lote"
                  onClick={() => setBatchDialogOpen(true)}
                >
                  <ArrowRightLeft className="size-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="currentWeightDisplay"
                className="text-sm font-medium uppercase text-muted-foreground"
              >
                Peso Atual
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="currentWeightDisplay"
                  readOnly
                  value={
                    animal.currentWeightKg != null
                      ? `${animal.currentWeightKg} kg`
                      : "Não registrado"
                  }
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  title="Registrar pesagem e ver histórico"
                  onClick={() => setWeighingHistoryOpen(true)}
                >
                  <Weight className="size-4" />
                </Button>
              </div>
            </div>
          </FieldRow>

          <FieldRow cols={2}>
            <div className="space-y-2">
              <label
                htmlFor="neuteringDisplay"
                className="text-sm font-medium uppercase text-muted-foreground"
              >
                Castração
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="neuteringDisplay"
                  readOnly
                  value={displayNeutering}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  title="Registrar castração e ver histórico"
                  onClick={() => setNeuteringHistoryOpen(true)}
                >
                  <Scissors className="size-4" />
                </Button>
              </div>
            </div>
          </FieldRow>
        </FieldSet>

        <FormActionBar>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Salvar
          </Button>
        </FormActionBar>
      </form>

      <AnimalBatchChangeDialog
        open={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
        currentBatchId={animal.currentBatchId}
        animalId={animal.id}
        propertyId={animal.currentPropertyId}
        onConfirm={(batchId, batchName, notes) => {
          setPendingBatchId(batchId);
          setPendingBatchName(batchName ?? "Lote selecionado");
          setPendingBatchNotes(notes);
        }}
      />

      <AnimalIdentifierHistoryDialog
        animalId={animal.id}
        commitments={commitments}
        kind={identifierHistory ?? "tag"}
        current={
          identifierHistory === "rfid" ? animal.currentRfid : animal.currentTag
        }
        open={identifierHistory !== null}
        onOpenChange={(open) => !open && setIdentifierHistory(null)}
        onChanged={async () => {
          // Só o identificador atual muda; as alterações pendentes do formulário são preservadas.
          try {
            setAnimal(await animalClient.getAnimal(id));
          } catch {
            toast.error("Não foi possível atualizar a identificação atual.");
          }
        }}
      />

      <AnimalWeighingHistoryDialog
        animalId={animal.id}
        commitments={commitments}
        birthDate={animal.birthDate}
        open={weighingHistoryOpen}
        onOpenChange={setWeighingHistoryOpen}
        onChanged={async () => {
          // Só o peso atual muda; as alterações pendentes do formulário são preservadas.
          try {
            setAnimal(await animalClient.getAnimal(id));
          } catch {
            toast.error("Não foi possível atualizar o peso atual.");
          }
        }}
      />

      <AnimalNeuteringHistoryDialog
        animalId={animal.id}
        commitments={commitments}
        birthDate={animal.birthDate}
        neutered={animal.neutered}
        open={neuteringHistoryOpen}
        onOpenChange={setNeuteringHistoryOpen}
        onChanged={async () => {
          // Só a castração exibida muda; as alterações pendentes do formulário são preservadas.
          try {
            setAnimal(await animalClient.getAnimal(id));
          } catch {
            toast.error("Não foi possível atualizar a castração.");
          }
        }}
      />
    </>
  );
}
