"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { getAnimal, updateAnimal, createAnimal, getAnimais, ApiError } from "./services";
import { ErrorPage } from "@/components/our/ErrorPage";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/our/FormField";
import FieldRow from "@/components/our/FieldRow";

import { SearchCombobox } from "@/components/our/SearchCombobox";
import { Loader2 } from "lucide-react";
import FormSkeleton from "@/components/our/FormSkeleton";
import { AnimalFormData, animalFormSchema, EnumAnimalOrigem, EnumAnimalStatus, EnumSexo } from "./schema";




type AnimalFormProps = {
  id?: string;
  title?: string;
  onCancel?: () => void;
  onSuccess?: (newId?: string) => void;
};

type Raca = { id: number; nome: string };
type Lote = { id: number; nome: string };
type AnimalSimples = { id: string; brinco: string; rfid: string | null; sexo: string };
type Fazenda = { id: number; nome: string };

export default function AnimalForm({ id, title, onCancel, onSuccess }: AnimalFormProps) {
  const ORIGEM_ITEMS = [
    { value: EnumAnimalOrigem.NASCIMENTO, label: "Nascimento" },
    { value: EnumAnimalOrigem.COMPRA, label: "Compra" },
    { value: EnumAnimalOrigem.TRANSFERENCIA, label: "Transferência" },
  ]
  const SEXO_ITEMS = [
    { value: EnumSexo.M, label: "Macho" },
    { value: EnumSexo.F, label: "Fêmea" },
  ]

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [racas, setRacas] = useState<Raca[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [animais, setAnimais] = useState<AnimalSimples[]>([]);
  const [fazendas, setFazendas] = useState<Fazenda[]>([]);

  type PaiItem = { value: string; label: string };
  const [paiItems, setPaiItems] = useState<PaiItem[]>([]);
  const paiDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchPai = useCallback((query: string) => {
    if (paiDebounce.current) clearTimeout(paiDebounce.current);
    paiDebounce.current = setTimeout(async () => {
      const result = await getAnimais({ search: query, sexo: "M", pageSize: query ? 20 : 2 });
      setPaiItems(result.data.map(a => ({ value: a.id, label: a.brinco })));
    }, 300);
  }, []);

  const { handleSubmit, control, reset, watch, setError, formState: { isSubmitting } } = useForm<AnimalFormData>({
    resolver: zodResolver(animalFormSchema),
    defaultValues: {
      rfid: "",
      brinco: "",
      nome_apelido: "",
      sexo: EnumSexo.M,
      data_nascimento: "",
      peso_nascimento_kg: "",
      origem: EnumAnimalOrigem.NASCIMENTO,
      status: EnumAnimalStatus.ATIVO,
      raca_id: "",
      lote_id: "",
      mae_id: "",
      pai_id: "",
      fazenda_origem_id: "",
      fazenda_origem_nome: "",
      data_aquisicao: "",
      valor_compra: "",
      idade_entrada_meses: "",
      peso_atual_kg: "",
    },
  });

  const origem = watch("origem");
  const isCompraTransf = origem === EnumAnimalOrigem.COMPRA || origem === EnumAnimalOrigem.TRANSFERENCIA;

  useEffect(() => {
    async function loadData() {
      try {
        const [meta, paiResult] = await Promise.all([
          fetch("/api/metadados").then(r => r.json()),
          getAnimais({ sexo: "M", pageSize: 2 }),
        ]);
        setRacas(meta.racas);
        setLotes(meta.lotes);
        setAnimais(meta.animaisFazenda);
        setFazendas(meta.fazendas);
        setPaiItems(paiResult.data.map(a => ({ value: a.id, label: a.brinco })));

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
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>

      {title && <h1 className="text-xl font-semibold">{title}</h1>}

      <FieldSet className="bg-card">
        <FieldLegend> Identificação </FieldLegend>

        <FieldRow cols={2}>
          <FormField name="brinco" label="Brinco" required
            control={control}
            render={({ field, id }) => <Input {...field} id={id} placeholder="Ex: MS-001234" />}
          />

          <FormField name="rfid" label="RFID / Chip"
            control={control}
            render={({ field, id }) => <Input {...field} id={id} placeholder="Ex: 900082000169813" />}
          />
        </FieldRow>

        <FieldRow cols={2}>
          <FormField name="nome_apelido" label="Apelido"
            control={control}
            render={({ field, id }) => <Input {...field} id={id} placeholder="Opcional" />}
          />

          <FormField name="sexo" label="Sexo"
            control={control}
            render={({ id, field, fieldState }) => (
              <SearchCombobox
                id={id} field={field} fieldState={fieldState}
                items={SEXO_ITEMS}
                keepSelection
              />
            )}
          />
        </FieldRow>


        <FieldRow cols={2}>
          <FormField name="raca_id" label="Raça"
            control={control}
            render={({ id, field, fieldState }) => (
              <SearchCombobox placeholder="buscar..."
                id={id} field={field} fieldState={fieldState}
                items={racas.map(r => ({ value: r.id.toString(), label: r.nome }))}
              />
            )}
          />
          <FormField name="lote_id" label="Lote"
            control={control}
            render={({ id, field, fieldState }) => (
              <SearchCombobox placeholder="buscar..."
                id={id} field={field} fieldState={fieldState}
                items={lotes.map(l => ({ value: l.id.toString(), label: l.nome }))}
              />
            )}
          />
        </FieldRow>

        <FieldRow cols={2}>
          <FormField name="data_nascimento" label="Data de Nascimento"
            control={control}
            render={({ field, id }) => <Input {...field} id={id} type="date" />}
          />
          <FormField name="peso_nascimento_kg" label="Peso Nascimento (kg)"
            control={control}
            render={({ field, id }) => (
              <Input {...field} id={id} type="number" step="0.1" min="0" placeholder="Ex: 32.5" />
            )}
          />
        </FieldRow>

      </FieldSet>

      <FieldSet>
        <FieldLegend>Filiação</FieldLegend>
        <FieldRow cols={2}>
          <FormField name="mae_id" label="Mãe" required
            control={control}
            render={({ id, field, fieldState }) => (
              <SearchCombobox placeholder="buscar..."
                id={id} field={field} fieldState={fieldState}
                items={animais.filter(a => a.sexo === "F").map(a => ({ value: a.id, label: a.brinco }))}
              />
            )}
          />
          <FormField name="pai_id" label="Pai (Touro)"
            control={control}
            render={({ id, field, fieldState }) => (
              <SearchCombobox placeholder="buscar..."
                id={id} field={field} fieldState={fieldState}
                items={paiItems}
                onInputValueChange={(val) => searchPai(val)}
              />
            )}
          />
        </FieldRow>
      </FieldSet>

      <FieldSet>
        <FieldLegend>Origem</FieldLegend>
        <FieldRow cols={2}>
          <FormField name="origem" label="Origem"
            control={control}
            render={({ id, field, fieldState }) => (
              <SearchCombobox
                id={id} field={field} fieldState={fieldState}
                items={ORIGEM_ITEMS}
                keepSelection
              />
            )}
          />
        </FieldRow>

        {isCompraTransf && (
          <>
            <FieldRow cols={2}>
              <FormField name="data_aquisicao" label="Data de Aquisição"
                control={control}
                render={({ field, id }) => <Input {...field} id={id} type="date" />}
              />
              <FormField name="idade_entrada_meses" label="Idade na Entrada (meses)"
                control={control}
                render={({ field, id }) => <Input {...field} id={id} type="number" min="0" placeholder="Ex: 8" />}
              />
            </FieldRow>
            <FieldRow cols={2}>
              <FormField name="fazenda_origem_id" label="Fazenda de Origem"
                control={control}
                render={({ id, field, fieldState }) => (
                  <SearchCombobox placeholder="buscar..."
                    id={id} field={field} fieldState={fieldState}
                    items={fazendas.map(f => ({ value: f.id.toString(), label: f.nome }))}
                  />
                )}
              />
              <FormField name="fazenda_origem_nome" label="Nome da Fazenda (se externa)"
                control={control}
                render={({ field, id }) => <Input {...field} id={id} placeholder="Ex: Fazenda Santa Fé" />}
              />
            </FieldRow>
          </>
        )}

        {origem === EnumAnimalOrigem.COMPRA && (
          <FieldRow cols={2}>
            <FormField name="valor_compra" label="Valor da Compra (R$)" required
              control={control}
              render={({ field, id }) => (
                <Input {...field} id={id} type="number" step="0.01" min="0" placeholder="Ex: 3500.00" />
              )}
            />
          </FieldRow>
        )}
      </FieldSet>

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
