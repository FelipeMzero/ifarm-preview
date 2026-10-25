import {
  useFieldArray,
  useFormState,
  useWatch,
  type Control,
  type UseFormSetValue,
} from "react-hook-form";
import { CircleAlert, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormField } from "@/components/our/FormField";
import { FieldRow } from "@/components/our/FieldRow";
import { SelectField } from "@/components/our/SelectField";
import { SEX_ITEMS } from "@ifarm/shared";
import {
  COST_SPLIT_LABELS,
  PRICING_LABELS,
  ReceivedCount,
  formatBRL,
} from "./display";
import type { PurchasePayload as PurchaseFormData } from "@ifarm/shared";
import {
  type PurchaseCategory,
  type PurchaseCostSplit,
  type PurchasePricingType,
} from "@ifarm/shared";

const PRICING_ITEMS = (
  Object.keys(PRICING_LABELS) as PurchasePricingType[]
).map((value) => ({ value, label: PRICING_LABELS[value] }));

type Breed = { id: string; name: string };

const kg = (v: number) =>
  `${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`;

// Soma do peso de chegada dos recebidos: sugestão para o peso faturado de uma compra
// "pesada na chegada". Só pode ser usada com todos os recebidos pesados.
function ArrivalWeightHint({
  index,
  control,
  setValue,
  arrival,
  locked,
}: {
  index: number;
  control: Control<PurchaseFormData>;
  setValue: UseFormSetValue<PurchaseFormData>;
  arrival: PurchaseCategory["arrivalWeight"];
  locked: boolean;
}) {
  const shrink = useWatch({
    control,
    name: `categories.${index}.shrinkPercent`,
  });
  if (!arrival.received) return null;
  const complete = arrival.weighed === arrival.received;

  function use() {
    setValue(
      `categories.${index}.invoicedWeight`,
      String(Math.round(arrival.totalKg * 100) / 100),
      { shouldDirty: true },
    );
    // O peso de chegada já está sem a perda do transporte: aplicar a quebra de novo
    // descontaria duas vezes.
    if (shrink && Number(shrink) > 0) {
      setValue(`categories.${index}.shrinkPercent`, "", { shouldDirty: true });
      toast.info(
        "Quebra removida: o peso de chegada já está sem a perda do transporte.",
      );
    }
  }

  return (
    <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
      Soma na chegada:{" "}
      <span className="font-medium text-foreground">{kg(arrival.totalKg)}</span>
      ({arrival.weighed} de {arrival.received} recebidos pesados)
      {complete && !locked && (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0"
          onClick={use}
        >
          usar
        </Button>
      )}
    </p>
  );
}

