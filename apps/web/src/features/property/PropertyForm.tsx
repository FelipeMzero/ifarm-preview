import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { MaskedInput } from "@/components/our/MaskedInput";

import {
  BR_STATE_ITEMS,
  FIELD_LIMITS,
  isNotFoundError,
  propertySchema,
  type PropertyInput,
} from "@ifarm/shared";
import { propertyClient } from "@/lib/clients";
import { ErrorPage } from "@/components/our/ErrorPage";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/our/FormField";
import { FormActionBar } from "@/components/our/FormActionBar";
import { FieldRow } from "@/components/our/FieldRow";

import { SearchCombobox } from "@/components/our/SearchCombobox";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { applyServerErrors } from "@/lib/form-errors";
import { LocationPickerDialog } from "@/components/our/location/LocationPickerDialog";
import { LocationPreview } from "@/components/our/location/LocationPreview";
import { useCurrentProperty } from "@/features/shell/CurrentPropertyProvider";
import { usePersonOptions } from "../person/usePersonOptions";
import { propertyDetailQuery, propertyKeys } from "./queries";
import { useZipCodeLookup } from "../address/useZipCodeLookup";

// Importações do Modal e do Componente de Pessoa
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PersonForm } from "../person/PersonForm";
import { FormSkeleton } from "@/components/our/PageSkeletons";

type PropertyFormProps = {
  id?: string;
  title?: string;
  onCancel?: () => void;
  onSuccess?: (newId?: string) => void;
};

