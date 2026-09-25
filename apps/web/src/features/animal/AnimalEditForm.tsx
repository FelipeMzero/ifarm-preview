"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRightLeft,
  History,
  Loader2,
  Scissors,
  Weight,
} from "lucide-react";
import { toast } from "sonner";

import { ApiError, AnimalDetail, getAnimal, updateAnimal } from "./services";
import { Breed, getBreeds } from "@/features/breed/services";
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
} from "@/lib/enum-labels";
import {
  AnimalEditFormData,
  animalEditFormSchema,
  AnimalNeuteringData,
} from "./schema";
import { Separator } from "@/components/ui/separator";
import { AnimalIdentifierChangeDialog } from "./AnimalIdentifierChangeDialog";
import { AnimalWeightChangeDialog } from "./AnimalWeightChangeDialog";
import { AnimalBatchChangeDialog } from "./AnimalBatchChangeDialog";
import { AnimalNeuteringDialog } from "./AnimalNeuteringDialog";
import { AnimalWeighingHistoryDialog } from "./AnimalWeighingHistoryDialog";

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
  const [breeds, setBreeds] = useState<Breed[]>([]);

  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [pendingTag, setPendingTag] = useState<string | null>(null);
  const [pendingTagNotes, setPendingTagNotes] = useState<string | undefined>();

  const [rfidDialogOpen, setRfidDialogOpen] = useState(false);
  const [pendingRfid, setPendingRfid] = useState<string | null>(null);
  const [pendingRfidNotes, setPendingRfidNotes] = useState<
    string | undefined
  >();

  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [pendingBatchId, setPendingBatchId] = useState<string | null>(null);
  const [pendingBatchName, setPendingBatchName] = useState<string | null>(null);
  const [pendingBatchNotes, setPendingBatchNotes] = useState<
    string | undefined
  >();

  const [weightDialogOpen, setWeightDialogOpen] = useState(false);
  const [pendingWeight, setPendingWeight] = useState<string | null>(null);
  const [pendingWeightNotes, setPendingWeightNotes] = useState<
    string | undefined
  >();

  const [weighingHistoryOpen, setWeighingHistoryOpen] = useState(false);

  const [neuteringDialogOpen, setNeuteringDialogOpen] = useState(false);
  const [pendingNeutering, setPendingNeutering] =
    useState<AnimalNeuteringData | null>(null);

  const {
    handleSubmit,
    control,
    reset,
    setError,
    formState: { isSubmitting },
  } = useForm<AnimalEditFormData>({
    resolver: zodResolver(animalEditFormSchema),
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
        const detail = await getAnimal(id);
        setAnimal(detail);
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
        const breedList = await getBreeds();
        setBreeds(breedList.filter((b) => !b.deactivatedAt));
      } catch {
        setBreeds([]);
      }
    }
    loadBreeds();
  }, []);

  async function onSubmit(data: AnimalEditFormData) {
    try {
      await updateAnimal(id, {
        ...data,
        newTag: pendingTag ?? undefined,
        tagChangeNotes: pendingTagNotes,
        newRfid: pendingRfid ?? undefined,
        rfidChangeNotes: pendingRfidNotes,
        newBatchId: pendingBatchId ?? undefined,
        batchChangeNotes: pendingBatchNotes,
        newWeightKg: pendingWeight ?? undefined,
        weightChangeNotes: pendingWeightNotes,
        neuteredAt: pendingNeutering?.date,
        neuteringMethod: pendingNeutering?.method,
        neuteringNotes: pendingNeutering?.notes,
      });

      const fresh = await getAnimal(id);
      setAnimal(fresh);
      reset({
        name: fresh.name ?? "",
        sex: fresh.sex as AnimalEditFormData["sex"],
        birthDate: fresh.birthDate ?? "",
        breedId: fresh.breedId ?? "",
      });
      setPendingTag(null);
      setPendingTagNotes(undefined);
      setPendingRfid(null);
      setPendingRfidNotes(undefined);
      setPendingBatchId(null);
      setPendingBatchName(null);
      setPendingBatchNotes(undefined);
      setPendingWeight(null);
      setPendingWeightNotes(undefined);
      setPendingNeutering(null);

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

  // pendente "" = identificador removido; null = sem alteração
  const displayTag = pendingTag !== null ? pendingTag : animal.currentTag;
  const displayRfid = pendingRfid !== null ? pendingRfid : animal.currentRfid;
  const displayBatchName = pendingBatchName ?? animal.currentBatchName;
  const displayNeutering = pendingNeutering
    ? `Castrado em ${new Date(`${pendingNeutering.date}T00:00:00`).toLocaleDateString("pt-BR")}`
    : animal.neutered
      ? animal.neuteredAt
        ? `Castrado em ${new Date(animal.neuteredAt).toLocaleDateString("pt-BR")}`
        : "Castrado"
      : "Não castrado";
  const canRegisterNeutering = !pendingNeutering;

  const displayWeight =
    pendingWeight ??
    (animal.currentWeightKg != null ? String(animal.currentWeightKg) : null);

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
                  value={displayTag || "Nenhum"}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  title="Trocar brinco"
                  onClick={() => setTagDialogOpen(true)}
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
                  value={displayRfid || "Nenhum"}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  title="Trocar RFID"
                  onClick={() => setRfidDialogOpen(true)}
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
                    displayWeight ? `${displayWeight} kg` : "Não registrado"
                  }
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  title="Registrar pesagem"
                  onClick={() => setWeightDialogOpen(true)}
                >
                  <Weight className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  title="Histórico de pesagens"
                  onClick={() => setWeighingHistoryOpen(true)}
                >
                  <History className="size-4" />
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
                {canRegisterNeutering && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    title={
                      animal.neutered
                        ? "Registrar recastração"
                        : "Registrar castração"
                    }
                    onClick={() => setNeuteringDialogOpen(true)}
                  >
                    <Scissors className="size-4" />
                  </Button>
                )}
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

      <AnimalIdentifierChangeDialog
        kind="tag"
        open={tagDialogOpen}
        onOpenChange={setTagDialogOpen}
        onConfirm={(value, notes) => {
          // Remover um identificador que o animal não tem não gera histórico.
          const unchanged = !value && !animal.currentTag;
          setPendingTag(unchanged ? null : value);
          setPendingTagNotes(unchanged ? undefined : notes);
        }}
      />

      <AnimalIdentifierChangeDialog
        kind="rfid"
        open={rfidDialogOpen}
        onOpenChange={setRfidDialogOpen}
        onConfirm={(value, notes) => {
          // Remover um identificador que o animal não tem não gera histórico.
          const unchanged = !value && !animal.currentRfid;
          setPendingRfid(unchanged ? null : value);
          setPendingRfidNotes(unchanged ? undefined : notes);
        }}
      />

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

      <AnimalWeighingHistoryDialog
        animalId={animal.id}
        birthDate={animal.birthDate}
        open={weighingHistoryOpen}
        onOpenChange={setWeighingHistoryOpen}
        onChanged={async () => {
          // Só o peso atual muda; as alterações pendentes do formulário são preservadas.
          try {
            setAnimal(await getAnimal(id));
          } catch {
            toast.error("Não foi possível atualizar o peso atual.");
          }
        }}
      />

      <AnimalNeuteringDialog
        open={neuteringDialogOpen}
        isRecastration={animal.neutered}
        lastNeuteredAt={animal.neuteredAt}
        onOpenChange={setNeuteringDialogOpen}
        onConfirm={setPendingNeutering}
      />

      <AnimalWeightChangeDialog
        open={weightDialogOpen}
        onOpenChange={setWeightDialogOpen}
        onConfirm={(value, notes) => {
          setPendingWeight(value);
          setPendingWeightNotes(notes);
        }}
      />
    </>
  );
}
