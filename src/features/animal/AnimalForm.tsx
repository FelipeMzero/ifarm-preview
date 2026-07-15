"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { getAnimal, updateAnimal, createAnimal, getAnimals, getMetadata, ApiError, Breed, Batch, AnimalSummary } from "./services";
import { PropertyOption } from "@/features/property/services";
import { ErrorPage } from "@/components/our/ErrorPage";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/our/FormField";
import FieldRow from "@/components/our/FieldRow";

import { SearchCombobox } from "@/components/our/SearchCombobox";
import { ArrowLeft, Loader2 } from "lucide-react";
import FormSkeleton from "@/components/our/FormSkeleton";
import { AnimalFormData, animalFormSchema, EnumAnimalOrigin, EnumAnimalStatus, EnumSex } from "./schema";
import { Separator } from "@/components/ui/separator";
import { FormActionBar } from "@/components/our/FormActionBar";




type AnimalFormProps = {
  id?: string;
  title?: string;
  onCancel?: () => void;
  onSuccess?: (newId?: string) => void;
};

export default function AnimalForm({ id, title, onCancel, onSuccess }: AnimalFormProps) {
  const ORIGIN_ITEMS = [
    { value: EnumAnimalOrigin.BIRTH, label: "Nascimento" },
    { value: EnumAnimalOrigin.PURCHASE, label: "Compra" },
    { value: EnumAnimalOrigin.TRANSFER, label: "Transferência" },
  ]
  const SEX_ITEMS = [
    { value: EnumSex.MALE, label: "Macho" },
    { value: EnumSex.FEMALE, label: "Fêmea" },
  ]

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [animals, setAnimals] = useState<AnimalSummary[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);

  type FatherItem = { value: string; label: string };
  const [fatherItems, setFatherItems] = useState<FatherItem[]>([]);
  const fatherDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchFather = useCallback((query: string) => {
    if (fatherDebounce.current) clearTimeout(fatherDebounce.current);
    fatherDebounce.current = setTimeout(async () => {
      const result = await getAnimals({ search: query, sex: EnumSex.MALE, pageSize: query ? 20 : 2 });
      setFatherItems(result.data.map(a => ({ value: a.id, label: a.earTag })));
    }, 300);
  }, []);

  const { handleSubmit, control, reset, watch, setError, formState: { isSubmitting } } = useForm<AnimalFormData>({
    resolver: zodResolver(animalFormSchema),
    defaultValues: {
      earTag: "",
      rfid: "",
      name: "",
      sex: EnumSex.MALE,
      birthDate: "",
      birthWeightKg: "",
      origin: EnumAnimalOrigin.BIRTH,
      status: EnumAnimalStatus.ACTIVE,
      breedId: "",
      batchId: "",
      motherId: "",
      fatherId: "",
      originPropertyId: "",
      originPropertyName: "",
      acquisitionDate: "",
      purchasePrice: "",
      entryAgeMonths: "",
      currentWeightKg: "",
    },
  });

  const origin = watch("origin");
  const isPurchaseOrTransfer = origin === EnumAnimalOrigin.PURCHASE || origin === EnumAnimalOrigin.TRANSFER;

  useEffect(() => {
    async function loadData() {
      try {
        const [meta, fatherResult] = await Promise.all([
          getMetadata(),
          getAnimals({ sex: EnumSex.MALE, pageSize: 2 }),
        ]);
        setBreeds(meta.breeds);
        setBatches(meta.batches);
        setAnimals(meta.farmAnimals);
        setProperties(meta.properties);
        setFatherItems(fatherResult.data.map(a => ({ value: a.id, label: a.earTag })));

        if (id) {
          const data = await getAnimal(id);
          reset(data);
        }

      } catch {
        setLoadFailed(true);
      } finally {
        setIsDataLoading(false);
      }
    }

    loadData();
  }, [id, reset]);



  async function onSubmit(data: AnimalFormData) {
    try {
      if (id) {
        await new Promise(resolve => setTimeout(resolve, 1500)); //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
        await updateAnimal(id, data);
        const fresh = await getAnimal(id);
        reset(fresh);
        toast.success("Atualizado com sucesso!")
        onSuccess?.()

      } else {
        await new Promise(resolve => setTimeout(resolve, 1500)); //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
        const response = await createAnimal(data);
        toast.success("Salvo com sucesso!")
        onSuccess?.(response.data.id)
      }
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        Object.entries(error.errors).forEach(([field, message]) => {
          setError(field as keyof AnimalFormData, { type: "server", message });
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
    return <FormSkeleton />
  }


  return (
    <form className="mx-auto flex w-full max-w-300 flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>

      <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={() => onCancel?.()}>
        <ArrowLeft className="size-4" /> Voltar
      </Button>

      {title && <h1 className="text-2xl font-semibold">{title}</h1>}
      <Separator />

      <FieldSet className="border-0">
        <FieldLegend> Identificação </FieldLegend>

        <FieldRow cols={2}>
          <FormField name="earTag" label="Brinco" required
            control={control}
            render={({ field, id }) => <Input {...field} id={id} placeholder="Ex: MS-001234" />}
          />

          <FormField name="rfid" label="RFID / Chip"
            control={control}
            render={({ field, id }) => <Input {...field} id={id} placeholder="Ex: 900082000169813" />}
          />
        </FieldRow>

        <FieldRow cols={2}>
          <FormField name="name" label="Apelido"
            control={control}
            render={({ field, id }) => <Input {...field} id={id} placeholder="Opcional" />}
          />

          <FormField name="sex" label="Sexo"
            control={control}
            render={({ id, field, fieldState }) => (
              <SearchCombobox
                id={id} field={field} fieldState={fieldState}
                items={SEX_ITEMS}
                keepSelection
              />
            )}
          />
        </FieldRow>


        <FieldRow cols={2}>
          <FormField name="breedId" label="Raça"
            control={control}
            render={({ id, field, fieldState }) => (
              <SearchCombobox placeholder="buscar..."
                id={id} field={field} fieldState={fieldState}
                items={breeds.map(r => ({ value: r.id.toString(), label: r.name }))}
              />
            )}
          />
          <FormField name="batchId" label="Lote"
            control={control}
            render={({ id, field, fieldState }) => (
              <SearchCombobox placeholder="buscar..."
                id={id} field={field} fieldState={fieldState}
                items={batches.map(l => ({ value: l.id.toString(), label: l.name }))}
              />
            )}
          />
        </FieldRow>

        <FieldRow cols={2}>
          <FormField name="birthDate" label="Data de Nascimento"
            control={control}
            render={({ field, id }) => <Input {...field} id={id} type="date" />}
          />
          <FormField name="birthWeightKg" label="Peso Nascimento (kg)"
            control={control}
            render={({ field, id }) => (
              <Input {...field} id={id} type="number" step="0.1" min="0" placeholder="Ex: 32.5" />
            )}
          />
        </FieldRow>

      </FieldSet>
      <Separator />

      <FieldSet className="border-0">
        <FieldLegend>Filiação</FieldLegend>
        <FieldRow cols={2}>
          <FormField name="motherId" label="Mãe"
            control={control}
            render={({ id, field, fieldState }) => (
              <SearchCombobox placeholder="buscar..."
                id={id} field={field} fieldState={fieldState}
                items={animals.filter(a => a.sex === EnumSex.FEMALE).map(a => ({ value: a.id, label: a.earTag }))}
              />
            )}
          />
          <FormField name="fatherId" label="Pai (Touro)"
            control={control}
            render={({ id, field, fieldState }) => (
              <SearchCombobox placeholder="buscar..."
                id={id} field={field} fieldState={fieldState}
                items={fatherItems}
                onInputValueChange={(val) => searchFather(val)}
              />
            )}
          />
        </FieldRow>
      </FieldSet>
      <Separator/>

      <FieldSet className="border-0">
        <FieldLegend>Origem</FieldLegend>
        <FieldRow cols={2}>
          <FormField name="origin" label="Origem"
            control={control}
            render={({ id, field, fieldState }) => (
              <SearchCombobox
                id={id} field={field} fieldState={fieldState}
                items={ORIGIN_ITEMS}
                keepSelection
              />
            )}
          />
        </FieldRow>

        {isPurchaseOrTransfer && (
          <>
            <FieldRow cols={2}>
              <FormField name="acquisitionDate" label="Data de Aquisição"
                control={control}
                render={({ field, id }) => <Input {...field} id={id} type="date" />}
              />
              <FormField name="entryAgeMonths" label="Idade na Entrada (meses)"
                control={control}
                render={({ field, id }) => <Input {...field} id={id} type="number" min="0" placeholder="Ex: 8" />}
              />
            </FieldRow>
            <FieldRow cols={2}>
              <FormField name="originPropertyId" label="Propriedade de Origem"
                control={control}
                render={({ id, field, fieldState }) => (
                  <SearchCombobox placeholder="buscar..."
                    id={id} field={field} fieldState={fieldState}
                    items={properties.map(p => ({ value: p.id, label: p.name }))}
                  />
                )}
              />
              <FormField name="originPropertyName" label="Nome da Fazenda (se externa)"
                control={control}
                render={({ field, id }) => <Input {...field} id={id} placeholder="Ex: Fazenda Santa Fé" />}
              />
            </FieldRow>
          </>
        )}

        {origin === EnumAnimalOrigin.PURCHASE && (
          <FieldRow cols={2}>
            <FormField name="purchasePrice" label="Valor da Compra (R$)" required
              control={control}
              render={({ field, id }) => (
                <Input {...field} id={id} type="number" step="0.01" min="0" placeholder="Ex: 3500.00" />
              )}
            />
          </FieldRow>
        )}
      </FieldSet>

      <FormActionBar>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Salvar
        </Button>
      </FormActionBar>

    </form>
  );
}