export function PropertyForm({
  id,
  title,
  onCancel,
  onSuccess,
}: PropertyFormProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { refresh: refreshCurrentProperty } = useCurrentProperty();

  // Estado para controle do modal de Nova Pessoa
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);

  // Propriedade em edição (só com id).
  const {
    data: property,
    error,
    isPending,
    refetch,
  } = useQuery({
    ...propertyDetailQuery(id ?? ""),
    enabled: !!id,
  });

  // Opções do campo de titular (uma pessoa).
  const owners = usePersonOptions({
    selected: property && { id: property.ownerId, name: property.ownerName },
  });

  const save = useMutation({
    mutationFn: (data: PropertyInput) =>
      id
        ? propertyClient.updateProperty(id, data)
        : propertyClient.createProperty(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.all });
      refreshCurrentProperty();
    },
  });

  const {
    handleSubmit,
    control,
    reset,
    setValue,
    setError,
    formState: { isSubmitting },
  } = useForm<PropertyInput>({
    resolver: zodResolver(propertySchema),
    // Dados da propriedade em edição. Se forem buscados de novo em segundo plano, só os campos
    // que o usuário não alterou são atualizados (keepDirtyValues).
    values: property,
    resetOptions: { keepDirtyValues: true },
    defaultValues: {
      name: "",
      ownerId: "",
      totalArea: "",
      productiveArea: "",
      cib: "",
      ccir: "",
      car: "",
      latitude: "",
      longitude: "",
      zipCode: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
    },
  });

  const latitude = useWatch({ control, name: "latitude" });
  const longitude = useWatch({ control, name: "longitude" });
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Ao sair do campo de CEP: preenche o endereço e as coordenadas.
  const zipLookup = useZipCodeLookup({
    setAddressField: (field, value) =>
      setValue(field, value, { shouldValidate: true }),
    setCoordinates: (lat, lon) => {
      setValue("latitude", lat, { shouldValidate: true });
      setValue("longitude", lon, { shouldValidate: true });
    },
  });

  async function onSubmit(data: PropertyInput) {
    try {
      if (id) {
        await save.mutateAsync(data);
        // Volta o formulário ao estado "sem alterações", com os dados salvos (e o cache junto).
        const fresh = await queryClient.query(propertyDetailQuery(id));
        reset(fresh);
        toast.success("Registro atualizado com sucesso!");
        onSuccess?.();
      } else {
        const response = await save.mutateAsync(data);
        toast.success("Registro salvo com sucesso!");
        onSuccess?.(response.data.id);
      }
    } catch (error) {
      applyServerErrors(setError, error);
    }
  }

  if (id && isPending) {
    return <FormSkeleton />;
  }

  if (id && !property) {
    // Não existe mais (ex.: excluída por outra pessoa): tentar de novo não adianta.
    if (isNotFoundError(error)) {
      return (
        <ErrorPage
          title="Propriedade não encontrada"
          message="Ela pode ter sido excluída."
          onBack={() => navigate("/propriedades")}
          backLabel="Voltar"
        />
      );
    }
    return (
      <ErrorPage
        message={"Não foi possível obter os dados do servidor."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <>
      <form
        className="mx-auto flex w-full max-w-300 flex-col gap-4"
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

          <FieldRow cols={2}>
            <FormField
              name="name"
              label="Nome"
              required
              control={control}
              render={({ field, id: fieldId }) => (
                <Input
                  {...field}
                  id={fieldId}
                  maxLength={FIELD_LIMITS.property.name}
                  placeholder="Ex: Fazendão São João"
                />
              )}
            />

            <FormField
              name="ownerId"
              label="Titular"
              required
              control={control}
              render={({ id: fieldId, field, fieldState }) => (
                <SearchCombobox
                  placeholder="Selecionar..."
                  id={fieldId}
                  field={field}
                  fieldState={fieldState}
                  items={owners.items}
                  onInputValueChange={owners.search}
                  onCreateClick={() => setIsPersonModalOpen(true)}
                />
              )}
            />
          </FieldRow>

          <FieldRow cols={2}>
            <FormField
              name="totalArea"
              label="Área Total (ha)"
              control={control}
              render={({ field, id: fieldId }) => (
                <Input
                  {...field}
                  id={fieldId}
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="Ex: 120"
                />
              )}
            />
            <FormField
              name="productiveArea"
              label="Área Produtiva (ha)"
              control={control}
              render={({ field, id: fieldId }) => (
                <Input
                  {...field}
                  id={fieldId}
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="Ex: 100"
                />
              )}
            />
          </FieldRow>

          <FieldRow cols={3}>
            <FormField
              name="car"
              label="CAR"
              control={control}
              render={({ field, id: fieldId }) => (
                <MaskedInput
                  field={field}
                  mask="aa-0000000-HHHH.HHHH.HHHH.HHHH.HHHH.HHHH.HHHH.HHHH"
                  definitions={{ H: /[0-9A-Fa-f]/ }}
                  prepareChar={(char: string) => char.toUpperCase()}
                  id={fieldId}
                  placeholder="Ex: MT-5107909-E8C2.A75A.C69A.4A7C.8C26.99F5.CC59.9B9A"
                />
              )}
            />
            <FormField
              name="cib"
              label="CIB"
              control={control}
              render={({ field, id: fieldId }) => (
                <Input
                  {...field}
                  id={fieldId}
                  maxLength={FIELD_LIMITS.property.cib}
                  placeholder="Ex: ABC1234-5"
                />
              )}
            />
            <FormField
              name="ccir"
              label="CCIR"
              control={control}
              render={({ field, id: fieldId }) => (
                <MaskedInput
                  field={field}
                  mask="000.000.000.000-0"
                  unmask
                  id={fieldId}
                  placeholder="Ex: 999.999.999.999-9"
                />
              )}
            />
          </FieldRow>
        </FieldSet>
        <Separator />

        <div className="grid gap-4 md:grid-cols-[2fr_auto_1fr] items-stretch">
          <FieldSet className="border-0">
            <FieldLegend>Endereço</FieldLegend>
            <FieldRow cols={1}>
              <FormField
                name="zipCode"
                label="CEP"
                control={control}
                render={({ field, id: fieldId }) => (
                  <div className="relative">
                    <MaskedInput
                      field={field}
                      mask="00000-000"
                      unmask
                      id={fieldId}
                      disabled={zipLookup.isLoading}
                      placeholder="Ex: 78000-000"
                      onBlur={(e) => zipLookup.lookup(e.target.value)}
                      className={cn(zipLookup.isLoading && "pr-8")}
                    />
                    {zipLookup.isLoading && (
                      <Loader2 className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                  </div>
                )}
              />
            </FieldRow>

            <FieldRow cols={2}>
              <FormField
                name="street"
                label="Logradouro"
                control={control}
                render={({ field, id: fieldId }) => (
                  <Input
                    {...field}
                    id={fieldId}
                    maxLength={FIELD_LIMITS.address.street}
                    placeholder="Ex: Av. Brasil"
                  />
                )}
              />

              <FormField
                name="number"
                label="Número"
                control={control}
                render={({ field, id: fieldId }) => (
                  <Input
                    {...field}
                    id={fieldId}
                    maxLength={FIELD_LIMITS.address.number}
                    placeholder="Ex: 1200"
                  />
                )}
              />
            </FieldRow>

            <FieldRow cols={2}>
              <FormField
                name="complement"
                label="Complemento"
                control={control}
                render={({ field, id: fieldId }) => (
                  <Input
                    {...field}
                    id={fieldId}
                    maxLength={FIELD_LIMITS.address.complement}
                    placeholder="Ex: Galpão 2"
                  />
                )}
              />
              <FormField
                name="neighborhood"
                label="Bairro"
                control={control}
                render={({ field, id: fieldId }) => (
                  <Input
                    {...field}
                    id={fieldId}
                    maxLength={FIELD_LIMITS.address.neighborhood}
                    placeholder="Ex: Centro"
                  />
                )}
              />
            </FieldRow>

            <FieldRow cols={2}>
              <FormField
                name="city"
                label="Município"
                control={control}
                render={({ field, id: fieldId }) => (
                  <Input
                    {...field}
                    id={fieldId}
                    maxLength={FIELD_LIMITS.address.city}
                    placeholder="Ex: Cuiabá"
                  />
                )}
              />
              <FormField
                name="state"
                label="UF"
                control={control}
                render={({ id: fieldId, field, fieldState }) => (
                  <SearchCombobox
                    placeholder="Selecionar..."
                    id={fieldId}
                    field={field}
                    fieldState={fieldState}
                    items={BR_STATE_ITEMS}
                  />
                )}
              />
            </FieldRow>
          </FieldSet>

          <Separator orientation="vertical" className="hidden md:block" />

          <div className="flex min-h-0 flex-col gap-4">
            <FieldLegend> Localização </FieldLegend>

            <FieldRow cols={2}>
              <FormField
                name="latitude"
                label="Latitude"
                control={control}
                render={({ field, id: fieldId }) => (
                  <Input
                    {...field}
                    id={fieldId}
                    type="number"
                    step="any"
                    placeholder="Ex: -15.6014"
                  />
                )}
              />
              <FormField
                name="longitude"
                label="Longitude"
                control={control}
                render={({ field, id: fieldId }) => (
                  <Input
                    {...field}
                    id={fieldId}
                    type="number"
                    step="any"
                    placeholder="Ex: -56.0979"
                  />
                )}
              />
            </FieldRow>

            <LocationPreview
              latitude={latitude ?? ""}
              longitude={longitude ?? ""}
              onDoubleClick={() => setIsPickerOpen(true)}
              className="min-h-0 flex-1"
            />
          </div>
        </div>

        <FormActionBar>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Salvar
          </Button>
        </FormActionBar>

        <LocationPickerDialog
          open={isPickerOpen}
          onOpenChange={setIsPickerOpen}
          latitude={latitude ? Number(latitude) : null}
          longitude={longitude ? Number(longitude) : null}
          onConfirm={(lat, lon) => {
            setValue("latitude", lat.toFixed(6), { shouldValidate: true });
            setValue("longitude", lon.toFixed(6), { shouldValidate: true });
          }}
        />
      </form>

      {/* Modal Independente para Cadastro de Nova Pessoa */}
      <Dialog open={isPersonModalOpen} onOpenChange={setIsPersonModalOpen}>
        <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Novo Titular</DialogTitle>
            <DialogDescription className="sr-only">
              Cadastre um novo titular diretamente por esta tela.
            </DialogDescription>
          </DialogHeader>

          <PersonForm
            onCancel={() => setIsPersonModalOpen(false)}
            onSuccess={async (newId) => {
              setIsPersonModalOpen(false);
              if (newId) {
                // A pessoa cadastrada entra nas opções e já fica selecionada.
                await owners.addCreated(newId);
                setValue("ownerId", newId, { shouldValidate: true });
                toast.success("Titular vinculado à propriedade com sucesso.");
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
