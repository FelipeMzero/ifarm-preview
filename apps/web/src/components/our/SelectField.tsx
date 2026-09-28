"use client";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

export type SelectFieldItem = { value: string; label: string };

type SelectFieldProps = {
  value: string;
  onValueChange: (value: string) => void;
  items: SelectFieldItem[];
  placeholder?: string;
  /** Mostra um campo de busca no topo da lista (útil com muitas opções). */
  searchable?: boolean;
  searchPlaceholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
};

export function SelectField({
  value,
  onValueChange,
  items,
  placeholder,
  searchable = false,
  searchPlaceholder = "Buscar...",
  id,
  className,
  disabled,
  ...props
}: SelectFieldProps) {
  return (
    <Combobox
      items={items}
      disabled={disabled}
      // "" sem item correspondente = nada selecionado (mostra o placeholder).
      value={value === "" && !items.some((i) => i.value === "") ? null : value}
      onValueChange={(val) => onValueChange((val as string) ?? "")}
      itemToStringLabel={(val: string) =>
        items.find((item) => item.value === val)?.label ?? val
      }
      // Sem busca a lista fica fixa; com busca usa o filtro padrão pelo rótulo.
      filter={searchable ? undefined : null}
    >
      <ComboboxTrigger
        id={id}
        className={cn(
          "flex h-10 min-w-44 items-center justify-between rounded-lg border border-input bg-input/30 px-2.5 py-1 text-base transition-colors outline-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "aria-invalid:border-destructive aria-invalid:focus:ring-3 aria-invalid:ring-destructive/20",
          "md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          "disabled:cursor-not-allowed disabled:opacity-50 data-disabled:cursor-not-allowed data-disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {/* O placeholder é texto puro (sem elemento próprio): o span dá o mesmo tom
            apagado do placeholder dos inputs, para não parecer um valor escolhido. */}
        <ComboboxValue
          placeholder={
            placeholder != null ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : undefined
          }
        />
      </ComboboxTrigger>
      <ComboboxContent>
        {searchable && (
          <ComboboxInput showTrigger={false} placeholder={searchPlaceholder} />
        )}
        <ComboboxEmpty>
          {searchable ? "Nenhum resultado" : "Não há itens"}
        </ComboboxEmpty>
        <ComboboxList>
          {(item: SelectFieldItem) => (
            <ComboboxItem key={item.value} value={item.value}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
