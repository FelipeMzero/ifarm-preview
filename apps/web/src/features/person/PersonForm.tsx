import {
  FIELD_LIMITS,
  PersonType,
  isNotFoundError,
  personSchema,
  type PersonInput,
} from "@ifarm/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { MaskedInput } from "@/components/our/MaskedInput";

import { personClient } from "@/lib/clients";
import { ErrorPage } from "@/components/our/ErrorPage";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/our/FormField";
import { FieldRow } from "@/components/our/FieldRow";

import { SearchCombobox } from "@/components/our/SearchCombobox";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { BR_STATE_ITEMS } from "@ifarm/shared";
import { PERSON_TYPE_ITEMS, MARITAL_STATUS_ITEMS } from "@ifarm/shared";
import { FormActionBar } from "@/components/our/FormActionBar";
import { cn } from "@/lib/utils";
import { applyServerErrors } from "@/lib/form-errors";
import { useZipCodeLookup } from "../address/useZipCodeLookup";
import { FormSkeleton } from "@/components/our/PageSkeletons";
import { personDetailQuery, personKeys } from "./queries";

const PHONE_MASK = [{ mask: "(00) 0000-0000" }, { mask: "(00) 00000-0000" }];

type PersonFormProps = {
  id?: string;
  title?: string;
  onCancel?: () => void;
  onSuccess?: (newId?: string) => void;
};

export function PersonForm({
  id,
  title,
  onCancel,
  onSuccess,
}: PersonFormProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Pessoa em edição (só com id).
  const {
    data: person,
    error,
    isPending,
    refetch,
  } = useQuery({
    ...personDetailQuery(id ?? ""),
    enabled: !!id,
  });

  const save = useMutation({
    mutationFn: (data: PersonInput) =>
      id
        ? personClient.updatePerson(id, data)
        : personClient.createPerson(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personKeys.all });
    },
  });

  const {
    handleSubmit,
    control,
    reset,
    setValue,
    setError,
    formState: { isSubmitting },
  } = useForm<PersonInput>({
    resolver: zodResolver(personSchema),
    // Dados da pessoa em edição. Se forem buscados de novo em segundo plano, só os campos que o
    // usuário não alterou são atualizados (keepDirtyValues).
    values: person,
    resetOptions: { keepDirtyValues: true },
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

  const type = useWatch({ control, name: "type" });
  const isCompany = type === PersonType.COMPANY;

  // Ao sair do campo de CEP: preenche o endereço.
  const zipLookup = useZipCodeLookup({
    setAddressField: (field, value) =>
      setValue(field, value, { shouldValidate: true }),
  });

  async function onSubmit(data: PersonInput) {
    try {
      if (id) {
        await save.mutateAsync(data);
        // Volta o formulário ao estado "sem alterações", com os dados salvos (e o cache junto).
        const fresh = await queryClient.query(personDetailQuery(id));
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

  if (id && !person) {
    // Não existe mais (ex.: excluída por outra pessoa): tentar de novo não adianta.
    if (isNotFoundError(error)) {
      return (
        <ErrorPage
          title="Pessoa não encontrada"
          message="Ela pode ter sido excluída."
          onBack={() => navigate("/pessoas")}
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
              <MaskedInput
                field={field}
                mask={isCompany ? "00.000.000/0000-00" : "000.000.000-00"}
                unmask
                id={fieldId}
                disabled={!!id}
                placeholder={
                  isCompany ? "Ex: 12.345.678/0001-90" : "Ex: 123.456.789-00"
                }
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
              <MaskedInput
                field={field}
                mask={PHONE_MASK}
                unmask
                id={fieldId}
                placeholder="Ex: (11) 91234-5678"
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
