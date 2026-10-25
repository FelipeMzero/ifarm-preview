import { useCallback, useRef, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MaskedInput } from "@/components/our/MaskedInput";
import { lazyComponent } from "@/lib/lazy";

import {
  BR_STATE_ITEMS,
  FIELD_LIMITS,
  propertySchema,
  type PropertyInput,
} from "@ifarm/shared";
import { personClient, propertyClient } from "@/lib/clients";
import { ErrorPage } from "@/components/our/ErrorPage";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/our/FormField";
import { FormActionBar } from "@/components/our/FormActionBar";
import FieldRow from "@/components/our/FieldRow";

import {
  SearchCombobox,
  SearchComboboxItem,
} from "@/components/our/SearchCombobox";
import { ArrowLeft, Loader2, MapPin, MapPinOff } from "lucide-react";
import FormSkeleton from "@/components/our/FormSkeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { applyServerErrors } from "@/lib/form-errors";
import { LocationPickerDialog } from "./LocationPickerDialog";
import { useCurrentProperty } from "@/features/shell/CurrentPropertyProvider";
import { personKeys } from "../person/queries";
import { propertyDetailQuery, propertyKeys } from "./queries";
import { geocodeQuery, zipCodeQuery } from "../address/queries";

// Importações do Modal e do Componente de Pessoa
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import PersonForm from "../person/PersonForm";

const LocationPickerMap = lazyComponent(() => import("./LocationPickerMap"), {
  loading: () => (
    <div className="flex size-full items-center justify-center text-muted-foreground">
      Carregando mapa...
    </div>
  ),
});

function isValidCoordinate(latitude: string, longitude: string) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

function MapPreview({
  latitude,
  longitude,
  className,
  onDoubleClick,
}: {
  latitude: string;
  longitude: string;
  className?: string;
  onDoubleClick?: () => void;
}) {
  const hasInput = !!latitude || !!longitude;
  const isValid =
    !!latitude && !!longitude && isValidCoordinate(latitude, longitude);

  return (
    <div className={cn("flex min-h-0 min-w-0 flex-col gap-2", className)}>
      <div
        className="relative min-h-0 w-full flex-1 cursor-pointer overflow-hidden rounded-lg border border-input bg-input/40"
        onDoubleClick={onDoubleClick}
        title="Clique duas vezes para escolher no mapa"
      >
        {isValid ? (
          <LocationPickerMap
            latitude={Number(latitude)}
            longitude={Number(longitude)}
            onPick={() => {}}
            readOnly
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-muted-foreground">
            {hasInput ? (
              <>
                <MapPinOff className="size-5" />
                <span className="text-xs">Sem localização</span>
              </>
            ) : (
              <>
                <MapPin className="size-5 opacity-50" />
                <span className="text-xs">Informe a latitude e longitude</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type PropertyFormProps = {
  id?: string;
  title?: string;
  onCancel?: () => void;
  onSuccess?: (newId?: string) => void;
};

export default function PropertyForm({
  id,
  title,
  onCancel,
  onSuccess,
}: PropertyFormProps) {
  const queryClient = useQueryClient();
  const { refresh: refreshCurrentProperty } = useCurrentProperty();
  const [isZipLoading, setIsZipLoading] = useState(false);

  // Estado para controle do modal de Nova Pessoa
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);

  // Propriedade em edição (só com id).
  const {
    data: property,
    isPending,
    isError,
    refetch,
  } = useQuery({
    ...propertyDetailQuery(id ?? ""),
    enabled: !!id,
  });

  // Opções de titular: as 5 primeiras pessoas ativas, ou a busca digitada (com espera).
  const [ownerSearch, setOwnerSearch] = useState("");
  const ownerDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchOwners = useCallback((query: string) => {
    if (ownerDebounce.current) clearTimeout(ownerDebounce.current);
    ownerDebounce.current = setTimeout(() => setOwnerSearch(query), 300);
  }, []);
  const ownerParams = {
    search: ownerSearch,
    pageSize: ownerSearch ? 20 : 5,
    status: "active" as const,
  };
  const { data: owners } = useQuery({
    queryKey: personKeys.list(ownerParams),
    queryFn: () => personClient.getPeople(ownerParams),
    placeholderData: keepPreviousData,
  });
  // Titular cadastrado agora pelo modal, que pode não estar entre as opções da lista.
  const [createdOwner, setCreatedOwner] = useState<SearchComboboxItem | null>(
    null,
  );
  const listedOwners: SearchComboboxItem[] =
    owners?.data.map((p) => ({ value: p.id, label: p.name })) ?? [];
  // Sem busca, o titular atual (e o recém-criado) entram no topo, se não vierem na lista.
  const pinnedOwners: SearchComboboxItem[] = ownerSearch
    ? []
    : [
        createdOwner,
        property?.ownerId && property.ownerName
          ? { value: property.ownerId, label: property.ownerName }
          : null,
      ].filter(
        (o): o is SearchComboboxItem =>
          !!o && !listedOwners.some((l) => l.value === o.value),
      );
  const ownerItems = [...pinnedOwners, ...listedOwners];

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

  async function handleZipBlur(zipCode: string) {
    const digits = zipCode.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setIsZipLoading(true);
    try {
      const address = await queryClient.fetchQuery(zipCodeQuery(digits));
      if (!address) {
        toast.error("CEP não encontrado.");
        return;
      }

      setValue("street", address.street, { shouldValidate: true });
      setValue("neighborhood", address.neighborhood, { shouldValidate: true });
      setValue("city", address.city, { shouldValidate: true });
      setValue("state", address.state, { shouldValidate: true });

      // Sem coordenadas não é erro: o usuário pode marcá-las no mapa.
      const coordinates = await queryClient
        .fetchQuery(
          geocodeQuery({
            street: address.street,
            city: address.city,
            state: address.state,
            zipCode: digits,
          }),
        )
        .catch(() => null);
      if (coordinates) {
        setValue("latitude", String(coordinates.latitude), {
          shouldValidate: true,
        });
        setValue("longitude", String(coordinates.longitude), {
          shouldValidate: true,
        });
      }
    } catch {
      toast.error("Não foi possível buscar o endereço pelo CEP.");
    } finally {
      setIsZipLoading(false);
    }
  }

  async function onSubmit(data: PropertyInput) {
    try {
      if (id) {
        await save.mutateAsync(data);
        // Volta o formulário ao estado "sem alterações", com os dados salvos (e o cache junto).
        const fresh = await queryClient.fetchQuery(propertyDetailQuery(id));
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

  if (id && isError) {
    return (
      <ErrorPage
        message={"Não foi possível obter os dados do servidor."}
        onRetry={() => refetch()}
      />
    );
  }

  if (id && isPending) {
    return <FormSkeleton />;
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
                  items={ownerItems}
                  onInputValueChange={(val) => searchOwners(val)}
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
                      disabled={isZipLoading}
                      placeholder="Ex: 78000-000"
                      onBlur={(e) => handleZipBlur(e.target.value)}
                      className={cn(isZipLoading && "pr-8")}
                    />
                    {isZipLoading && (
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

            <MapPreview
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
                // Recarrega as opções de titular e já seleciona a pessoa cadastrada.
                queryClient.invalidateQueries({ queryKey: personKeys.all });
                const person = await queryClient.fetchQuery({
                  queryKey: personKeys.detail(newId),
                  queryFn: () => personClient.getPerson(newId),
                });
                setCreatedOwner({ value: newId, label: person.name });
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
