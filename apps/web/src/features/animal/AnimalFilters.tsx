import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { SelectField, SelectFieldItem } from "@/components/our/SelectField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { batchClient } from "@/lib/clients";
import { breedClient } from "@/lib/clients";
import {
  ANIMAL_ORIGIN_ITEMS,
  ANIMAL_STATUS_ITEMS,
  SEX_ITEMS,
} from "@ifarm/shared";

// Filtros da lista de animais. "" = sem filtro. Os valores são os da API.
export type AnimalListFilters = {
  status: string; // AnimalStatus; "" = todos. Padrão: ACTIVE.
  batchId: string; // uuid ou "none" (sem lote)
  sex: string;
  neutered: string; // "true" | "false"
  ageRange: string; // "upTo12" | "12to24" | "over24" | "unknown"
  breedId: string;
  origin: string;
  minWeight: string;
  maxWeight: string;
};

// Estado inicial da lista: só animais ativos.
export const DEFAULT_FILTERS: AnimalListFilters = {
  status: "ACTIVE",
  batchId: "",
  sex: "",
  neutered: "",
  ageRange: "",
  breedId: "",
  origin: "",
  minWeight: "",
  maxWeight: "",
};

const NEUTERED_ITEMS: SelectFieldItem[] = [
  { value: "true", label: "Castrado" },
  { value: "false", label: "Não castrado" },
];

const AGE_RANGE_ITEMS: SelectFieldItem[] = [
  { value: "upTo12", label: "Até 12 meses" },
  { value: "12to24", label: "12 a 24 meses" },
  { value: "over24", label: "Acima de 24 meses" },
  { value: "unknown", label: "Não informada" },
];

type UrlFilterKey = Exclude<keyof AnimalListFilters, "status">;

// Parâmetros da URL (em português) ↔ valores da API. O status é tratado à parte:
// ausente = Ativo (padrão); "todos" = sem filtro.
const URL_PARAMS: Record<UrlFilterKey, string> = {
  batchId: "lote",
  sex: "sexo",
  neutered: "castrado",
  ageRange: "idade",
  breedId: "raca",
  origin: "origem",
  minWeight: "pesoMin",
  maxWeight: "pesoMax",
};

const URL_VALUES: Partial<Record<UrlFilterKey, Record<string, string>>> = {
  batchId: { none: "sem" },
  sex: { MALE: "macho", FEMALE: "femea" },
  neutered: { true: "sim", false: "nao" },
  ageRange: {
    upTo12: "ate12",
    "12to24": "12a24",
    over24: "mais24",
    unknown: "sem",
  },
};

export function filtersFromQuery(
  query: Record<string, string | string[] | undefined>,
): AnimalListFilters {
  const filters = { ...DEFAULT_FILTERS };
  const status = Array.isArray(query.status) ? query.status[0] : query.status;
  if (status === "todos") filters.status = "";
  else if (ANIMAL_STATUS_ITEMS.some((i) => i.value === status))
    filters.status = status!;
  for (const key of Object.keys(URL_PARAMS) as UrlFilterKey[]) {
    const raw = query[URL_PARAMS[key]];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value) continue;
    const mapping = URL_VALUES[key];
    const apiValue = mapping
      ? Object.entries(mapping).find(([, url]) => url === value)?.[0]
      : undefined;
    filters[key] = apiValue ?? value;
  }
  return filters;
}

export function filtersToQuery(
  filters: AnimalListFilters,
  query: URLSearchParams,
) {
  if (filters.status !== DEFAULT_FILTERS.status) {
    query.set("status", filters.status || "todos");
  }
  for (const key of Object.keys(URL_PARAMS) as UrlFilterKey[]) {
    const value = filters[key];
    if (value) query.set(URL_PARAMS[key], URL_VALUES[key]?.[value] ?? value);
  }
}

// O status só conta quando difere do padrão (Ativo).
export function countActiveFilters(filters: AnimalListFilters) {
  const { status, minWeight, maxWeight, ...rest } = filters;
  return (
    Object.values(rest).filter(Boolean).length +
    (minWeight || maxWeight ? 1 : 0) +
    (status !== DEFAULT_FILTERS.status ? 1 : 0)
  );
}

