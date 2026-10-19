"use client";

import {
  FIELD_LIMITS,
  PersonType,
  personSchema,
  type PersonInput,
  ApiError,
} from "@ifarm/shared";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IMaskInput } from "react-imask";

import { personClient } from "@/lib/clients";
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
import { Separator } from "@/components/ui/separator";
import { BR_STATE_ITEMS } from "@ifarm/shared";
import { PERSON_TYPE_ITEMS, MARITAL_STATUS_ITEMS } from "@ifarm/shared";
import { FormActionBar } from "@/components/our/FormActionBar";
import { cn } from "@/lib/utils";

const MASKED_INPUT_CLASSNAME =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-input/40 px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

const PHONE_MASK = [{ mask: "(00) 0000-0000" }, { mask: "(00) 00000-0000" }];

type PersonFormProps = {
  id?: string;
  title?: string;
  onCancel?: () => void;
  onSuccess?: (newId?: string) => void;
};

export default function PersonForm({
  id,
  title,
  onCancel,
  onSuccess,
}: PersonFormProps) {
  const [isDataLoading, setIsDataLoading] = useState(!!id);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isZipLoading, setIsZipLoading] = useState(false);

  const {
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    setError,
    formState: { isSubmitting },
  } = useForm<PersonInput>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      type: PersonType.INDIVIDUAL,
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
  const isCompany = type === PersonType.COMPANY;

  useEffect(() => {
    if (!id) return;

    async function loadData() {
      try {
        const data = await personClient.getPerson(id!);
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

  async function onSubmit(data: PersonInput) {
    try {
      if (id) {
        await personClient.updatePerson(id, data);
        const fresh = await personClient.getPerson(id);
        reset(fresh);
        toast.success("Atualizado com sucesso!");
        onSuccess?.();
      } else {
        const response = await personClient.createPerson(data);
        toast.success("Salvo com sucesso!");
        onSuccess?.(response.data.id);
      }
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        Object.entries(error.errors).forEach(([field, message]) => {
          setError(field as keyof PersonInput, { type: "server", message });
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
        message={"Não foi possível obter os dados do servidor."}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (isDataLoading) {
    return <FormSkeleton />;
  }

  return (
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
            name="type"
            label="Tipo"
            required
            control={control}
            render={({ id: fieldId, field, fieldState }) =>
              id ? (
                <Input
                  id={fieldId}
                  disabled
                  value={
                    PERSON_TYPE_ITEMS.find((t) => t.value === field.value)
                      ?.label ?? field.value
                  }
                />
              ) : (
                <SearchCombobox
                  id={fieldId}
                  field={field}
                  fieldState={fieldState}
                  items={PERSON_TYPE_ITEMS}
                  keepSelection
                />
              )
            }
          />

          <FormField
            name="taxId"
            label={isCompany ? "CNPJ" : "CPF"}
            required
            control={control}
            render={({ field, id: fieldId }) => (
              <IMaskInput
                mask={isCompany ? "00.000.000/0000-00" : "000.000.000-00"}
                unmask
                id={fieldId}
                name={field.name}
                value={field.value}
                disabled={!!id}
                placeholder={
                  isCompany ? "Ex: 12.345.678/0001-90" : "Ex: 123.456.789-00"
                }
                onAccept={(value: string) => field.onChange(value)}
                onBlur={field.onBlur}
                inputRef={field.ref}
                className={MASKED_INPUT_CLASSNAME}
              />
            )}
          />
        </FieldRow>

        <FieldRow cols={2}>
          <FormField
            name="name"
            label={isCompany ? "Razão Social" : "Nome"}
            required
            control={control}
            render={({ field, id: fieldId }) => (
              <Input
                {...field}
                id={fieldId}
                maxLength={FIELD_LIMITS.person.name}
                placeholder="Ex: João da Silva"
              />
            )}
          />

          {isCompany ? (
            <FormField
              name="tradeName"
              label="Nome Fantasia"
              control={control}
              render={({ field, id: fieldId }) => (
                <Input
                  {...field}
                  id={fieldId}
                  maxLength={FIELD_LIMITS.person.tradeName}
                  placeholder="Ex: AgroVacinas Distribuidora"
                />
              )}
            />
          ) : (
            <FormField
              name="rg"
              label="RG"
              control={control}
              render={({ field, id: fieldId }) => (
                <Input
                  {...field}
                  id={fieldId}
                  maxLength={FIELD_LIMITS.person.rg}
                  placeholder="Ex: 12345678"
                />
              )}
            />
          )}
        </FieldRow>

        {isCompany ? (
          <FieldRow cols={2}>
            <FormField
              name="stateRegistration"
              label="Inscrição Estadual"
              control={control}
              render={({ field, id: fieldId }) => (
                <Input
                  {...field}
                  id={fieldId}
                  maxLength={FIELD_LIMITS.person.stateRegistration}
                  placeholder="Ex: 123.456.789.123"
                />
              )}
            />
          </FieldRow>
        ) : (
          <FieldRow cols={2}>
            <FormField
              name="birthDate"
              label="Data de Nascimento"
              control={control}
              render={({ field, id: fieldId }) => (
                <Input {...field} id={fieldId} type="date" />
              )}
            />
            <FormField
              name="maritalStatus"
              label="Estado Civil"
              control={control}
              render={({ id: fieldId, field, fieldState }) => (
                <SearchCombobox
                  placeholder="Selecionar..."
                  id={fieldId}
                  field={field}
                  fieldState={fieldState}
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
          <FormField
            name="phone"
            label="Telefone"
            control={control}
            render={({ field, id: fieldId }) => (
              <IMaskInput
                mask={PHONE_MASK}
                unmask
                id={fieldId}
                name={field.name}
                value={field.value}
                placeholder="Ex: (11) 91234-5678"
                onAccept={(value: string) => field.onChange(value)}
                onBlur={field.onBlur}
                inputRef={field.ref}
                className={MASKED_INPUT_CLASSNAME}
              />
            )}
          />
          <FormField
            name="email"
            label="E-mail"
            control={control}
            render={({ field, id: fieldId }) => (
              <Input
                {...field}
                id={fieldId}
                type="email"
                maxLength={FIELD_LIMITS.person.email}
                placeholder="Ex: contato@exemplo.com"
              />
            )}
          />
        </FieldRow>
      </FieldSet>
      <Separator />

      <FieldSet className="border-0">
        <FieldLegend>Endereço</FieldLegend>
        <FieldRow cols={3}>
          <FormField
            name="zipCode"
            label="CEP"
            control={control}
            render={({ field, id: fieldId }) => (
              <div className="relative">
                <IMaskInput
                  mask="00000-000"
                  unmask
                  id={fieldId}
                  name={field.name}
                  value={field.value}
                  disabled={isZipLoading}
                  placeholder="Ex: 78000-000"
                  onAccept={(value: string) => field.onChange(value)}
                  onBlur={(e: any) => {
                    field.onBlur();
                    handleZipBlur(e.target.value);
                  }}
                  inputRef={field.ref}
                  className={cn(MASKED_INPUT_CLASSNAME, isZipLoading && "pr-8")}
                />
                {isZipLoading && (
                  <Loader2 className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>
            )}
          />
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
        <FieldRow cols={3}>
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
        </FieldRow>
        <FieldRow cols={3}>
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

      <FormActionBar>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Salvar
        </Button>
      </FormActionBar>
    </form>
  );
}
