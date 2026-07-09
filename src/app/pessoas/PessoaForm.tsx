"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IMaskInput } from "react-imask";

import { getPessoa, updatePessoa, createPessoa, ApiError } from "./services";
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
import { PessoaFormData, pessoaFormSchema, EnumPessoaTipo, EnumEstadoCivil } from "./schema";
import { Separator } from "@/components/ui/separator";




const MASKED_INPUT_CLASSNAME = "h-10 w-full min-w-0 rounded-lg border border-input bg-input/40 px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

const TELEFONE_MASK = [
  { mask: "(00) 0000-0000" },
  { mask: "(00) 00000-0000" },
];

type PessoaFormProps = {
  id?: string;
  title?: string;
  onCancel?: () => void;
  onSuccess?: (newId?: string) => void;
};

export default function PessoaForm({ id, title, onCancel, onSuccess }: PessoaFormProps) {
  const TIPO_ITEMS = [
    { value: EnumPessoaTipo.FISICA, label: "Física" },
    { value: EnumPessoaTipo.JURIDICA, label: "Jurídica" },
  ];
  const ESTADO_CIVIL_ITEMS = [
    { value: EnumEstadoCivil.SOLTEIRO, label: "Solteiro(a)" },
    { value: EnumEstadoCivil.CASADO, label: "Casado(a)" },
    { value: EnumEstadoCivil.UNIAO_ESTAVEL, label: "União Estável" },
    { value: EnumEstadoCivil.DIVORCIADO, label: "Divorciado(a)" },
    { value: EnumEstadoCivil.VIUVO, label: "Viúvo(a)" },
  ];
  const UF_ITEMS = [
    { value: "AC", label: "Acre" },
    { value: "AL", label: "Alagoas" },
    { value: "AP", label: "Amapá" },
    { value: "AM", label: "Amazonas" },
    { value: "BA", label: "Bahia" },
    { value: "CE", label: "Ceará" },
    { value: "DF", label: "Distrito Federal" },
    { value: "ES", label: "Espírito Santo" },
    { value: "GO", label: "Goiás" },
    { value: "MA", label: "Maranhão" },
    { value: "MT", label: "Mato Grosso" },
    { value: "MS", label: "Mato Grosso do Sul" },
    { value: "MG", label: "Minas Gerais" },
    { value: "PA", label: "Pará" },
    { value: "PB", label: "Paraíba" },
    { value: "PR", label: "Paraná" },
    { value: "PE", label: "Pernambuco" },
    { value: "PI", label: "Piauí" },
    { value: "RJ", label: "Rio de Janeiro" },
    { value: "RN", label: "Rio Grande do Norte" },
    { value: "RS", label: "Rio Grande do Sul" },
    { value: "RO", label: "Rondônia" },
    { value: "RR", label: "Roraima" },
    { value: "SC", label: "Santa Catarina" },
    { value: "SP", label: "São Paulo" },
    { value: "SE", label: "Sergipe" },
    { value: "TO", label: "Tocantins" },
  ];

  const [isDataLoading, setIsDataLoading] = useState(!!id);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);

  const { handleSubmit, control, reset, watch, setValue, setError, formState: { isSubmitting } } = useForm<PessoaFormData>({
    resolver: zodResolver(pessoaFormSchema),
    defaultValues: {
      tipo: EnumPessoaTipo.FISICA,
      documento: "",
      nome: "",
      inscricaoEstadual: "",
      telefone: "",
      email: "",
      nomeFantasia: "",
      rg: "",
      dataNascimento: "",
      estadoCivil: "",
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      municipio: "",
      uf: "",
    },
  });

  const tipo = watch("tipo");
  const isJuridica = tipo === EnumPessoaTipo.JURIDICA;

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      try {
        const data = await getPessoa(id!);
        reset(data);
      } catch {
        setLoadFailed(true);
      } finally {
        setIsDataLoading(false);
      }
    }

    loadData();
  }, [id, reset]);



  async function handleCepBlur(cep: string) {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setIsCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error("CEP não encontrado.");
        return;
      }

      setValue("logradouro", data.logradouro || "", { shouldValidate: true });
      setValue("bairro", data.bairro || "", { shouldValidate: true });
      setValue("municipio", data.localidade || "", { shouldValidate: true });
      setValue("uf", data.uf || "", { shouldValidate: true });
    } catch {
      toast.error("Não foi possível buscar o endereço pelo CEP.");
    } finally {
      setIsCepLoading(false);
    }
  }


  async function onSubmit(data: PessoaFormData) {
    try {
      if (id) {
        await updatePessoa(id, data);
        const fresh = await getPessoa(id);
        reset(fresh);
        toast.success("Atualizado com sucesso!");
        onSuccess?.();

      } else {
        const response = await createPessoa(data);
        toast.success("Salvo com sucesso!");
        onSuccess?.(response.data.id);
      }
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        Object.entries(error.errors).forEach(([field, message]) => {
          setError(field as keyof PessoaFormData, { type: "server", message });
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
          <FormField name="tipo" label="Tipo" required
            control={control}
            render={({ id: fieldId, field, fieldState }) =>
              id ? (
                <Input id={fieldId} disabled value={TIPO_ITEMS.find(t => t.value === field.value)?.label ?? field.value} />
              ) : (
                <SearchCombobox
                  id={fieldId} field={field} fieldState={fieldState}
                  items={TIPO_ITEMS}
                  keepSelection
                />
              )
            }
          />

          <FormField name="documento" label={isJuridica ? "CNPJ" : "CPF"} required
            control={control}
            render={({ field, id: fieldId }) =>
              <IMaskInput
                mask={isJuridica ? "00.000.000/0000-00" : "000.000.000-00"}
                unmask
                id={fieldId}
                name={field.name}
                value={field.value}
                disabled={!!id}
                placeholder={isJuridica ? "Ex: 12.345.678/0001-90" : "Ex: 123.456.789-00"}
                onAccept={(value) => field.onChange(value)}
                onBlur={field.onBlur}
                inputRef={field.ref}
                className={MASKED_INPUT_CLASSNAME}
              />
            }
          />
        </FieldRow>

        <FieldRow cols={2}>
          <FormField name="nome" label={isJuridica ? "Razão Social" : "Nome"} required
            control={control}
            render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Ex: João da Silva" />}
          />

          {isJuridica ? (
            <FormField name="nomeFantasia" label="Nome Fantasia"
              control={control}
              render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Opcional" />}
            />
          ) : (
            <FormField name="rg" label="RG"
              control={control}
              render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Opcional" />}
            />
          )}
        </FieldRow>

        {isJuridica ? (
          <FieldRow cols={2}>
            <FormField name="inscricaoEstadual" label="Inscrição Estadual"
              control={control}
              render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Opcional" />}
            />
          </FieldRow>
        ) : (
          <FieldRow cols={2}>
            <FormField name="dataNascimento" label="Data de Nascimento"
              control={control}
              render={({ field, id: fieldId }) => <Input {...field} id={fieldId} type="date" />}
            />
            <FormField name="estadoCivil" label="Estado Civil"
              control={control}
              render={({ id: fieldId, field, fieldState }) => (
                <SearchCombobox placeholder="buscar..."
                  id={fieldId} field={field} fieldState={fieldState}
                  items={ESTADO_CIVIL_ITEMS}
                />
              )}
            />
          </FieldRow>
        )}

      </FieldSet>
      <Separator />

      <FieldSet className="border-0">
        <FieldLegend>Contato</FieldLegend>
        <FieldRow cols={2}>
          <FormField name="telefone" label="Telefone"
            control={control}
            render={({ field, id: fieldId }) => (
              <IMaskInput
                mask={TELEFONE_MASK}
                unmask
                id={fieldId}
                name={field.name}
                value={field.value}
                placeholder="Ex: (11) 91234-5678"
                onAccept={(value) => field.onChange(value)}
                onBlur={field.onBlur}
                inputRef={field.ref}
                className={MASKED_INPUT_CLASSNAME}
              />
            )}
          />
          <FormField name="email" label="E-mail"
            control={control}
            render={({ field, id: fieldId }) => <Input {...field} id={fieldId} type="email" placeholder="Ex: contato@exemplo.com" />}
          />
        </FieldRow>
      </FieldSet>
      <Separator />

      <FieldSet className="border-0">
        <FieldLegend>Endereço</FieldLegend>
        <FieldRow cols={3}>
          <FormField name="cep" label="CEP"
            control={control}
            render={({ field, id: fieldId }) => (
              <IMaskInput
                mask="00000-000"
                unmask
                id={fieldId}
                name={field.name}
                value={field.value}
                disabled={isCepLoading}
                placeholder="Ex: 78000-000"
                onAccept={(value) => field.onChange(value)}
                onBlur={(e) => { field.onBlur(); handleCepBlur(e.target.value); }}
                inputRef={field.ref}
                className={MASKED_INPUT_CLASSNAME}
              />
            )}
          />
          <FormField name="logradouro" label="Logradouro"
            control={control}
            render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Ex: Av. Brasil" />}
          />
          <FormField name="numero" label="Número"
            control={control}
            render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Ex: 1200" />}
          />
        </FieldRow>
        <FieldRow cols={3}>
          <FormField name="complemento" label="Complemento"
            control={control}
            render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Opcional" />}
          />
          <FormField name="bairro" label="Bairro"
            control={control}
            render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Opcional" />}
          />
          <FormField name="municipio" label="Município"
            control={control}
            render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Ex: Cuiabá" />}
          />
        </FieldRow>
        <FieldRow cols={2}>
          <FormField name="uf" label="UF"
            control={control}
            render={({ id: fieldId, field, fieldState }) => (
              <SearchCombobox placeholder="buscar..."
                id={fieldId} field={field} fieldState={fieldState}
                items={UF_ITEMS}
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
