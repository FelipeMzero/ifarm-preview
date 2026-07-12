"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IMaskInput } from "react-imask";

import { getProperty, updateProperty, createProperty, ApiError } from "./services";
import { getPeople } from "../pessoas/services";
import { ErrorPage } from "@/components/our/ErrorPage";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/our/FormField";
import FieldRow from "@/components/our/FieldRow";

import { SearchCombobox, SearchComboboxItem } from "@/components/our/SearchCombobox";
import { Loader2 } from "lucide-react";
import FormSkeleton from "@/components/our/FormSkeleton";
import { PropertyFormData, propertyFormSchema } from "./schema";
import { Separator } from "@/components/ui/separator";
import { BR_STATE_ITEMS } from "@/lib/br-states";




const MASKED_INPUT_CLASSNAME = "h-10 w-full min-w-0 rounded-lg border border-input bg-input/40 px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

type PropertyFormProps = {
  id?: string;
  title?: string;
  onCancel?: () => void;
  onSuccess?: (newId?: string) => void;
};

export default function PropertyForm({ id, title, onCancel, onSuccess }: PropertyFormProps) {
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

  const { handleSubmit, control, reset, setValue, setError, formState: { isSubmitting } } = useForm<PropertyFormData>({
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
        onSuccess?.();

      } else {
        const response = await createProperty(data);
        toast.success("Registro salvo com sucesso!");
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
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>

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
              <Input {...field} id={fieldId} type="number" step="0.01" min="0" placeholder="Ex: 120" />
            )}
          />
          <FormField name="productiveArea" label="Área Produtiva (ha)"
            control={control}
            render={({ field, id: fieldId }) => (
              <Input {...field} id={fieldId} type="number" step="0.01" min="0" placeholder="Ex: 100" />
            )}
          />
        </FieldRow>

        <FieldRow cols={3}>
          <FormField name="cib" label="CIB"
            control={control}
            render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Ex: ABC1234-5" />}
          />
          <FormField name="ccir" label="CCIR"
            control={control}
            render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Ex: 999.999.999.999-9" />}
          />
          <FormField name="car" label="CAR"
            control={control}
            render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Ex: MT-5107909-E8C2..." />}
          />
        </FieldRow>

        <FieldRow cols={2}>
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
        </FieldRow>

      </FieldSet>
      <Separator />

      <FieldSet className="border-0">
        <FieldLegend>Endereço</FieldLegend>
        <FieldRow cols={3}>
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
          <FormField name="street" label="Logradouro"
            control={control}
            render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Ex: Av. Brasil" />}
          />
          <FormField name="number" label="Número"
            control={control}
            render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Ex: 1200" />}
          />
        </FieldRow>
        <FieldRow cols={3}>
          <FormField name="complement" label="Complemento"
            control={control}
            render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Opcional" />}
          />
          <FormField name="neighborhood" label="Bairro"
            control={control}
            render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Opcional" />}
          />
          <FormField name="city" label="Município"
            control={control}
            render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Ex: Cuiabá" />}
          />
        </FieldRow>
        <FieldRow cols={2}>
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

      <Separator/>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => onCancel?.()}>
          Voltar
        </Button>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Salvar
        </Button>

      </div>

    </form>
  );
}