export type FilterOptions = {
  batches: SelectFieldItem[];
  breeds: SelectFieldItem[];
};

// Lotes vigentes da propriedade e todas as raças (ativas ou não), para o painel e
// para os rótulos das etiquetas.
export function useFilterOptions(propertyId?: string): FilterOptions {
  const [options, setOptions] = useState<FilterOptions>({
    batches: [],
    breeds: [],
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      batchClient.getBatches({ propertyId, status: "active", pageSize: 100 }),
      breedClient.getBreeds(),
    ])
      .then(([batches, breeds]) => {
        if (cancelled) return;
        setOptions({
          batches: batches.data.map((b) => ({ value: b.id, label: b.name })),
          breeds: breeds.map((b) => ({ value: b.id, label: b.name })),
        });
      })
      .catch(() => {
        // Sem as opções o painel mostra só os filtros fixos.
      });
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  return options;
}

const labelOf = (items: SelectFieldItem[], value: string) =>
  items.find((i) => i.value === value)?.label ?? value;

function formatWeightRange(min: string, max: string) {
  if (min && max) return `${min} a ${max} kg`;
  if (min) return `a partir de ${min} kg`;
  return `até ${max} kg`;
}

// Etiquetas removíveis dos filtros ativos.
export function ActiveFilterChips({
  filters,
  options,
  onChange,
}: {
  filters: AnimalListFilters;
  options: FilterOptions;
  onChange: (filters: AnimalListFilters) => void;
}) {
  const batchItems = [{ value: "none", label: "Sem lote" }, ...options.batches];
  const chips: {
    key: string;
    label: string;
    clear: Partial<AnimalListFilters>;
  }[] = [];

  // Status sempre visível. Removê-lo alterna entre o padrão (Ativo) e todos.
  chips.push(
    filters.status
      ? {
          key: "status",
          label: `Status: ${labelOf(ANIMAL_STATUS_ITEMS, filters.status)}`,
          clear: { status: "" },
        }
      : {
          key: "status",
          label: "Status: Todos",
          clear: { status: DEFAULT_FILTERS.status },
        },
  );
  if (filters.batchId)
    chips.push({
      key: "batch",
      label: `Lote: ${labelOf(batchItems, filters.batchId)}`,
      clear: { batchId: "" },
    });
  if (filters.sex)
    chips.push({
      key: "sex",
      label: labelOf(SEX_ITEMS, filters.sex),
      clear: { sex: "" },
    });
  if (filters.neutered)
    chips.push({
      key: "neutered",
      label: labelOf(NEUTERED_ITEMS, filters.neutered),
      clear: { neutered: "" },
    });
  if (filters.ageRange)
    chips.push({
      key: "age",
      label: `Idade: ${labelOf(AGE_RANGE_ITEMS, filters.ageRange)}`,
      clear: { ageRange: "" },
    });
  if (filters.breedId)
    chips.push({
      key: "breed",
      label: `Raça: ${labelOf(options.breeds, filters.breedId)}`,
      clear: { breedId: "" },
    });
  if (filters.origin)
    chips.push({
      key: "origin",
      label: `Origem: ${labelOf(ANIMAL_ORIGIN_ITEMS, filters.origin)}`,
      clear: { origin: "" },
    });
  if (filters.minWeight || filters.maxWeight)
    chips.push({
      key: "weight",
      label: `Peso: ${formatWeightRange(filters.minWeight, filters.maxWeight)}`,
      clear: { minWeight: "", maxWeight: "" },
    });

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Badge key={chip.key} variant="secondary" className="h-6 gap-1 pr-1">
          {chip.label}
          <button
            type="button"
            className="rounded-full p-0.5 hover:bg-foreground/10"
            aria-label={`Remover filtro ${chip.label}`}
            onClick={() => onChange({ ...filters, ...chip.clear })}
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      {countActiveFilters(filters) > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={() => onChange(DEFAULT_FILTERS)}
        >
          Limpar filtros
        </Button>
      )}
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

