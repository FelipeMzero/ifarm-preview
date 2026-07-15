"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IMaskInput } from "react-imask";

import { getProperty, updateProperty, createProperty, ApiError } from "./services";
import { getPeople } from "@/features/person/services";
import { ErrorPage } from "@/components/our/ErrorPage";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/our/FormField";
import { FormActionBar } from "@/components/our/FormActionBar";
import FieldRow from "@/components/our/FieldRow";

import { SearchCombobox, SearchComboboxItem } from "@/components/our/SearchCombobox";
import { ArrowLeft, Loader2, MapPin, MapPinOff } from "lucide-react";
import FormSkeleton from "@/components/our/FormSkeleton";
import { PropertyFormData, propertyFormSchema } from "./schema";
import { Separator } from "@/components/ui/separator";
import { BR_STATE_ITEMS } from "@/lib/br-states";
import { cn } from "@/lib/utils";
import { LocationPickerDialog } from "./LocationPickerDialog";
import { useCurrentProperty } from "@/features/shell/CurrentPropertyProvider";




const MASKED_INPUT_CLASSNAME = "h-10 w-full min-w-0 rounded-lg border border-input bg-input/40 px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

const MAP_TILE_ZOOM = 14;
const MAP_TILE_SIZE = 128;

function isValidCoordinate(latitude: string, longitude: string) {
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);
  return !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

// Conversão lat/long -> tile do OSM contendo o ponto + posição percentual dentro dele
// (a % é o que permite posicionar o marcador certo mesmo com a imagem esticada para
// preencher um contêiner de qualquer tamanho/proporção).
function getTilePosition(lat: number, lon: number, zoom: number) {
  const pixelX = ((lon + 180) / 360) * 2 ** zoom * MAP_TILE_SIZE;
  const latRad = (lat * Math.PI) / 180;
  const pixelY = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * 2 ** zoom * MAP_TILE_SIZE;

  const tileX = Math.floor(pixelX / MAP_TILE_SIZE);
  const tileY = Math.floor(pixelY / MAP_TILE_SIZE);

  return {
    tileX,
    tileY,
    markerLeftPct: ((pixelX - tileX * MAP_TILE_SIZE) / MAP_TILE_SIZE) * 100,
    markerTopPct: ((pixelY - tileY * MAP_TILE_SIZE) / MAP_TILE_SIZE) * 100,
  };
}

