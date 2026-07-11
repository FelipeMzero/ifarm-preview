"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IMaskInput } from "react-imask";

import { getPerson, updatePerson, createPerson, ApiError } from "./services";
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
import { PersonFormData, personFormSchema, EnumPersonType, EnumMaritalStatus } from "./schema";
import { Separator } from "@/components/ui/separator";




const MASKED_INPUT_CLASSNAME = "h-10 w-full min-w-0 rounded-lg border border-input bg-input/40 px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

const PHONE_MASK = [
  { mask: "(00) 0000-0000" },
  { mask: "(00) 00000-0000" },
];

type PersonFormProps = {
  id?: string;
  title?: string;
  onCancel?: () => void;
  onSuccess?: (newId?: string) => void;
};

export default function PersonForm({ id, title, onCancel, onSuccess }: PersonFormProps) {
  const TYPE_ITEMS = [
    { value: EnumPersonType.INDIVIDUAL, label: "Física" },
    { value: EnumPersonType.COMPANY, label: "Jurídica" },
  ];
  const MARITAL_STATUS_ITEMS = [
    { value: EnumMaritalStatus.SINGLE, label: "Solteiro(a)" },
    { value: EnumMaritalStatus.MARRIED, label: "Casado(a)" },
    { value: EnumMaritalStatus.STABLE_UNION, label: "União Estável" },
    { value: EnumMaritalStatus.DIVORCED, label: "Divorciado(a)" },
    { value: EnumMaritalStatus.WIDOWED, label: "Viúvo(a)" },
  ];
  const STATE_ITEMS = [
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
  const [isZipLoading, setIsZipLoading] = useState(false);

  const { handleSubmit, control, reset, watch, setValue, setError, formState: { isSubmitting } } = useForm<PersonFormData>({
    resolver: zodResolver(personFormSchema),
    defaultValues: {
      type: EnumPersonType.INDIVIDUAL,
      taxId: "",
      name: "",
      stateRegistration: "",
      phone: "",
      email: "",
      tradeName: "",
      rg: "",
      birthDate: "",
      maritalStatus: "",
      zipCode: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
    },
  });

  const type = watch("type");
  const isCompany = type === EnumPersonType.COMPANY;

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      try {
        const data = await getPerson(id!);
        reset(data);
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


  async function onSubmit(data: PersonFormData) {
    try {
      if (id) {
        await updatePerson(id, data);
        const fresh = await getPerson(id);
        reset(fresh);
        toast.success("Atualizado com sucesso!");
        onSuccess?.();

      } else {
        const response = await createPerson(data);
        toast.success("Salvo com sucesso!");
        onSuccess?.(response.data.id);
      }
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        Object.entries(error.errors).forEach(([field, message]) => {
          setError(field as keyof PersonFormData, { type: "server", message });
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
          <FormField name="type" label="Tipo" required
            control={control}
            render={({ id: fieldId, field, fieldState }) =>
              id ? (
                <Input id={fieldId} disabled value={TYPE_ITEMS.find(t => t.value === field.value)?.label ?? field.value} />
              ) : (
                <SearchCombobox
                  id={fieldId} field={field} fieldState={fieldState}
                  items={TYPE_ITEMS}
                  keepSelection
                />
              )
            }
          />

          <FormField name="taxId" label={isCompany ? "CNPJ" : "CPF"} required
            control={control}
            render={({ field, id: fieldId }) =>
              <IMaskInput
                mask={isCompany ? "00.000.000/0000-00" : "000.000.000-00"}
                unmask
                id={fieldId}
                name={field.name}
                value={field.value}
                disabled={!!id}
                placeholder={isCompany ? "Ex: 12.345.678/0001-90" : "Ex: 123.456.789-00"}
                onAccept={(value) => field.onChange(value)}
                onBlur={field.onBlur}
                inputRef={field.ref}
                className={MASKED_INPUT_CLASSNAME}
              />
            }
          />
        </FieldRow>

        <FieldRow cols={2}>
          <FormField name="name" label={isCompany ? "Razão Social" : "Nome"} required
            control={control}
            render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Ex: João da Silva" />}
          />

          {isCompany ? (
            <FormField name="tradeName" label="Nome Fantasia"
              control={control}
              render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Opcional" />}
            />
          ) : (
            <FormField name="rg" label="RG"
              control={control}
              render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Ex: 12345678" />}
            />
          )}
        </FieldRow>

        {isCompany ? (
          <FieldRow cols={2}>
            <FormField name="stateRegistration" label="Inscrição Estadual"
              control={control}
              render={({ field, id: fieldId }) => <Input {...field} id={fieldId} placeholder="Opcional" />}
            />
          </FieldRow>
        ) : (
          <FieldRow cols={2}>
            <FormField name="birthDate" label="Data de Nascimento"
              control={control}
              render={({ field, id: fieldId }) => <Input {...field} id={fieldId} type="date" />}
            />
            <FormField name="maritalStatus" label="Estado Civil"
              control={control}
              render={({ id: fieldId, field, fieldState }) => (
                <SearchCombobox placeholder="Selecionar..."
                  id={fieldId} field={field} fieldState={fieldState}
                  items={MARITAL_STATUS_ITEMS}
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
          <FormField name="phone" label="Telefone"
            control={control}
            render={({ field, id: fieldId }) => (
              <IMaskInput
                mask={PHONE_MASK}
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
                items={STATE_ITEMS}
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