// As listas dos seletores abrem num portal fora do popover; clicar nelas não deve
// ser tratado como "clique fora" (que fecharia o popover).
function isInsideComboboxList(target: EventTarget | null) {
  return (
    target instanceof Element &&
    target.closest('[data-slot="combobox-content"]') !== null
  );
}

// Balão ancorado no botão de filtros. As mudanças valem na hora (sem "aplicar").
export function AnimalFiltersPopover({
  filters,
  options,
  onChange,
  children,
}: {
  filters: AnimalListFilters;
  options: FilterOptions;
  onChange: (filters: AnimalListFilters) => void;
  /** Botão que abre o balão. */
  children: React.ReactNode;
}) {
  const set = (patch: Partial<AnimalListFilters>) =>
    onChange({ ...filters, ...patch });
  const all = (label: string) => ({ value: "", label });

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-96 max-w-[calc(100vw-2rem)] gap-0 p-0"
        onInteractOutside={(e) => {
          if (isInsideComboboxList(e.target)) e.preventDefault();
        }}
      >
        <div className="border-b border-border px-4 py-3">
          <p className="font-medium">Filtros</p>
          <p className="text-xs text-muted-foreground">
            Valem junto com a busca.
          </p>
        </div>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            <FilterField label="Status">
              <SelectField
                className="w-full min-w-0"
                value={filters.status}
                onValueChange={(status) => set({ status })}
                items={[all("Todos"), ...ANIMAL_STATUS_ITEMS]}
              />
            </FilterField>
            <FilterField label="Faixa etária">
              <SelectField
                className="w-full min-w-0"
                value={filters.ageRange}
                onValueChange={(ageRange) => set({ ageRange })}
                items={[all("Todas"), ...AGE_RANGE_ITEMS]}
              />
            </FilterField>
          </div>

          <FilterField label="Lote">
            <SelectField
              className="w-full"
              value={filters.batchId}
              onValueChange={(batchId) => set({ batchId })}
              searchable
              searchPlaceholder="Buscar lote..."
              items={[
                all("Todos os lotes"),
                { value: "none", label: "Sem lote" },
                ...options.batches,
              ]}
            />
          </FilterField>

          <div className="grid grid-cols-2 gap-3">
            <FilterField label="Sexo">
              <SelectField
                className="w-full min-w-0"
                value={filters.sex}
                onValueChange={(sex) => set({ sex })}
                items={[all("Todos"), ...SEX_ITEMS]}
              />
            </FilterField>
            <FilterField label="Castração">
              <SelectField
                className="w-full min-w-0"
                value={filters.neutered}
                onValueChange={(neutered) => set({ neutered })}
                items={[all("Todos"), ...NEUTERED_ITEMS]}
              />
            </FilterField>
          </div>

          <FilterField label="Peso atual (kg)">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                step="any"
                placeholder="Mínimo"
                value={filters.minWeight}
                onChange={(e) => set({ minWeight: e.target.value })}
              />
              <span className="text-muted-foreground">a</span>
              <Input
                type="number"
                min={0}
                step="any"
                placeholder="Máximo"
                value={filters.maxWeight}
                onChange={(e) => set({ maxWeight: e.target.value })}
              />
            </div>
          </FilterField>

          <div className="grid grid-cols-2 gap-3">
            <FilterField label="Raça">
              <SelectField
                className="w-full min-w-0"
                value={filters.breedId}
                onValueChange={(breedId) => set({ breedId })}
                searchable
                searchPlaceholder="Buscar raça..."
                items={[all("Todas"), ...options.breeds]}
              />
            </FilterField>
            <FilterField label="Origem">
              <SelectField
                className="w-full min-w-0"
                value={filters.origin}
                onValueChange={(origin) => set({ origin })}
                items={[all("Todas"), ...ANIMAL_ORIGIN_ITEMS]}
              />
            </FilterField>
          </div>
        </div>

        <div className="flex justify-end border-t border-border px-4 py-3">
          <Button
            variant="secondary"
            disabled={countActiveFilters(filters) === 0}
            onClick={() => onChange(DEFAULT_FILTERS)}
          >
            Limpar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
