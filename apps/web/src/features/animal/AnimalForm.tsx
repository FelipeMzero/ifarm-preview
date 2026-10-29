import { z } from "zod";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { animalClient } from "@/lib/clients";
import { applyServerErrors } from "@/lib/form-errors";
import { breedListQuery } from "@/features/breed/queries";
import { neuteringTechniqueListQuery } from "@/features/neutering-technique/queries";
import { techniqueItems } from "@/features/neutering-technique/items";
import { useBatchOptions } from "@/features/batch/useBatchOptions";
import { BatchForm } from "@/features/batch/BatchForm";
import { StockingNotice } from "@/features/area/StockingNotice";
import { usePersonOptions } from "@/features/person/usePersonOptions";
import { PersonForm } from "@/features/person/PersonForm";
import {
  requirePropertyId,
  useCurrentProperty,
} from "@/features/shell/useCurrentProperty";
import { NoPropertySelected } from "@/features/shell/NoPropertySelected";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/our/FormField";
import { FieldRow } from "@/components/our/FieldRow";
import { SelectField } from "@/components/our/SelectField";

import { SearchCombobox } from "@/components/our/SearchCombobox";
import { ArrowLeft, Loader2 } from "lucide-react";
import { animalCreateFieldsSchema, requirePurchaseData } from "@ifarm/shared";
import { AnimalOrigin, Sex } from "@ifarm/shared";
import { Separator } from "@/components/ui/separator";
import { FormActionBar } from "@/components/our/FormActionBar";
import { ANIMAL_ORIGIN_ITEMS, SEX_ITEMS } from "@ifarm/shared";
import { animalKeys } from "./queries";

// Os campos e as regras da API, sem a propriedade (vai no envio: a atual).
const animalFormSchema =
  animalCreateFieldsSchema.superRefine(requirePurchaseData);
type AnimalFormData = z.input<typeof animalFormSchema>;

type AnimalFormProps = {
  title?: string;
  onCancel?: () => void;
  onSuccess?: (newId?: string) => void;
};