function CategoryCard({
  index,
  control,
  setValue,
  breeds,
  saved,
  disabled,
  locked,
  onRemove,
}: {
  index: number;
  control: Control<PurchaseFormData>;
  setValue: UseFormSetValue<PurchaseFormData>;
  breeds: Breed[];
  /** Dados calculados da categoria já gravada (recebidos, valor, custo). */
  saved?: PurchaseCategory;
  disabled: boolean;
  /** Compra paga: o que define o valor (forma de preço, preços, peso) não muda. */
  locked: boolean;
  onRemove: () => void;
}) {
  const pricingType = useWatch({
    control,
    name: `categories.${index}.pricingType`,
  });
  const received = saved?.receivedQuantity ?? 0;

  return (
    <li className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-xs">
          {index + 1}
        </span>
        <span className="flex-1 text-sm font-medium">
          {saved?.label ?? "Nova categoria"}
        </span>
        {saved && (
          <span className="text-sm text-muted-foreground">
            Recebidos:{" "}
            <ReceivedCount
              received={received}
              expected={saved.expectedQuantity}
            />
          </span>
        )}
        {!disabled && !locked && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title={
              received
                ? "Categoria com animais recebidos não pode ser removida"
                : "Remover categoria"
            }
            disabled={received > 0}
            className="text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      <FieldRow cols={4}>
        <FormField
          name={`categories.${index}.sex`}
          control={control}
          label="Sexo"
          required
          render={({ field, id }) => (
            <SelectField
              id={id}
              value={field.value}
              onValueChange={field.onChange}
              items={SEX_ITEMS}
              className="w-full"
            />
          )}
        />
        <FormField
          name={`categories.${index}.minAgeMonths`}
          control={control}
          label="Idade mín. (meses)"
          render={({ field, id }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              id={id}
              type="number"
              min={0}
              step={1}
            />
          )}
        />
        <FormField
          name={`categories.${index}.maxAgeMonths`}
          control={control}
          label="Idade máx. (meses)"
          render={({ field, id }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              id={id}
              type="number"
              min={0}
              step={1}
            />
          )}
        />
        <FormField
          name={`categories.${index}.breedId`}
          control={control}
          label="Raça"
          render={({ field, id }) => (
            <SelectField
              id={id}
              value={field.value ?? ""}
              onValueChange={field.onChange}
              items={[
                { value: "", label: "Não informada" },
                ...breeds.map((b) => ({ value: b.id, label: b.name })),
              ]}
              className="w-full"
            />
          )}
        />
      </FieldRow>

      <FieldRow cols={4}>
        <FormField
          name={`categories.${index}.expectedQuantity`}
          control={control}
          label="Quantidade"
          required
          render={({ field, id }) => (
            <Input {...field} id={id} type="number" min={1} step={1} />
          )}
        />
        <FormField
          name={`categories.${index}.pricingType`}
          control={control}
          label="Forma de preço"
          required
          render={({ field, id }) => (
            <SelectField
              id={id}
              value={field.value}
              onValueChange={field.onChange}
              items={PRICING_ITEMS}
              className="w-full"
              disabled={locked}
            />
          )}
        />
        {pricingType === "LUMP_SUM" ? (
          <FormField
            name={`categories.${index}.totalPrice`}
            control={control}
            label="Valor total (R$)"
            required
            render={({ field, id }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                id={id}
                type="number"
                min={0}
                step="0.01"
                disabled={locked}
              />
            )}
          />
        ) : (
          <FormField
            name={`categories.${index}.unitPrice`}
            control={control}
            label={
              pricingType === "PER_HEAD"
                ? "Preço por cabeça (R$)"
                : "Preço da arroba (R$)"
            }
            required
            render={({ field, id }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                id={id}
                type="number"
                min={0}
                step="0.01"
                disabled={locked}
              />
            )}
          />
        )}
        {pricingType === "PER_ARROBA" && (
          <FieldRow cols={2}>
            <FormField
              name={`categories.${index}.invoicedWeight`}
              control={control}
              label="Peso faturado (kg)"
              helperText="Base do pagamento: peso de embarque (da nota) ou, se a compra for pesada na chegada, a soma dos pesos de chegada. Pode ficar em branco até o pagamento."
              render={({ field, id }) => (
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id={id}
                  type="number"
                  min={0}
                  step="0.01"
                  disabled={locked}
                />
              )}
            />
            <FormField
              name={`categories.${index}.shrinkPercent`}
              control={control}
              label="Quebra (%)"
              helperText="Desconto acordado sobre o peso de origem (perda no jejum e no transporte). Não se aplica ao peso de chegada."
              render={({ field, id }) => (
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id={id}
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  disabled={locked}
                />
              )}
            />
          </FieldRow>
        )}
      </FieldRow>

      {pricingType === "PER_ARROBA" && saved && (
        <ArrivalWeightHint
          index={index}
          control={control}
          setValue={setValue}
          arrival={saved.arrivalWeight}
          locked={locked || disabled}
        />
      )}

      {pricingType === "LUMP_SUM" && (
        <FormField
          name={`categories.${index}.costSplit`}
          control={control}
          label="Rateio do valor entre os animais"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={(v) => field.onChange(v as PurchaseCostSplit)}
              onBlur={field.onBlur}
              className="flex flex-row flex-wrap gap-6"
            >
              {(Object.keys(COST_SPLIT_LABELS) as PurchaseCostSplit[]).map(
                (value) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 text-sm"
                  >
                    <RadioGroupItem value={value} />
                    {COST_SPLIT_LABELS[value]}
                  </label>
                ),
              )}
            </RadioGroup>
          )}
        />
      )}

      {saved && (saved.estimatedValue != null || saved.costTotal != null) && (
        <p className="flex flex-wrap gap-x-6 text-sm text-muted-foreground">
          {saved.estimatedValue != null && (
            <span>
              {saved.costTotal != null ? "Valor" : "Valor estimado"}:{" "}
              <span className="font-medium text-foreground">
                {formatBRL(saved.estimatedValue)}
              </span>
            </span>
          )}
          {saved.costTotal != null && received > 0 && (
            <span>
              Custo rateado ({received} animais):{" "}
              <span className="font-medium text-foreground">
                {formatBRL(saved.costTotal)}
              </span>
            </span>
          )}
        </p>
      )}
    </li>
  );
}

export function CategoriesEditor({
  control,
  setValue,
  breeds,
  saved,
  disabled,
  locked,
}: {
  control: Control<PurchaseFormData>;
  setValue: UseFormSetValue<PurchaseFormData>;
  breeds: Breed[];
  saved: PurchaseCategory[];
  disabled: boolean;
  /** Compra paga: categorias e valores bloqueados. */
  locked: boolean;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "categories",
    keyName: "key",
  });
  const { errors } = useFormState({ control, name: "categories" });
  const listError =
    errors.categories?.message ?? errors.categories?.root?.message;
  const savedById = new Map(saved.map((c) => [c.id, c]));

  return (
    <div className="space-y-3">
      <ol className="space-y-3">
        {fields.map((field, index) => (
          <CategoryCard
            key={field.key}
            index={index}
            control={control}
            setValue={setValue}
            breeds={breeds}
            saved={field.id != null ? savedById.get(field.id) : undefined}
            disabled={disabled}
            locked={locked}
            onRemove={() => remove(index)}
          />
        ))}
      </ol>

      {listError && (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <CircleAlert className="size-4" /> {listError}
        </p>
      )}

      {!disabled && !locked && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              sex: "MALE",
              minAgeMonths: "",
              maxAgeMonths: "",
              breedId: "",
              expectedQuantity: "",
              pricingType: "PER_HEAD",
              unitPrice: "",
              totalPrice: "",
              invoicedWeight: "",
              shrinkPercent: "",
              costSplit: "EQUAL",
              notes: "",
            })
          }
        >
          <Plus className="size-4" /> Categoria
        </Button>
      )}
    </div>
  );
}