function MapPreview({ latitude, longitude, className, onDoubleClick }: { latitude: string; longitude: string; className?: string; onDoubleClick?: () => void }) {
  const hasInput = !!latitude || !!longitude;
  const isValid = !!latitude && !!longitude && isValidCoordinate(latitude, longitude);

  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <span className="text-muted-foreground text-xs">LOCALIZAÇÃO NO MAPA</span>
      <div
        className="relative w-full flex-1 cursor-pointer overflow-hidden rounded-lg border border-input bg-input/40"
        onDoubleClick={onDoubleClick}
        title="Clique duas vezes para escolher no mapa"
      >
        {isValid ? (
          (() => {
            const { tileX, tileY, markerLeftPct, markerTopPct } = getTilePosition(Number(latitude), Number(longitude), MAP_TILE_ZOOM);
            return (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://tile.openstreetmap.org/${MAP_TILE_ZOOM}/${tileX}/${tileY}.png`}
                  alt="Localização da propriedade"
                  className="size-full object-fill"
                />
                <MapPin
                  className="absolute size-5 fill-destructive text-destructive-foreground drop-shadow"
                  style={{ left: `${markerLeftPct}%`, top: `${markerTopPct}%`, transform: "translate(-50%, -100%)" }}
                />
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-0 bottom-0 bg-background/70 px-1 text-[9px] leading-tight text-muted-foreground hover:underline"
                >
                  © OpenStreetMap
                </a>
              </>
            );
          })()
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

export default function PropertyForm({ id, title, onCancel, onSuccess }: PropertyFormProps) {
  const { refresh: refreshCurrentProperty } = useCurrentProperty();
  const [isDataLoading, setIsDataLoading] = useState(!!id);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isZipLoading, setIsZipLoading] = useState(false);

  const [ownerItems, setOwnerItems] = useState<SearchComboboxItem[]>([]);
  const ownerDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchOwners = useCallback((query: string) => {
    if (ownerDebounce.current) clearTimeout(ownerDebounce.current);
    ownerDebounce.current = setTimeout(async () => {
      const result = await getPeople({ search: query, pageSize: query ? 20 : 5 });
      setOwnerItems(result.data.map((p) => ({ value: p.id, label: p.name })));
    }, 300);
  }, []);

  const { handleSubmit, control, reset, watch, setValue, setError, formState: { isSubmitting } } = useForm<PropertyFormData>({
    resolver: zodResolver(propertyFormSchema),
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

  const latitude = watch("latitude");
  const longitude = watch("longitude");
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const initialOwners = await getPeople({ pageSize: 5 });
        let seededOwners = initialOwners.data.map((p) => ({ value: p.id, label: p.name }));

        if (id) {
          const data = await getProperty(id);
          if (data.ownerId && data.ownerName && !seededOwners.some((o) => o.value === data.ownerId)) {
            seededOwners = [{ value: data.ownerId, label: data.ownerName }, ...seededOwners];
          }
          reset(data);
        }

        setOwnerItems(seededOwners);
      } catch {
        setLoadFailed(true);
      } finally {
        setIsDataLoading(false);
      }
    }

    loadData();
  }, [id, reset]);



  async function geocodeAddress(street: string, city: string, state: string, postalcode: string) {
    try {
      const params = new URLSearchParams({ format: "json", street, city, state, postalcode, country: "Brasil", limit: "1" });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
      const results = await response.json();
      return results?.[0] ? { lat: results[0].lat as string, lon: results[0].lon as string } : null;
    } catch {
      return null;
    }
  }

  async function handleZipBlur(zipCode: string) {
    const digits = zipCode.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setIsZipLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error("CEP não encontrado.");
        return;
      }

      setValue("street", data.logradouro || "", { shouldValidate: true });
      setValue("neighborhood", data.bairro || "", { shouldValidate: true });
      setValue("city", data.localidade || "", { shouldValidate: true });
      setValue("state", data.uf || "", { shouldValidate: true });

      const coordinates = await geocodeAddress(data.logradouro || "", data.localidade || "", data.uf || "", digits);
      if (coordinates) {
        setValue("latitude", coordinates.lat, { shouldValidate: true });
        setValue("longitude", coordinates.lon, { shouldValidate: true });
      }
    } catch {
      toast.error("Não foi possível buscar o endereço pelo CEP.");
    } finally {
      setIsZipLoading(false);
    }
  }


  async function onSubmit(data: PropertyFormData) {
    try {
      if (id) {
        await updateProperty(id, data);
        const fresh = await getProperty(id);
        reset(fresh);
        toast.success("Registro atualizado com sucesso!");
        refreshCurrentProperty();
        onSuccess?.();

      } else {
        const response = await createProperty(data);
        toast.success("Registro salvo com sucesso!");
        refreshCurrentProperty();
        onSuccess?.(response.data.id);
      }
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        Object.entries(error.errors).forEach(([field, message]) => {
          setError(field as keyof PropertyFormData, { type: "server", message });
        });
        toast.error("Verifique os campos destacados.");
      } else {
        toast.error("A requisição falhou! Tente novamente.");
      }
    }
  }



  if (loadFailed) {
    return (
      <ErrorPage message={"Não foi possível obter os dados do servidor."} onRetry={() => window.location.reload()} />
    );
  }

  if (isDataLoading) {
    return <FormSkeleton />;
  }


  return (
    <form className="mx-auto flex w-full max-w-300 flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>

      <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={() => onCancel?.()}>
        <ArrowLeft className="size-4" /> Voltar
      </Button>

      {title && <h1 className="text-2xl font-semibold">{title}</h1>}
      <Separator />

      <FieldSet className="border-0">
        <FieldLegend> Identificação </FieldLegend>

        <FieldRow cols={2}>
          <FormField name="name" label="Nome" required
            control={control}
            render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Ex: Fazendão São João" />}
          />

          <FormField name="ownerId" label="Titular" required
            control={control}
            render={({ id: fieldId, field, fieldState }) => (
              <SearchCombobox placeholder="buscar..."
                id={fieldId} field={field} fieldState={fieldState}
                items={ownerItems}
                onInputValueChange={(val) => searchOwners(val)}
              />
            )}
          />
        </FieldRow>

        <FieldRow cols={2}>
          <FormField name="totalArea" label="Área Total (ha)"
            control={control}
            render={({ field, id: fieldId }) => (
              <Input {...field} id={fieldId} type="number" step="0.0001" min="0" placeholder="Ex: 120" />
            )}
          />
          <FormField name="productiveArea" label="Área Produtiva (ha)"
            control={control}
            render={({ field, id: fieldId }) => (
              <Input {...field} id={fieldId} type="number" step="0.0001" min="0" placeholder="Ex: 100" />
            )}
          />
        </FieldRow>

        <FieldRow cols={3}>
          <FormField name="car" label="CAR"
            control={control}
            render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Ex: MT-5107909-E8C2..." />}
          />
          <FormField name="cib" label="CIB"
            control={control}
            render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Ex: ABC1234-5" />}
          />
          <FormField name="ccir" label="CCIR"
            control={control}
            render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Ex: 999.999.999.999-9" />}
          />
        </FieldRow>
      </FieldSet>
      <Separator />

      <div className="grid gap-4 md:grid-cols-[2fr_auto_1fr] items-stretch">
        <FieldSet className="border-0">
          <FieldLegend>Endereço</FieldLegend>
          <FieldRow cols={1}>
            <FormField name="zipCode" label="CEP"
              control={control}
              render={({ field, id: fieldId }) => (
                <IMaskInput
                  mask="00000-000"
                  unmask
                  id={fieldId}
                  name={field.name}
                  value={field.value}
                  disabled={isZipLoading}
                  placeholder="Ex: 78000-000"
                  onAccept={(value) => field.onChange(value)}
                  onBlur={(e) => { field.onBlur(); handleZipBlur(e.target.value); }}
                  inputRef={field.ref}
                  className={MASKED_INPUT_CLASSNAME}
                />
              )}
            />
          </FieldRow>

          <FieldRow cols={2}>
            <FormField name="street" label="Logradouro"
              control={control}
              render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Ex: Av. Brasil" />}
            />

            <FormField name="number" label="Número"
              control={control}
              render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Ex: 1200" />}
            />
          </FieldRow>

          <FieldRow cols={2}>
            <FormField name="complement" label="Complemento"
              control={control}
              render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Opcional" />}
            />
            <FormField name="neighborhood" label="Bairro"
              control={control}
              render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Opcional" />}
            />
          </FieldRow>

          <FieldRow cols={2}>
            <FormField name="city" label="Município"
              control={control}
              render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Ex: Cuiabá" />}
            />
            <FormField name="state" label="UF"
              control={control}
              render={({ id: fieldId, field, fieldState }) => (
                <SearchCombobox placeholder="Selecionar..."
                  id={fieldId} field={field} fieldState={fieldState}
                  items={BR_STATE_ITEMS}
                />
              )}
            />
          </FieldRow>
        </FieldSet>

        <Separator orientation="vertical" className="hidden md:block" />

        <FieldRow cols={1}>
          <FieldLegend> Localização </FieldLegend>

          <FormField name="latitude" label="Latitude"
            control={control}
            render={({ field, id: fieldId }) => (
              <Input {...field} id={fieldId} type="number" step="any" placeholder="Ex: -15.6014" />
            )}
          />
          <FormField name="longitude" label="Longitude"
            control={control}
            render={({ field, id: fieldId }) => (
              <Input {...field} id={fieldId} type="number" step="any" placeholder="Ex: -56.0979" />
            )}
          />
          <MapPreview
            latitude={latitude ?? ""}
            longitude={longitude ?? ""}
            onDoubleClick={() => setIsPickerOpen(true)}
          />
        </FieldRow>
      </div >

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

    </form >
  );
}