export function AnimalForm({ title, onCancel, onSuccess }: AnimalFormProps) {
  const queryClient = useQueryClient();
  const { property: currentProperty, isLoading: isPropertyLoading } =
    useCurrentProperty();
  const propertyId = currentProperty?.id;

  // Opções dos campos: raças e técnicas ativas, lotes vigentes da propriedade e vendedores.
  const { data: breedList } = useQuery(breedListQuery());
  const breeds = breedList?.filter((b) => !b.deactivatedAt) ?? [];
  const { data: techniqueList } = useQuery(neuteringTechniqueListQuery());
  const techniques = techniqueList?.filter((t) => !t.deactivatedAt) ?? [];
  const batches = useBatchOptions();
  const sellers = usePersonOptions();
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const {
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { isSubmitting },
  } = useForm<AnimalFormData>({
    // raw: valida com o schema da API e envia os valores do formulário (a API converte).
    resolver: zodResolver(animalFormSchema, undefined, { raw: true }),
    defaultValues: {
      currentTag: "",
      currentRfid: "",
      name: "",
      sex: Sex.MALE,
      birthDate: "",
      propertyEntryDate: "",
      origin: AnimalOrigin.UNDEFINED,
      neutered: false,
      neuteringDate: "",
      neuteringTechniqueId: "",
      breedId: "",
      batchId: "",
      currentWeightKg: "",
      sellerId: "",
      purchasePrice: "",
      purchaseNotes: "",
      acquisitionDate: "",
    },
  });

  const origin = useWatch({ control, name: "origin" });
  const neutered = useWatch({ control, name: "neutered" });
  const [batchId, currentWeightKg, birthDate, sex] = useWatch({
    control,
    name: ["batchId", "currentWeightKg", "birthDate", "sex"],
  });

  const create = useMutation({
    mutationFn: (data: AnimalFormData) =>
      animalClient.createAnimal({
        ...data,
        propertyId: requirePropertyId(propertyId),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: animalKeys.all });
    },
  });

  async function onSubmit(data: AnimalFormData) {
    try {
      const response = await create.mutateAsync(data);
      toast.success("Registro salvo com sucesso!");
      onSuccess?.(response.data.id);
    } catch (error) {
      applyServerErrors(setError, error);
    }
  }

  // Sem propriedade selecionada: a API pede sempre a propriedade.
  if (!isPropertyLoading && !currentProperty) return <NoPropertySelected />;

  return (
    <>
      <form
        className="mx-auto flex w-full max-w-300 flex-col gap-8"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit"
          onClick={() => onCancel?.()}
        >
          <ArrowLeft className="size-4" /> Voltar
        </Button>

        {title && <h1 className="text-2xl font-semibold">{title}</h1>}
        <Separator />

        <FieldSet className="border-0">
          <FieldLegend> Identificação </FieldLegend>

          <FieldRow cols={3}>
            <FormField
              name="currentTag"
              label="Brinco"
              control={control}
              render={({ field, id }) => (
                <Input {...field} id={id} placeholder="Ex: MS-001234" />
              )}
            />

            <FormField
              name="currentRfid"
              label="RFID / Chip"
              control={control}
              render={({ field, id }) => (
                <Input {...field} id={id} placeholder="Ex: 900082000169813" />
              )}
            />

            <FormField
              name="name"
              label="Apelido"
              control={control}
              render={({ field, id }) => (
                <Input {...field} id={id} placeholder="Ex: Mimosa" />
              )}
            />
          </FieldRow>

          <FieldRow cols={3}>
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
              render={({ field, id }) => (
                <Input {...field} id={id} type="date" />
              )}
            />

            <FormField
              name="propertyEntryDate"
              label="Data de Entrada"
              control={control}
              render={({ field, id }) => (
                <Input {...field} id={id} type="datetime-local" />
              )}
            />
          </FieldRow>

          <FieldRow cols={3}>
            <FormField
              name="breedId"
              label="Raça"
              control={control}
              render={({ id, field, fieldState }) => (
                <SearchCombobox
                  placeholder="buscar..."
                  id={id}
                  field={field}
                  fieldState={fieldState}
                  items={breeds.map((r) => ({
                    value: r.id.toString(),
                    label: r.name,
                  }))}
                />
              )}
            />
            <FormField
              name="currentWeightKg"
              label="Peso (kg)"
              control={control}
              render={({ field, id }) => (
                <Input
                  {...field}
                  id={id}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 32.5"
                />
              )}
            />
            <FormField
              name="batchId"
              label="Lote"
              required
              control={control}
              render={({ id, field, fieldState }) => (
                <SearchCombobox
                  placeholder="buscar..."
                  id={id}
                  field={field}
                  fieldState={fieldState}
                  items={batches.items}
                  onInputValueChange={batches.search}
                  onCreateClick={() => setIsBatchModalOpen(true)}
                />
              )}
            />
          </FieldRow>

          <StockingNotice
            request={
              batchId
                ? {
                    batchId,
                    newAnimals: [
                      {
                        weightKg: currentWeightKg
                          ? parseFloat(currentWeightKg)
                          : null,
                        birthDate: birthDate || undefined,
                        sex,
                        neutered,
                      },
                    ],
                  }
                : null
            }
          />

          <FieldRow cols={1}>
            <Controller
              name="neutered"
              control={control}
              render={({ field }) => (
                <label className="flex w-fit items-center gap-2 text-sm font-medium">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  Castrado?
                </label>
              )}
            />
          </FieldRow>

          {neutered && (
            <FieldRow cols={2}>
              <FormField
                name="neuteringDate"
                label="Data da Castração"
                control={control}
                render={({ field, id }) => (
                  <Input {...field} id={id} type="datetime-local" />
                )}
              />
              <FormField
                name="neuteringTechniqueId"
                label="Técnica"
                control={control}
                render={({ field, id }) => (
                  <SelectField
                    id={id}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    items={techniqueItems(techniques, { optional: true })}
                    placeholder="Selecione..."
                    className="w-full"
                  />
                )}
              />
            </FieldRow>
          )}
        </FieldSet>

        <Separator />

        <FieldSet className="border-0">
          <FieldLegend>Origem</FieldLegend>
          <FieldRow cols={2}>
            <FormField
              name="origin"
              label="Origem"
              control={control}
              render={({ id, field, fieldState }) => (
                <SearchCombobox
                  id={id}
                  field={field}
                  fieldState={fieldState}
                  items={ANIMAL_ORIGIN_ITEMS}
                  keepSelection
                />
              )}
            />
          </FieldRow>

          {origin === AnimalOrigin.PURCHASE && (
            <>
              <FieldRow cols={3}>
                <FormField
                  name="sellerId"
                  label="Vendedor"
                  required
                  control={control}
                  render={({ id, field, fieldState }) => (
                    <SearchCombobox
                      placeholder="buscar..."
                      id={id}
                      field={field}
                      fieldState={fieldState}
                      items={sellers.items}
                      onInputValueChange={sellers.search}
                      onCreateClick={() => setIsSellerModalOpen(true)}
                    />
                  )}
                />
                <FormField
                  name="acquisitionDate"
                  label="Data de Aquisição"
                  control={control}
                  render={({ field, id }) => (
                    <Input {...field} id={id} type="date" />
                  )}
                />
                <FormField
                  name="purchasePrice"
                  label="Valor da Compra (R$)"
                  required
                  control={control}
                  render={({ field, id }) => (
                    <Input
                      {...field}
                      id={id}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ex: 3500.00"
                    />
                  )}
                />
              </FieldRow>
              <FieldRow cols={1}>
                <FormField
                  name="purchaseNotes"
                  label="Observação"
                  control={control}
                  render={({ field, id }) => (
                    <Textarea
                      {...field}
                      id={id}
                      placeholder="Observação sobre a compra..."
                      className="resize-none"
                      rows={3}
                    />
                  )}
                />
              </FieldRow>
            </>
          )}
        </FieldSet>

        <FormActionBar>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Salvar
          </Button>
        </FormActionBar>
      </form>

      <Dialog open={isSellerModalOpen} onOpenChange={setIsSellerModalOpen}>
        <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Novo Vendedor</DialogTitle>
            <DialogDescription className="sr-only">
              Cadastre um novo vendedor diretamente por esta tela.
            </DialogDescription>
          </DialogHeader>

          <PersonForm
            onCancel={() => setIsSellerModalOpen(false)}
            onSuccess={async (newId) => {
              setIsSellerModalOpen(false);
              if (newId) {
                // O vendedor cadastrado entra nas opções e já fica selecionado.
                await sellers.addCreated(newId);
                setValue("sellerId", newId, { shouldValidate: true });
                toast.success("Vendedor vinculado ao animal com sucesso.");
              }
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isBatchModalOpen} onOpenChange={setIsBatchModalOpen}>
        <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Novo Lote</DialogTitle>
            <DialogDescription className="sr-only">
              Cadastre um novo lote diretamente por esta tela.
            </DialogDescription>
          </DialogHeader>

          <BatchForm
            onCancel={() => setIsBatchModalOpen(false)}
            onSuccess={async (newId) => {
              setIsBatchModalOpen(false);
              if (newId) {
                // O lote cadastrado entra nas opções e já fica selecionado.
                await batches.addCreated(newId);
                setValue("batchId", newId, { shouldValidate: true });
                toast.success("Lote vinculado ao animal com sucesso.");
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
